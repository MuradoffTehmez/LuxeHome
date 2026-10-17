import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { bakuDay } from "@/lib/listing-stats";
import { ACTIVE_MEMBER_WHERE } from "@/lib/accounts/agency-access";
import {
  ACTIVE_OFFER_STATUSES,
  ANALYTICS_PERIODS,
  LEAD_STAGES,
  LISTING_TYPES,
  PROPERTY_STATUSES,
  REVIEW_STATUSES,
} from "@/lib/constants";

/**
 * Agentlik analitikası (#234, PRD 11.1, 11.2, 11.4, 11.5).
 *
 * Hamısı agentliyin mühitinə aid elan və müraciətlərdəndir (`Property.agencyId`, `Lead.agencyId`).
 * Metriklər ayrıdır (PRD 11.7): baxış/klik `PropertyDailyStat`-dan (bot süzgəcindən keçmiş), müraciət
 * `Lead`-dən, tamamlanmış əməliyyat isə **yalnız** sistemdə təsdiqlənmiş bağlanmadan (`closedAt` +
 * `SOLD`/`RENTED` status) — admin yazdığı və ya avtomatik uğur göstəriciləri sayılmır.
 */

export const ANALYTICS_MAX_RANGE_DAYS = 366;

export type AnalyticsRange = { fromDay: string; toDay: string; fromAt: Date; toAt: Date; days: number; preset: number | null };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Tarix intervalı: `?dovr=7|30|90` və ya `?dan=YYYY-MM-DD&ad=YYYY-MM-DD` (Bakı günləri, daxil).
 * Yanlış, tərs və ya `ANALYTICS_MAX_RANGE_DAYS`-dan uzun interval 30 günlük defolta düşür.
 */
export function parseAnalyticsRange(params: { dovr?: string; dan?: string; ad?: string }, now = new Date()): AnalyticsRange {
  const today = bakuDay(now);
  const preset = (days: number): AnalyticsRange => {
    const fromDay = bakuDay(new Date(now.getTime() - (days - 1) * 86_400_000));
    return { fromDay, toDay: today, fromAt: dayStart(fromDay), toAt: dayEnd(today), days, preset: days };
  };
  if (params.dan && params.ad && DAY.test(params.dan) && DAY.test(params.ad)) {
    const from = dayStart(params.dan);
    const to = dayEnd(params.ad > today ? today : params.ad);
    // `YYYY-MM-DD` qaydaya uyğun olsa da mövcud olmayan tarix (2026-02-31) yuvarlanır — bərpa yoxlaması.
    const valid = bakuDay(from) === params.dan && !Number.isNaN(to.getTime());
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    if (valid && days >= 1 && days <= ANALYTICS_MAX_RANGE_DAYS) {
      return { fromDay: params.dan, toDay: bakuDay(to), fromAt: from, toAt: to, days, preset: null };
    }
  }
  const number = Number(params.dovr);
  return preset((ANALYTICS_PERIODS as readonly number[]).includes(number) ? number : 30);
}

function dayStart(day: string) {
  return new Date(`${day}T00:00:00+04:00`);
}

function dayEnd(day: string) {
  return new Date(new Date(`${day}T00:00:00+04:00`).getTime() + 86_400_000 - 1);
}

/** Agentliyin müraciəti (`agency-dashboard.ts` ilə eyni qayda): birbaşa bağlı və ya bağlanmamış köhnə müraciət agentlik elanında. */
function agencyLeadWhere(agencyId: string): Prisma.LeadWhereInput {
  return { OR: [{ agencyId }, { agencyId: null, property: { agencyId } }] };
}

/** Median (dəqiqə) — boş siyahıda `null`. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/** Qiymət intervalları (AZN): satış və kirayə ayrı şkaladadır. */
export const PRICE_BUCKETS = {
  [LISTING_TYPES.SALE]: [0, 100_000, 200_000, 350_000, 500_000],
  [LISTING_TYPES.RENT]: [0, 500, 1_000, 2_000, 3_500],
} as const;

