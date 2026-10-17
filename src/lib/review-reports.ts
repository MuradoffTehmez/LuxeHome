import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/media/upload-record";
import {
  REVIEW_REPORT_COMMENT_MAX,
  REVIEW_REPORT_KINDS,
  REVIEW_REPORT_REASONS,
  REVIEW_REPORT_STATUSES,
  REVIEW_STATUSES,
  type ReviewReportKind,
  type ReviewReportReason,
} from "@/lib/constants";

/**
 * Rəydən şikayət (#232, PRD 10.5). Şikayət yalnız ictimai (təsdiqlənmiş) rəyə yazılır, istifadəçinin
 * rəy başına bir şikayəti olur (unikal indeks). Moderator qərarı rəydəki bütün açıq şikayətləri
 * birlikdə bağlayır: «gizlət» rəyi `HIDDEN` edir (ictimai reytinqdən çıxır), «rədd et» rəyi saxlayır.
 */

export function isReviewReportKind(value: unknown): value is ReviewReportKind {
  return typeof value === "string" && (REVIEW_REPORT_KINDS as readonly string[]).includes(value);
}

export function isReviewReportReason(value: unknown): value is ReviewReportReason {
  return typeof value === "string" && (REVIEW_REPORT_REASONS as readonly string[]).includes(value);
}

async function approvedReview(kind: ReviewReportKind, reviewId: string) {
  return kind === "agent"
    ? prisma.agentReview.findFirst({ where: { id: reviewId, status: REVIEW_STATUSES.APPROVED }, select: { id: true, customerId: true } })
    : prisma.agencyReview.findFirst({ where: { id: reviewId, status: REVIEW_STATUSES.APPROVED }, select: { id: true, customerId: true } });
}

export async function createReviewReport(input: {
  reporterId: string;
  kind: unknown;
  reviewId: string;
  reason: unknown;
  comment?: string | null;
}): Promise<"created" | "duplicate" | "notFound" | "invalid" | "own"> {
  if (!isReviewReportKind(input.kind) || !isReviewReportReason(input.reason)) return "invalid";
  const comment = (input.comment ?? "").trim().slice(0, REVIEW_REPORT_COMMENT_MAX);
  // «Digər səbəb» izahsız mənasızdır — moderator nəyə baxacağını bilməlidir.
  if (input.reason === "OTHER" && comment.length < 5) return "invalid";
  const review = await approvedReview(input.kind, input.reviewId.slice(0, 40));
  if (!review) return "notFound";
  if (review.customerId === input.reporterId) return "own";
  try {
    await prisma.reviewReport.create({
      data: { reviewKind: input.kind, reviewId: review.id, reporterId: input.reporterId, reason: input.reason, comment: comment || null },
    });
    return "created";
  } catch (error) {
    if (isUniqueViolation(error)) return "duplicate";
    throw error;
  }
}

export type ReviewReportGroup = {
  kind: ReviewReportKind;
  reviewId: string;
  targetName: string;
  customerName: string;
  rating: number;
  comment: string;
  reports: { id: string; reason: ReviewReportReason; comment: string | null; createdAt: Date }[];
};

/** Admin növbəsi: açıq şikayətlər rəy üzrə qruplaşdırılır, ən çox şikayət olunan yuxarıda. */
export async function getReviewReportQueue(): Promise<ReviewReportGroup[]> {
  const reports = await prisma.reviewReport.findMany({
    where: { status: REVIEW_REPORT_STATUSES.OPEN },
    orderBy: { createdAt: "asc" },
    take: 300,
  });
  const ids = (kind: ReviewReportKind) => [...new Set(reports.filter((item) => item.reviewKind === kind).map((item) => item.reviewId))];
  const [agentReviews, agencyReviews] = await Promise.all([
    ids("agent").length
      ? prisma.agentReview.findMany({ where: { id: { in: ids("agent").slice(0, 98) } }, select: { id: true, customerName: true, rating: true, comment: true, status: true, agent: { select: { name: true } } } })
      : [],
    ids("agency").length
      ? prisma.agencyReview.findMany({ where: { id: { in: ids("agency").slice(0, 98) } }, select: { id: true, customerName: true, rating: true, comment: true, status: true, agency: { select: { name: true } } } })
      : [],
  ]);
  const reviews = new Map<string, Omit<ReviewReportGroup, "reports">>();
  for (const review of agentReviews) reviews.set(`agent:${review.id}`, { kind: "agent", reviewId: review.id, targetName: review.agent.name, customerName: review.customerName, rating: review.rating, comment: review.comment });
  for (const review of agencyReviews) reviews.set(`agency:${review.id}`, { kind: "agency", reviewId: review.id, targetName: review.agency.name, customerName: review.customerName, rating: review.rating, comment: review.comment });

  const groups = new Map<string, ReviewReportGroup>();
  for (const report of reports) {
    const key = `${report.reviewKind}:${report.reviewId}`;
    const review = reviews.get(key);
    if (!review || !isReviewReportReason(report.reason)) continue;
    const group = groups.get(key) ?? { ...review, reports: [] };
    group.reports.push({ id: report.id, reason: report.reason, comment: report.comment, createdAt: report.createdAt });
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.reports.length - a.reports.length);
}

