import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { bakuDay } from "@/lib/listing-stats";
import {
  AGENCY_EMPLOYEE_STATUSES,
  ANALYTICS_PERIODS,
  PUBLIC_PROPERTY_STATUSES,
  type AnalyticsPeriod,
} from "@/lib/constants";

/**
 * Kabinet analitikası (#161, B2). Mənbələr:
 * - baxış, «Nömrəni göstər», WhatsApp — `PropertyDailyStat` (gündəlik, Bakı vaxtı);
 * - müraciət — `Lead.propertyId`, favorit — `Favorite.createdAt`.
 * Agentlik sahibi öz və təsdiqlənmiş agentlərinin elanlarını görür (agent filtri ilə).
 * Bazar müqayisəsi: eyni növ + şəhərdəki ictimai elanların dövr ərzində orta baxışı.
 */

const MAX_LISTINGS = 300;

export function parsePeriod(value: string | undefined): AnalyticsPeriod {
  const number = Number(value);
  return (ANALYTICS_PERIODS as readonly number[]).includes(number) ? (number as AnalyticsPeriod) : 30;
}

/** Dövrün ilk günü (Bakı vaxtı) və onun UTC anı. */
export function periodStart(period: AnalyticsPeriod, now = new Date()) {
  const day = bakuDay(new Date(now.getTime() - (period - 1) * 86_400_000));
  return { day, at: new Date(`${day}T00:00:00+04:00`) };
}

export type AnalyticsTotals = { views: number; contactReveals: number; whatsappClicks: number; telegramClicks: number; leads: number; favorites: number };

const emptyTotals = (): AnalyticsTotals => ({ views: 0, contactReveals: 0, whatsappClicks: 0, telegramClicks: 0, leads: 0, favorites: 0 });

async function analyticsAuthors(userId: string) {
  const agency = await prisma.agency.findUnique({ where: { userId }, select: { id: true } });
  if (!agency) return { isAgency: false, agencyId: null, members: [] as { userId: string; name: string }[] };
  const employees = await prisma.agencyEmployee.findMany({
    where: { agencyId: agency.id, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { userId: true, user: { select: { name: true } } },
    orderBy: { approvedAt: "asc" },
  });
  return { isAgency: true, agencyId: agency.id, members: employees.map((item) => ({ userId: item.userId, name: item.user.name })) };
}

type MarketRow = { typeId: string; cityId: string; listings: number; views: number };

/** Eyni növ + şəhərdə ictimai elan başına orta baxış (dövr ərzində). */
async function marketAverages(pairs: { typeId: string; cityId: string }[], sinceDay: string): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const types = [...new Set(pairs.map((pair) => pair.typeId))].slice(0, 40);
  const cities = [...new Set(pairs.map((pair) => pair.cityId))].slice(0, 40);
  if (types.length === 0 || cities.length === 0) return result;
  const statuses = PUBLIC_PROPERTY_STATUSES;
  const placeholders = (count: number) => Array.from({ length: count }, () => "?").join(", ");
  const rows = await prisma.$queryRawUnsafe<MarketRow[]>(
    `SELECT p."typeId" AS typeId, p."cityId" AS cityId, COUNT(DISTINCT p."id") AS listings, COALESCE(SUM(s."views"), 0) AS views
       FROM "Property" p
       LEFT JOIN "PropertyDailyStat" s ON s."propertyId" = p."id" AND s."day" >= ?
      WHERE p."deletedAt" IS NULL AND p."status" IN (${placeholders(statuses.length)})
        AND p."typeId" IN (${placeholders(types.length)}) AND p."cityId" IN (${placeholders(cities.length)})
      GROUP BY p."typeId", p."cityId"`,
    sinceDay,
    ...statuses,
    ...types,
    ...cities,
  );
  for (const row of rows) {
    const listings = Number(row.listings);
    if (listings > 0) result.set(`${row.typeId}:${row.cityId}`, Number(row.views) / listings);
  }
  return result;
}

