import { prisma } from "@/lib/prisma";
import { LEAD_STATUSES, PROPERTY_STATUSES } from "@/lib/constants";

/**
 * Konversiya hunisi hesabatı (#105).
 *
 * İki hissə:
 * - **Dövr hunisi** — son N gündə gələn müraciətlərin nə qədəri əlaqəyə, işə və
 *   tamamlanmaya çatıb; mənbə üzrə bölgü və rezervasiyalar.
 * - **Elan cədvəli** — ən çox baxılan dərc olunmuş elanlar üzrə baxış → favorit →
 *   müraciət. `viewCount` kumulyativdir (dövrə bağlı deyil), ona görə cədvəl elanın
 *   bütün ömrünü göstərir və bu, səhifədə açıq yazılır.
 *
 * Anonim favoritlər brauzerdə saxlanır və sayılmır — favorit sütunu yalnız hesablı
 * istifadəçiləri göstərir.
 */

const DAY = 24 * 60 * 60 * 1000;
/** Bu qədər baxışı olub müraciəti olmayan elan «diqqət» siyahısına düşür. */
export const ATTENTION_MIN_VIEWS = 50;
const LISTING_ROWS = 20;

/** Faiz — məxrəc sıfırdırsa `null` (0% ilə «məlumat yoxdur» qarışmasın). */
export function rate(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

export type ListingFunnelRow = {
  id: string;
  title: string;
  slug: string;
  views: number;
  favorites: number;
  leads: number;
  reservations: number;
  leadRate: number | null;
  needsAttention: boolean;
};

export function toListingRow(property: {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  _count: { favorites: number; leads: number; reservations: number };
}): ListingFunnelRow {
  return {
    id: property.id,
    title: property.title,
    slug: property.slug,
    views: property.viewCount,
    favorites: property._count.favorites,
    leads: property._count.leads,
    reservations: property._count.reservations,
    leadRate: rate(property._count.leads, property.viewCount),
    needsAttention: property.viewCount >= ATTENTION_MIN_VIEWS && property._count.leads === 0,
  };
}

export async function getConversionReport(days = 30) {
  const since = new Date(Date.now() - days * DAY);
  const leadWhere = { createdAt: { gte: since } };

  const [leadTotal, byStatus, bySource, reservations, listings] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.groupBy({ by: ["status"], where: leadWhere, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["source"], where: leadWhere, _count: { _all: true } }),
    prisma.reservation.count({ where: { createdAt: { gte: since } } }),
    prisma.property.findMany({
      where: { deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED, isDemo: false },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        _count: { select: { favorites: true, leads: true, reservations: true } },
      },
      orderBy: { viewCount: "desc" },
      take: LISTING_ROWS,
    }),
  ]);

  const statusCount = (status: string) => byStatus.find((row) => row.status === status)?._count._all ?? 0;
  // Huni mərhələləri kumulyativdir: «işdə» olan müraciət əlaqə mərhələsini də keçib.
  const completed = statusCount(LEAD_STATUSES.COMPLETED);
  const inProgress = statusCount(LEAD_STATUSES.IN_PROGRESS) + completed;
  const contacted = statusCount(LEAD_STATUSES.CONTACTED) + inProgress;

  return {
    days,
    stages: [
      { key: "received", count: leadTotal, rate: leadTotal > 0 ? 100 : null },
      { key: "contacted", count: contacted, rate: rate(contacted, leadTotal) },
      { key: "inProgress", count: inProgress, rate: rate(inProgress, leadTotal) },
      { key: "completed", count: completed, rate: rate(completed, leadTotal) },
    ] as const,
    closed: statusCount(LEAD_STATUSES.CLOSED),
    waiting: statusCount(LEAD_STATUSES.NEW),
    sources: bySource
      .map((row) => ({ source: row.source, count: row._count._all, share: rate(row._count._all, leadTotal) }))
      .sort((left, right) => right.count - left.count),
    reservations,
    listings: listings.map(toListingRow),
  };
}

export type ConversionReport = Awaited<ReturnType<typeof getConversionReport>>;
