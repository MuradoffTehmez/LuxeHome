import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { buildPropertyWhere } from "@/lib/queries";
import { MIN_COMPARABLES, medianOf } from "@/lib/stats";
import { ACTIVE_OFFER_STATUSES, LISTING_TYPES, LOCATION_CHILD_KINDS, PRICE_PERIODS } from "@/lib/constants";
import { compareAzerbaijani } from "@/lib/az-collation";

/**
 * Ərazi səhifəsinin məlumat bloku (#240, PRD 12.4): aktiv/satış/kirayə sayı, elanlardan hesablanan
 * qiymət statistikası (median; `MIN_COMPARABLES`-dən az nümunədə göstərilmir — uydurulmuş rəqəm
 * yoxdur), növ üzrə bölgü və əlaqəli ərazilər. Hamısı ictimai elan şərtindəndir (`buildPropertyWhere`) və
 * yalnız aktiv təkliflərdir (`ACTIVE_OFFER_STATUSES`) — landing siyahısı kimi satılmış/kirayəyə verilmiş elan sayılmır.
 */

/** Median nümunəsi: ərazinin ən təzə 500 aktiv elanı — böyük şəhərdə sorğu yüngül və nəticə sabit qalır. */
const PRICE_SAMPLE = 500;
const RELATED_LIMIT = 8;

export type AreaKind = "DISTRICT" | "CITY";

export async function getAreaInsights(input: { kind: AreaKind; location: { id: string; slug: string; parentId?: string | null } }) {
  const { kind, location } = input;
  const active = { status: { in: ACTIVE_OFFER_STATUSES } };
  const where = { AND: [await buildPropertyWhere(kind === "CITY" ? { citySlug: location.slug } : { districtSlug: location.slug }), active] };

  const [byListingType, byType, sales, rents, relatedCandidates] = await Promise.all([
    prisma.property.groupBy({ by: ["listingType"], where, _count: { _all: true } }),
    prisma.property.groupBy({ by: ["typeId"], where, _count: { _all: true } }),
    prisma.property.findMany({
      where: { AND: [where, { listingType: LISTING_TYPES.SALE, currency: "AZN", area: { gt: 0 } }] },
      select: { price: true, area: true },
      // Müəyyən nümunə: ən təzə `PRICE_SAMPLE` aktiv elan (sırasız `take` sorğu planından asılı olardı).
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: PRICE_SAMPLE,
    }),
    prisma.property.findMany({
      where: { AND: [where, { listingType: LISTING_TYPES.RENT, currency: "AZN", OR: [{ pricePeriod: PRICE_PERIODS.MONTH }, { pricePeriod: null }] }] },
      select: { price: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: PRICE_SAMPLE,
    }),
    // Əlaqəli ərazilər: şəhər üçün alt ərazilər; rayon/qəsəbə üçün qonşular (eyni valideyn) və alt ərazilər.
    prisma.location.findMany({
      where: {
        kind: { in: LOCATION_CHILD_KINDS },
        id: { not: location.id },
        OR: [{ parentId: location.id }, ...(kind === "DISTRICT" && location.parentId ? [{ parentId: location.parentId }] : [])],
      },
      select: { id: true, name: true, slug: true, kind: true },
    }),
  ]);

  const count = (type: string) => byListingType.find((row) => row.listingType === type)?._count._all ?? 0;
  const sale = count(LISTING_TYPES.SALE);
  const rent = count(LISTING_TYPES.RENT);

  const types = await findManyInChunks(byType.map((row) => row.typeId), 0, (chunk) =>
    prisma.propertyType.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true, slug: true } }));
  const typeOf = new Map(types.map((type) => [type.id, type]));

  // Əlaqəli ərazilərin aktiv elan sayı (ictimai şərtlə); elanı olmayan ərazi linklənmir (boş səhifə).
  // Elan ən dərin seçilmiş yerdə saxlanılır: rayonun sayına birbaşa uşaqları (qəsəbə, massiv) da daxildir —
  // `/rayon/<slug>` filtri (`districtSlug`) eyni bir pilləni əhatə edir.
  const candidateIds = relatedCandidates.map((item) => item.id);
  const children = await findManyInChunks(candidateIds, 1, (chunk) =>
    prisma.location.findMany({ where: { parentId: { in: chunk }, kind: { in: LOCATION_CHILD_KINDS } }, select: { id: true, parentId: true } }));
  const rollup = new Map<string, string>(candidateIds.map((id) => [id, id]));
  for (const child of children) if (child.parentId && !rollup.has(child.id)) rollup.set(child.id, child.parentId);
  const publicWhere = { AND: [await buildPropertyWhere({}), active] };
  const relatedCounts = await findManyInChunks([...rollup.keys()], 20, (chunk) =>
    prisma.property.groupBy({ by: ["districtId"], where: { AND: [publicWhere, { districtId: { in: chunk } }] }, _count: { _all: true } }));
  const relatedCount = new Map<string, number>();
  for (const row of relatedCounts) {
    const target = row.districtId ? rollup.get(row.districtId) : undefined;
    if (target) relatedCount.set(target, (relatedCount.get(target) ?? 0) + row._count._all);
  }

  const pricePerSqm = medianOf(sales.map((item) => item.price / item.area!));
  const monthlyRent = medianOf(rents.map((item) => item.price));
  return {
    total: sale + rent,
    sale,
    rent,
    salePricePerSqm: sales.length >= MIN_COMPARABLES && pricePerSqm != null ? Math.round(pricePerSqm) : null,
    saleSample: sales.length,
    monthlyRent: rents.length >= MIN_COMPARABLES && monthlyRent != null ? Math.round(monthlyRent) : null,
    rentSample: rents.length,
    types: byType
      .map((row) => ({ ...(typeOf.get(row.typeId) ?? { id: row.typeId, name: "—", slug: "" }), count: row._count._all }))
      .filter((row) => row.slug)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    related: relatedCandidates
      .map((item) => ({ ...item, count: relatedCount.get(item.id) ?? 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count || compareAzerbaijani(a.name, b.name))
      .slice(0, RELATED_LIMIT),
  };
}

export type AreaInsights = Awaited<ReturnType<typeof getAreaInsights>>;