export async function getListingAnalytics(input: {
  userId: string;
  userName: string;
  period: AnalyticsPeriod;
  /** Agentlik sahibi üçün agent filtri; komandada olmayan id nəzərə alınmır. */
  agentUserId?: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const start = periodStart(input.period, now);
  const { isAgency, agencyId, members } = await analyticsAuthors(input.userId);
  const team = isAgency ? [{ userId: input.userId, name: input.userName }, ...members] : [];
  const authorIds = isAgency
    ? team.some((member) => member.userId === input.agentUserId) ? [input.agentUserId!] : team.map((member) => member.userId)
    : [input.userId];

  const listings = (await findManyInChunks(authorIds, 2, (chunk) =>
    prisma.property.findMany({
      // Sahib yalnız agentlik elanlarını görür — agentin şəxsi elanı ona aiddir (#210, PRD 6.3).
      where: { authorId: { in: chunk }, deletedAt: null, ...(agencyId ? { agencyId } : {}) },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        typeId: true,
        cityId: true,
        viewCount: true,
        authorId: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  )).slice(0, MAX_LISTINGS);
  const ids = listings.map((listing) => listing.id);

  const [stats, leads, favorites, daily, market] = await Promise.all([
    findManyInChunks(ids, 1, (chunk) =>
      prisma.propertyDailyStat.groupBy({
        by: ["propertyId"],
        where: { propertyId: { in: chunk }, day: { gte: start.day } },
        _sum: { views: true, contactReveals: true, whatsappClicks: true, telegramClicks: true },
      })),
    findManyInChunks(ids, 1, (chunk) =>
      prisma.lead.groupBy({ by: ["propertyId"], where: { propertyId: { in: chunk }, createdAt: { gte: start.at } }, _count: { _all: true } })),
    findManyInChunks(ids, 1, (chunk) =>
      prisma.favorite.groupBy({ by: ["propertyId"], where: { propertyId: { in: chunk }, createdAt: { gte: start.at } }, _count: { _all: true } })),
    findManyInChunks(ids, 1, (chunk) =>
      prisma.propertyDailyStat.groupBy({
        by: ["day"],
        where: { propertyId: { in: chunk }, day: { gte: start.day } },
        _sum: { views: true, contactReveals: true },
      })),
    marketAverages(
      listings.filter((listing) => (PUBLIC_PROPERTY_STATUSES as readonly string[]).includes(listing.status)),
      start.day,
    ),
  ]);

  const statOf = new Map(stats.map((row) => [row.propertyId, row._sum]));
  const leadOf = new Map(leads.flatMap((row) => (row.propertyId ? [[row.propertyId, row._count._all] as const] : [])));
  const favoriteOf = new Map(favorites.map((row) => [row.propertyId, row._count._all]));

  const totals = emptyTotals();
  const rows = listings.map((listing) => {
    const sum = statOf.get(listing.id);
    const row = {
      ...listing,
      views: sum?.views ?? 0,
      contactReveals: sum?.contactReveals ?? 0,
      whatsappClicks: sum?.whatsappClicks ?? 0,
      telegramClicks: sum?.telegramClicks ?? 0,
      leads: leadOf.get(listing.id) ?? 0,
      favorites: favoriteOf.get(listing.id) ?? 0,
      marketViews: market.get(`${listing.typeId}:${listing.cityId}`) ?? null,
    };
    totals.views += row.views;
    totals.contactReveals += row.contactReveals;
    totals.whatsappClicks += row.whatsappClicks;
    totals.telegramClicks += row.telegramClicks;
    totals.leads += row.leads;
    totals.favorites += row.favorites;
    return row;
  });
  rows.sort((a, b) => b.views - a.views || b.leads - a.leads || b.viewCount - a.viewCount);

  // Gün üzrə seriya — boş günlər də sıfırla göstərilir ki, qrafik dövrü düz əks etdirsin.
  const byDay = new Map<string, { views: number; contactReveals: number }>();
  for (const row of daily) {
    const current = byDay.get(row.day) ?? { views: 0, contactReveals: 0 };
    current.views += row._sum.views ?? 0;
    current.contactReveals += row._sum.contactReveals ?? 0;
    byDay.set(row.day, current);
  }
  const series = Array.from({ length: input.period }, (_, index) => {
    const day = bakuDay(new Date(start.at.getTime() + index * 86_400_000 + 12 * 3_600_000));
    return { day, ...(byDay.get(day) ?? { views: 0, contactReveals: 0 }) };
  });

  return { period: input.period, isAgency, team, agentUserId: authorIds.length === 1 && isAgency ? authorIds[0] : null, totals, rows, series };
}
