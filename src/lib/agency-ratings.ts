import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { REVIEW_STATUSES } from "@/lib/constants";
import { reviewCriteriaAverages } from "@/lib/reviews";

/**
 * Agentlik reytinqi (#161, B7, #230): agentliyin ictimai agentlərinə yazılmış təsdiqlənmiş rəylər +
 * istifadəçilərin agentliyə birbaşa təsdiqlənmiş rəyləri (`AgencyReview`) + agentliyin özünə aid
 * təsdiqlənmiş müştəri rəyləri (`Testimonial.agencyId`). Orta qiymət rəy sayı ilə çəkilir — beş
 * rəyli agentlə bir rəyli agent eyni çəkidə sayılmır. Yalnız moderatorun təsdiqlədiyi rəylər sayılır.
 */

export type AgencyRating = { average: number; count: number };

type Bucket = { sum: number; count: number };

function add(map: Map<string, Bucket>, key: string, sum: number, count: number) {
  const current = map.get(key) ?? { sum: 0, count: 0 };
  map.set(key, { sum: current.sum + sum, count: current.count + count });
}

export async function getAgencyRatings(agencyIds: string[]): Promise<Map<string, AgencyRating>> {
  const result = new Map<string, AgencyRating>();
  if (agencyIds.length === 0) return result;

  const agents = await findManyInChunks(agencyIds, 1, (chunk) =>
    prisma.agentProfile.findMany({ where: { agencyId: { in: chunk }, isPublic: true }, select: { id: true, agencyId: true } }),
  );
  const agencyOfAgent = new Map(agents.flatMap((agent) => (agent.agencyId ? [[agent.id, agent.agencyId] as const] : [])));

  const [agentReviews, testimonials, agencyReviews] = await Promise.all([
    findManyInChunks([...agencyOfAgent.keys()], 1, (chunk) =>
      prisma.agentReview.groupBy({
        by: ["agentId"],
        where: { agentId: { in: chunk }, status: REVIEW_STATUSES.APPROVED },
        _sum: { rating: true },
        _count: { _all: true },
      })),
    findManyInChunks(agencyIds, 1, (chunk) =>
      prisma.testimonial.groupBy({
        by: ["agencyId"],
        where: { agencyId: { in: chunk }, status: REVIEW_STATUSES.APPROVED },
        _sum: { rating: true },
        _count: { _all: true },
      })),
    findManyInChunks(agencyIds, 1, (chunk) =>
      prisma.agencyReview.groupBy({
        by: ["agencyId"],
        where: { agencyId: { in: chunk }, status: REVIEW_STATUSES.APPROVED },
        _sum: { rating: true },
        _count: { _all: true },
      })),
  ]);

  const buckets = new Map<string, Bucket>();
  for (const row of agentReviews) {
    const agencyId = agencyOfAgent.get(row.agentId);
    if (agencyId) add(buckets, agencyId, row._sum.rating ?? 0, row._count._all);
  }
  for (const row of testimonials) {
    if (row.agencyId) add(buckets, row.agencyId, row._sum.rating ?? 0, row._count._all);
  }
  for (const row of agencyReviews) add(buckets, row.agencyId, row._sum.rating ?? 0, row._count._all);
  for (const [agencyId, bucket] of buckets) {
    if (bucket.count > 0) result.set(agencyId, { average: Math.round((bucket.sum / bucket.count) * 10) / 10, count: bucket.count });
  }
  return result;
}

export type AgencyReview = {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: Date;
  agentName: string | null;
  agentSlug: string | null;
  /** Rəy yazanın real müraciəti var (#230). Admin daxil etdiyi müştəri rəyində (`Testimonial`) yoxdur. */
  verifiedInteraction: boolean;
  replyText: string | null;
  replyAuthorName: string | null;
};

const REVIEW_SELECT = {
  id: true, rating: true, comment: true, customerName: true, createdAt: true,
  verifiedInteraction: true, replyText: true, replyAuthorName: true,
} as const;

/** Agentlik səhifəsindəki son rəylər — agentlərinə və agentliyin özünə yazılanlar birlikdə. */
export async function getAgencyReviews(agencyId: string, take = 6): Promise<AgencyReview[]> {
  const [agentReviews, testimonials, agencyReviews] = await Promise.all([
    prisma.agentReview.findMany({
      where: { status: REVIEW_STATUSES.APPROVED, agent: { agencyId, isPublic: true } },
      select: { ...REVIEW_SELECT, agent: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.testimonial.findMany({
      where: { status: REVIEW_STATUSES.APPROVED, agencyId },
      select: { id: true, rating: true, review: true, customerName: true, createdAt: true, occurredAt: true },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.agencyReview.findMany({
      where: { status: REVIEW_STATUSES.APPROVED, agencyId },
      select: REVIEW_SELECT,
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);
  return [
    ...agentReviews.map(({ agent, ...review }) => ({ ...review, agentName: agent.name, agentSlug: agent.slug })),
    ...agencyReviews.map((review) => ({ ...review, agentName: null, agentSlug: null })),
    ...testimonials.map((item) => ({
      id: item.id,
      rating: item.rating,
      comment: item.review,
      customerName: item.customerName,
      createdAt: item.occurredAt ?? item.createdAt,
      agentName: null,
      agentSlug: null,
      verifiedInteraction: false,
      replyText: null,
      replyAuthorName: null,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, take);
}

/** Agentliyə birbaşa təsdiqlənmiş rəylərin meyar ortalamaları (#230, PRD 10.4). */
export async function getAgencyCriteria(agencyId: string) {
  const rows = await prisma.agencyReview.findMany({
    where: { agencyId, status: REVIEW_STATUSES.APPROVED },
    select: { rating: true, ratingCommunication: true, ratingAccuracy: true, ratingResponsiveness: true, ratingProfessionalism: true },
  });
  return reviewCriteriaAverages(rows);
}
