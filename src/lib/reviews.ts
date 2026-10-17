import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  REVIEW_BURST_LIMIT,
  REVIEW_CRITERIA,
  REVIEW_NEW_ACCOUNT_DAYS,
  REVIEW_REPLY_MAX,
  REVIEW_STATUSES,
  REVIEW_SUSPICION_FLAGS,
  type ReviewCriterion,
  type ReviewSuspicionFlag,
} from "@/lib/constants";

/**
 * Agent və agentlik rəylərinin ortaq qaydaları (#230, PRD 10.4, 10.5): beş meyar, hesab
 * yoxlanışı, təsdiqlənmiş qarşılıqlı əlaqə və moderatora göstərilən şübhə siqnalları.
 *
 * İctimai reytinq yalnız moderatorun təsdiqlədiyi rəylərdən qurulur — avtomatik və ya
 * təsdiqlənməmiş uğur göstəricilərindən deyil (PRD 10.5, «Vacib»).
 */

const stars = z.coerce.number().int().min(1).max(5);

export const reviewSchema = z.object({
  communication: stars,
  accuracy: stars,
  responsiveness: stars,
  professionalism: stars,
  overall: stars,
  comment: z.string().trim().min(20).max(2000),
  serviceType: z.string().trim().max(80).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export function parseReviewForm(formData: FormData) {
  return reviewSchema.safeParse({
    communication: formData.get("communication"),
    accuracy: formData.get("accuracy"),
    responsiveness: formData.get("responsiveness"),
    professionalism: formData.get("professionalism"),
    overall: formData.get("overall") ?? formData.get("rating"),
    comment: formData.get("comment"),
    serviceType: formData.get("serviceType") || undefined,
  });
}

/** Bazaya yazılan sahələr: `rating` ümumi məmnunluqdur. */
export function reviewRatingData(input: ReviewInput) {
  return {
    rating: input.overall,
    ratingCommunication: input.communication,
    ratingAccuracy: input.accuracy,
    ratingResponsiveness: input.responsiveness,
    ratingProfessionalism: input.professionalism,
    comment: input.comment,
    serviceType: input.serviceType || null,
  };
}

/** Hesab yoxlanışı (PRD 10.5): e-poçtu və ya telefonu təsdiqlənmiş aktiv hesab rəy yaza bilər. */
export async function isVerifiedReviewer(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true, emailVerifiedAt: true, verifiedPhone: true } });
  return Boolean(user?.isActive && (user.emailVerifiedAt || user.verifiedPhone));
}

/**
 * Təsdiqlənmiş qarşılıqlı əlaqə: rəy yazanın e-poçtu və ya təsdiqlənmiş telefonu ilə bu agentə
 * (`handlerId`) və ya agentliyə (`agencyId`, ya da agentlik elanına) göndərilmiş müraciət var.
 */
export async function hasVerifiedInteraction(input: { userId: string; agentUserId?: string | null; agencyId?: string | null }): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { email: true, verifiedPhone: true } });
  if (!user) return false;
  const target = [
    ...(input.agentUserId ? [{ handlerId: input.agentUserId }] : []),
    ...(input.agencyId ? [{ agencyId: input.agencyId }, { property: { agencyId: input.agencyId } }] : []),
  ];
  if (target.length === 0) return false;
  const identity = [{ email: user.email }, ...(user.verifiedPhone ? [{ phone: user.verifiedPhone }] : [])];
  const lead = await prisma.lead.findFirst({ where: { AND: [{ OR: identity }, { OR: target }] }, select: { id: true } });
  return Boolean(lead);
}

const normalizeComment = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

/** Moderatora göstərilən siqnallar — heç biri rəyi avtomatik rədd etmir. */
export async function reviewSuspicionFlags(input: {
  userId: string;
  comment: string;
  overall: number;
  verifiedInteraction: boolean;
  now?: Date;
}): Promise<ReviewSuspicionFlag[]> {
  const now = input.now ?? new Date();
  const since = new Date(now.getTime() - 86_400_000);
  const [user, agentRecent, agencyRecent, sameAgent, sameAgency] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId }, select: { createdAt: true } }),
    prisma.agentReview.count({ where: { customerId: input.userId, createdAt: { gte: since } } }),
    prisma.agencyReview.count({ where: { customerId: input.userId, createdAt: { gte: since } } }),
    prisma.agentReview.count({ where: { comment: input.comment, NOT: { customerId: input.userId } } }),
    prisma.agencyReview.count({ where: { comment: input.comment, NOT: { customerId: input.userId } } }),
  ]);
  const flags: ReviewSuspicionFlag[] = [];
  if (user && now.getTime() - user.createdAt.getTime() < REVIEW_NEW_ACCOUNT_DAYS * 86_400_000) flags.push(REVIEW_SUSPICION_FLAGS.NEW_ACCOUNT);
  // Bu rəy hələ yazılmayıb — mövcud sayğac + 1 həddə çatırsa partlayış sayılır.
  if (agentRecent + agencyRecent + 1 >= REVIEW_BURST_LIMIT) flags.push(REVIEW_SUSPICION_FLAGS.BURST);
  if (normalizeComment(input.comment).length > 0 && sameAgent + sameAgency > 0) flags.push(REVIEW_SUSPICION_FLAGS.DUPLICATE_TEXT);
  if (!input.verifiedInteraction && (input.overall === 1 || input.overall === 5)) flags.push(REVIEW_SUSPICION_FLAGS.NO_INTERACTION);
  return flags;
}