export async function countOpenReviewReports(): Promise<number> {
  return prisma.reviewReport.count({ where: { status: REVIEW_REPORT_STATUSES.OPEN } });
}

/**
 * Moderator qərarı. Əvvəl açıq şikayətlər şərti `updateMany` ilə götürülür (eyni anda iki moderator
 * eyni rəyə baxsa ikincisi heç nə götürmür və rəyə toxunmur), sonra rəy gizlədilir. Rəy yazılmasa
 * şikayətlər yenidən `OPEN` olur. Nəticədə bildiriş göndəriləcək şikayətçilər qaytarılır.
 *
 * Götürmə və geri qaytarma `id IN (…)` siyahısı ilə deyil, rəy + `resolvedAt` markeri ilə gedir: çox
 * şikayət olunan rəydə uzun siyahı D1-in 100 parametr həddini keçərdi.
 */
export async function resolveReviewReports(input: {
  kind: ReviewReportKind;
  reviewId: string;
  decision: "hide" | "dismiss";
  actorId: string;
  now?: Date;
}): Promise<{ reporters: string[]; slug: string | null } | null> {
  const now = input.now ?? new Date();
  const status = input.decision === "hide" ? REVIEW_REPORT_STATUSES.RESOLVED : REVIEW_REPORT_STATUSES.DISMISSED;
  const target = { reviewKind: input.kind, reviewId: input.reviewId };
  const claimed = await prisma.reviewReport.updateMany({
    where: { ...target, status: REVIEW_REPORT_STATUSES.OPEN },
    data: { status, resolvedById: input.actorId, resolvedAt: now },
  });
  if (claimed.count === 0) return null;
  // Bu qərarın götürdüyü şikayətlər — marker (`resolvedAt` + moderator) ilə, siyahısız.
  const mine = { ...target, status, resolvedById: input.actorId, resolvedAt: now };
  const open = await prisma.reviewReport.findMany({ where: mine, select: { reporterId: true } });

  let slug: string | null = null;
  try {
    if (input.kind === "agent") {
      const review = input.decision === "hide"
        ? await prisma.agentReview.update({ where: { id: input.reviewId }, data: { status: REVIEW_STATUSES.HIDDEN, moderatedAt: now }, select: { agent: { select: { slug: true } } } })
        : await prisma.agentReview.findUnique({ where: { id: input.reviewId }, select: { agent: { select: { slug: true } } } });
      slug = review?.agent.slug ?? null;
    } else {
      const review = input.decision === "hide"
        ? await prisma.agencyReview.update({ where: { id: input.reviewId }, data: { status: REVIEW_STATUSES.HIDDEN, moderatedAt: now }, select: { agency: { select: { slug: true } } } })
        : await prisma.agencyReview.findUnique({ where: { id: input.reviewId }, select: { agency: { select: { slug: true } } } });
      slug = review?.agency.slug ?? null;
    }
  } catch (error) {
    await prisma.reviewReport.updateMany({
      where: mine,
      data: { status: REVIEW_REPORT_STATUSES.OPEN, resolvedById: null, resolvedAt: null },
    });
    throw error;
  }
  return { reporters: [...new Set(open.map((item) => item.reporterId))], slug };
}