export function priceBucket(listingType: string, price: number): { listingType: string; from: number; to: number | null } {
  const edges = listingType === LISTING_TYPES.RENT ? PRICE_BUCKETS.RENT : PRICE_BUCKETS.SALE;
  let index = 0;
  for (let i = 0; i < edges.length; i += 1) if (price >= edges[i]) index = i;
  return { listingType: listingType === LISTING_TYPES.RENT ? LISTING_TYPES.RENT : LISTING_TYPES.SALE, from: edges[index], to: edges[index + 1] ?? null };
}

export async function getAgencyAnalytics(input: { agencyId: string; ownerUserId: string; range: AnalyticsRange; now?: Date }) {
  const now = input.now ?? new Date();
  const { agencyId, range } = input;
  const listingWhere = { agencyId, deletedAt: null } satisfies Prisma.PropertyWhereInput;
  const inRange = { gte: range.fromAt, lte: range.toAt };
  const leadWhere: Prisma.LeadWhereInput = { AND: [agencyLeadWhere(agencyId), { createdAt: inRange }] };

  const [members, totalListings, activeListings, listings, leads, newClients, departed] = await Promise.all([
    prisma.agencyEmployee.findMany({
      where: { agencyId, ...ACTIVE_MEMBER_WHERE, user: { isActive: true } },
      select: { userId: true, user: { select: { name: true, agentProfile: { select: { id: true } } } } },
      orderBy: { approvedAt: "asc" },
    }),
    prisma.property.count({ where: listingWhere }),
    prisma.property.count({ where: { ...listingWhere, status: { in: ACTIVE_OFFER_STATUSES } } }),
    prisma.property.findMany({
      where: listingWhere,
      select: {
        id: true, authorId: true, createdById: true, status: true, listingType: true, price: true, typeId: true,
        cityId: true, districtId: true, createdAt: true, publishedAt: true, closedAt: true,
      },
    }),
    prisma.lead.findMany({
      where: leadWhere,
      select: {
        id: true, handlerId: true, createdAt: true, respondedAt: true, stage: true,
        property: { select: { listingType: true, price: true, typeId: true, cityId: true, districtId: true } },
      },
    }),
    prisma.crmClient.count({ where: { agencyId, createdAt: inRange } }),
    // Bazardan çıxan elanlar (bağlanma və ya müddət bitməsi) — orta aktivlik müddəti üçün.
    prisma.property.findMany({
      where: { ...listingWhere, publishedAt: { not: null }, OR: [{ closedAt: inRange }, { expiredAt: inRange }] },
      select: { publishedAt: true, closedAt: true, expiredAt: true },
    }),
  ]);

  const ids = listings.map((listing) => listing.id);
  const [statsByProperty, daily, viewingActivities, reviewStats] = await Promise.all([
    findManyInChunks(ids, 2, (chunk) =>
      prisma.propertyDailyStat.groupBy({
        by: ["propertyId"],
        where: { propertyId: { in: chunk }, day: { gte: range.fromDay, lte: range.toDay } },
        _sum: { views: true, contactReveals: true, whatsappClicks: true, telegramClicks: true },
      })),
    findManyInChunks(ids, 2, (chunk) =>
      prisma.propertyDailyStat.groupBy({
        by: ["day"],
        where: { propertyId: { in: chunk }, day: { gte: range.fromDay, lte: range.toDay } },
        _sum: { views: true, contactReveals: true, whatsappClicks: true, telegramClicks: true },
      })),
    // Planlaşdırılan görüş: müraciət kartında «Görüş planlaşdırılıb» mərhələsinə keçid (#222).
    prisma.leadActivity.findMany({
      where: {
        type: "STAGE",
        createdAt: inRange,
        details: { contains: `"to":"${LEAD_STAGES.VIEWING_SCHEDULED}"` },
        lead: agencyLeadWhere(agencyId),
      },
      select: { actorId: true },
    }),
    prisma.agentReview.groupBy({
      by: ["agentId"],
      where: { status: REVIEW_STATUSES.APPROVED, agent: { agencyId } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  // 11.1 — ümumi göstəricilər
  const stat = new Map(statsByProperty.map((row) => [row.propertyId, row._sum]));
  let views = 0;
  let clicks = 0;
  for (const row of statsByProperty) {
    views += row._sum.views ?? 0;
    clicks += (row._sum.contactReveals ?? 0) + (row._sum.whatsappClicks ?? 0) + (row._sum.telegramClicks ?? 0);
  }
  const closedInRange = listings.filter((listing) => listing.closedAt && listing.closedAt >= range.fromAt && listing.closedAt <= range.toAt);
  const sold = closedInRange.filter((listing) => listing.status === PROPERTY_STATUSES.SOLD).length;
  const rented = closedInRange.filter((listing) => listing.status === PROPERTY_STATUSES.RENTED).length;
  const durations = departed.flatMap((listing) => {
    const end = listing.closedAt ?? listing.expiredAt;
    return listing.publishedAt && end ? [(end.getTime() - listing.publishedAt.getTime()) / 86_400_000] : [];
  });
  const averageActiveDays = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null;

  // 11.5 — gün üzrə seriya (boş günlər sıfırla)
  // `findManyInChunks` hər hissə üçün ayrıca `groupBy(["day"])` qaytarır — eyni günün sətirləri toplanır,
  // yoxsa 88+ elanlı agentlikdə qrafik yalnız son hissəni göstərərdi.
  const byDay = new Map<string, { views: number; contactReveals: number; whatsappClicks: number; telegramClicks: number }>();
  for (const row of daily) {
    const current = byDay.get(row.day) ?? { views: 0, contactReveals: 0, whatsappClicks: 0, telegramClicks: 0 };
    current.views += row._sum.views ?? 0;
    current.contactReveals += row._sum.contactReveals ?? 0;
    current.whatsappClicks += row._sum.whatsappClicks ?? 0;
    current.telegramClicks += row._sum.telegramClicks ?? 0;
    byDay.set(row.day, current);
  }
  const leadsByDay = new Map<string, number>();
  for (const lead of leads) {
    const day = bakuDay(lead.createdAt);
    leadsByDay.set(day, (leadsByDay.get(day) ?? 0) + 1);
  }
  const series = Array.from({ length: range.days }, (_, index) => {
    const day = bakuDay(new Date(range.fromAt.getTime() + index * 86_400_000 + 12 * 3_600_000));
    const sum = byDay.get(day);
    return {
      day,
      views: sum?.views ?? 0,
      clicks: (sum?.contactReveals ?? 0) + (sum?.whatsappClicks ?? 0) + (sum?.telegramClicks ?? 0),
      leads: leadsByDay.get(day) ?? 0,
    };
  });

  // 11.2 — agent performansı (sahib + aktiv üzvlər)
  const owner = await prisma.user.findUnique({ where: { id: input.ownerUserId }, select: { name: true, agentProfile: { select: { id: true } } } });
  const team = [
    { userId: input.ownerUserId, name: owner?.name ?? "—", profileId: owner?.agentProfile?.id ?? null, isOwner: true },
    ...members.map((member) => ({ userId: member.userId, name: member.user.name, profileId: member.user.agentProfile?.id ?? null, isOwner: false })),
  ];
  const reviewsByProfile = new Map(reviewStats.map((row) => [row.agentId, { count: row._count._all, average: row._avg.rating }]));
  const viewingsBy = new Map<string, number>();
  for (const activity of viewingActivities) if (activity.actorId) viewingsBy.set(activity.actorId, (viewingsBy.get(activity.actorId) ?? 0) + 1);
  const agents = team.map((member) => {
    const placed = listings.filter((listing) => (listing.createdById ?? listing.authorId) === member.userId && listing.createdAt >= range.fromAt && listing.createdAt <= range.toAt).length;
    const active = listings.filter((listing) => listing.authorId === member.userId && (ACTIVE_OFFER_STATUSES as readonly string[]).includes(listing.status)).length;
    const handled = leads.filter((lead) => lead.handlerId === member.userId);
    const responded = handled.filter((lead) => lead.respondedAt);
    const responseMinutes = median(responded.map((lead) => Math.max(0, Math.round((lead.respondedAt!.getTime() - lead.createdAt.getTime()) / 60_000))));
    const deals = closedInRange.filter((listing) => listing.authorId === member.userId).length;
    const reviews = member.profileId ? reviewsByProfile.get(member.profileId) : undefined;
    return {
      userId: member.userId,
      name: member.name,
      isOwner: member.isOwner,
      placed,
      active,
      leads: handled.length,
      responded: responded.length,
      responseMinutes,
      viewings: viewingsBy.get(member.userId) ?? 0,
      deals,
      reviewCount: reviews?.count ?? 0,
      reviewAverage: reviews?.average != null ? Math.round(reviews.average * 10) / 10 : null,
    };
  });

  // 11.4 — ərazilər, növlər və qiymət intervalları
  const areaOf = (listing: { districtId: string | null; cityId: string | null }) => listing.districtId ?? listing.cityId ?? null;
  const areas = new Map<string, { listings: number; views: number; leads: number }>();
  const bump = (key: string | null, field: "listings" | "views" | "leads", by = 1) => {
    if (!key || by === 0) return;
    const current = areas.get(key) ?? { listings: 0, views: 0, leads: 0 };
    current[field] += by;
    areas.set(key, current);
  };
  for (const listing of listings) {
    if ((ACTIVE_OFFER_STATUSES as readonly string[]).includes(listing.status)) bump(areaOf(listing), "listings");
    bump(areaOf(listing), "views", stat.get(listing.id)?.views ?? 0);
  }
  const typeLeads = new Map<string, number>();
  const priceLeads = new Map<string, { listingType: string; from: number; to: number | null; leads: number }>();
  for (const lead of leads) {
    if (!lead.property) continue;
    bump(areaOf(lead.property), "leads");
    typeLeads.set(lead.property.typeId, (typeLeads.get(lead.property.typeId) ?? 0) + 1);
    const bucket = priceBucket(lead.property.listingType, lead.property.price);
    const key = `${bucket.listingType}:${bucket.from}`;
    const current = priceLeads.get(key) ?? { ...bucket, leads: 0 };
    current.leads += 1;
    priceLeads.set(key, current);
  }
  const [places, types] = await Promise.all([
    findManyInChunks([...areas.keys()], 0, (chunk) => prisma.location.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true } })),
    findManyInChunks([...typeLeads.keys()], 0, (chunk) => prisma.propertyType.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true } })),
  ]);
  const placeName = new Map(places.map((place) => [place.id, place.name]));
  const typeName = new Map(types.map((type) => [type.id, type.name]));

  return {
    range,
    totals: {
      totalListings,
      activeListings,
      sold,
      rented,
      views,
      clicks,
      leads: leads.length,
      newClients,
      averageActiveDays,
    },
    series,
    agents,
    areas: [...areas.entries()]
      .map(([id, value]) => ({ id, name: placeName.get(id) ?? "—", ...value }))
      .sort((a, b) => b.leads - a.leads || b.views - a.views || b.listings - a.listings)
      .slice(0, 15),
    leadTypes: [...typeLeads.entries()].map(([id, count]) => ({ id, name: typeName.get(id) ?? "—", leads: count })).sort((a, b) => b.leads - a.leads),
    priceInterest: [...priceLeads.values()].sort((a, b) => a.listingType.localeCompare(b.listingType) || a.from - b.from),
    generatedAt: now,
  };
}

export type AgencyAnalytics = Awaited<ReturnType<typeof getAgencyAnalytics>>;