export function parseSuspicionFlags(raw: string | null | undefined): ReviewSuspicionFlag[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    const known = new Set<string>(Object.values(REVIEW_SUSPICION_FLAGS));
    return Array.isArray(value) ? value.filter((item): item is ReviewSuspicionFlag => typeof item === "string" && known.has(item)) : [];
  } catch {
    return [];
  }
}

type CriteriaRow = {
  rating: number;
  ratingCommunication: number | null;
  ratingAccuracy: number | null;
  ratingResponsiveness: number | null;
  ratingProfessionalism: number | null;
};

const COLUMN: Record<ReviewCriterion, keyof CriteriaRow> = {
  communication: "ratingCommunication",
  accuracy: "ratingAccuracy",
  responsiveness: "ratingResponsiveness",
  professionalism: "ratingProfessionalism",
  overall: "rating",
};

/** Hər meyar üzrə orta (bir onluq); köhnə tək-ulduzlu rəylər meyar ortasına düşmür. */
export function reviewCriteriaAverages(rows: CriteriaRow[]): { criterion: ReviewCriterion; average: number | null; count: number }[] {
  return REVIEW_CRITERIA.map((criterion) => {
    const values = rows.map((row) => row[COLUMN[criterion]]).filter((value): value is number => typeof value === "number");
    const average = values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null;
    return { criterion, average, count: values.length };
  });
}

/**
 * Cavab yaza biləcəyi təsdiqlənmiş rəylər (#230, PRD 10.5): agent öz profilinə yazılanlar, agentlik
 * sahibi agentliyə birbaşa yazılanlar. Moderasiyadan keçməmiş rəy cavablandırılmır.
 */
export async function getRespondableReviews(userId: string) {
  const [agentReviews, agencyReviews] = await Promise.all([
    prisma.agentReview.findMany({
      where: { status: REVIEW_STATUSES.APPROVED, agent: { userId } },
      select: { ...RESPONDABLE_SELECT, agent: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.agencyReview.findMany({
      where: { status: REVIEW_STATUSES.APPROVED, agency: { userId } },
      select: { ...RESPONDABLE_SELECT, agency: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return [
    ...agentReviews.map(({ agent, ...review }) => ({ ...review, kind: "agent" as const, targetName: agent.name })),
    ...agencyReviews.map(({ agency, ...review }) => ({ ...review, kind: "agency" as const, targetName: agency.name })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

const RESPONDABLE_SELECT = {
  id: true, rating: true, comment: true, customerName: true, createdAt: true, verifiedInteraction: true,
  replyText: true, repliedAt: true,
  ratingCommunication: true, ratingAccuracy: true, ratingResponsiveness: true, ratingProfessionalism: true,
} as const;

/** Cavabı yazır və ya (boş mətnlə) silir. Rəy yalnız təsdiqlənmiş və cavab verənə aid olmalıdır. */
export async function saveReviewReply(input: { userId: string; authorName: string; kind: "agent" | "agency"; reviewId: string; text: string }): Promise<"saved" | "cleared" | "notFound" | "invalid"> {
  const text = input.text.trim();
  if (text.length > REVIEW_REPLY_MAX || (text.length > 0 && text.length < 2)) return "invalid";
  const data = text
    ? { replyText: text, replyAuthorName: input.authorName.slice(0, 200), repliedAt: new Date() }
    : { replyText: null, replyAuthorName: null, repliedAt: null };
  const where = { id: input.reviewId, status: REVIEW_STATUSES.APPROVED };
  const { count } = input.kind === "agent"
    ? await prisma.agentReview.updateMany({ where: { ...where, agent: { userId: input.userId } }, data })
    : await prisma.agencyReview.updateMany({ where: { ...where, agency: { userId: input.userId } }, data });
  if (count === 0) return "notFound";
  return text ? "saved" : "cleared";
}
