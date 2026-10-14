import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { demoWhere } from "@/lib/demo-content";
import { findManyInChunks } from "@/lib/d1-chunks";
import { getAgencyOffices } from "@/lib/accounts/agency-offices";
import { propertyCardSelect, publicPropertyWhere } from "@/lib/queries";
import { AGENCY_EMPLOYEE_STATUSES, LISTING_TYPES, PUBLIC_PROPERTY_STATUSES, REVIEW_STATUSES, type SortOption } from "@/lib/constants";

/**
 * Agentlik və agentin ictimai statistikası və agentlik profil səhifəsi.
 *
 * Sayma qaydası (#155):
 *
 * - **Agentliyin təklifi** = sahib hesabın + təsdiqlənmiş əməkdaşların ictimai elanları.
 *   Əvvəl kataloq yalnız sahibin elanlarını sayırdı: agentlik səhifəsində 1 elan,
 *   kartda «0 elan» görünürdü.
 * - **Agentin elanı** = agentin öz yerləşdirdiyi (`authorId = userId`) + ona təyin
 *   edilmiş (`assignedAgentId`) elanlar, təkrarsız. Əvvəl yalnız təyin edilmişlər
 *   sayılırdı — agentin öz elanları nə kartda, nə profil səhifəsində görünürdü.
 */

/** Profil səhifəsində bir səhifədə göstərilən təklif sayı. */
export const AGENCY_OFFERS_PAGE_SIZE = 12;
/** «Fəaliyyət əraziləri» blokunda ən çox bu qədər yer. */
const SERVICE_AREA_LIMIT = 8;
/**
 * `IN (…)`-dan kənar bound parametrlər: `publicPropertyWhere()` — `deletedAt` + status
 * siyahısı + demo bayrağı. D1 sorğu başına 100 parametr qəbul edir.
 */
const RESERVED_PARAMS = PUBLIC_PROPERTY_STATUSES.length + 4;

export type OfferStats = { total: number; sale: number; rent: number };

const EMPTY_STATS: OfferStats = { total: 0, sale: 0, rent: 0 };

/** Agentliyin elan müəllifləri: sahib + təsdiqlənmiş əməkdaşlar. */
export async function agencyMemberIds(agencies: { id: string; userId: string }[]): Promise<Map<string, string[]>> {
  const members = new Map(agencies.map((agency) => [agency.id, [agency.userId]]));
  if (agencies.length === 0) return members;
  const employees = await findManyInChunks(agencies.map((agency) => agency.id), 1, (ids) =>
    prisma.agencyEmployee.findMany({
      where: { agencyId: { in: ids }, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
      select: { agencyId: true, userId: true },
    }),
  );
  for (const employee of employees) members.get(employee.agencyId)?.push(employee.userId);
  return members;
}

/** Hər agentlik üçün satış/kirayə təklif sayı (bir `groupBy`, hissələrlə). */
export async function countAgencyOffers(agencies: { id: string; userId: string }[]): Promise<Map<string, OfferStats>> {
  const members = await agencyMemberIds(agencies);
  const owner = new Map<string, string>();
  for (const [agencyId, userIds] of members) for (const userId of userIds) owner.set(userId, agencyId);
  const where = await publicPropertyWhere();
  const rows = await findManyInChunks([...owner.keys()], RESERVED_PARAMS, (ids) =>
    prisma.property.groupBy({
      by: ["authorId", "listingType"],
      where: { ...where, authorId: { in: ids } },
      _count: { _all: true },
    }),
  );
  const stats = new Map(agencies.map((agency) => [agency.id, { ...EMPTY_STATS }]));
  for (const row of rows) {
    const agencyId = row.authorId ? owner.get(row.authorId) : undefined;
    const entry = agencyId ? stats.get(agencyId) : undefined;
    if (!entry) continue;
    entry.total += row._count._all;
    if (row.listingType === LISTING_TYPES.SALE) entry.sale += row._count._all;
    if (row.listingType === LISTING_TYPES.RENT) entry.rent += row._count._all;
  }
  return stats;
}

/** Agentin elanları: özünün yerləşdirdikləri + ona təyin edilənlər. */
export function agentListingWhere(agent: { id: string; userId: string | null }): Prisma.PropertyWhereInput {
  return agent.userId
    ? { OR: [{ assignedAgentId: agent.id }, { authorId: agent.userId }] }
    : { assignedAgentId: agent.id };
}

/** Hər agent üçün təkrarsız elan sayı. Agentlər hissələrlə oxunur (D1 parametr limiti). */
export async function countAgentListings(agents: { id: string; userId: string | null }[]): Promise<Map<string, number>> {
  const counts = new Map(agents.map((agent) => [agent.id, 0]));
  if (agents.length === 0) return counts;
  const where = await publicPropertyWhere();
  // Hər agent iki parametr (id + userId) gətirir — 40-lıq hissə limitdən aşağı qalır.
  const chunks: { id: string; userId: string | null }[][] = [];
  for (let index = 0; index < agents.length; index += 40) chunks.push(agents.slice(index, index + 40));
  const rows = (await Promise.all(chunks.map((chunk) =>
    prisma.property.findMany({
      where: {
        ...where,
        OR: [
          { assignedAgentId: { in: chunk.map((agent) => agent.id) } },
          { authorId: { in: chunk.flatMap((agent) => (agent.userId ? [agent.userId] : [])) } },
        ],
      },
      select: { id: true, authorId: true, assignedAgentId: true },
    }),
  ))).flat();
  const byUser = new Map(agents.flatMap((agent) => (agent.userId ? [[agent.userId, agent.id] as const] : [])));
  const seen = new Map(agents.map((agent) => [agent.id, new Set<string>()]));
  for (const row of rows) {
    const owners = new Set<string>();
    if (row.assignedAgentId && seen.has(row.assignedAgentId)) owners.add(row.assignedAgentId);
    const authorAgent = row.authorId ? byUser.get(row.authorId) : undefined;
    if (authorAgent) owners.add(authorAgent);
    for (const agentId of owners) seen.get(agentId)?.add(row.id);
  }
  for (const [agentId, ids] of seen) counts.set(agentId, ids.size);
  return counts;
}

/** İctimai agentlik kataloqu (`/agentlikler`) — təklif statistikası ilə. */
export async function getPublicAgencyCatalog(options: { search?: string } = {}) {
  const search = options.search?.trim();
  const agencies = await prisma.agency.findMany({
    where: {
      isVerified: true,
      ...(await demoWhere()),
      user: { isActive: true },
      ...(search ? { name: { contains: search } } : {}),
    },
    select: {
      id: true,
      userId: true,
      name: true,
      slug: true,
      logoUrl: true,
      description: true,
      address: true,
      _count: { select: { agentProfiles: { where: { isPublic: true } } } },
    },
    orderBy: { name: "asc" },
  });
  const stats = await countAgencyOffers(agencies);
  return agencies
    .map((agency) => ({
      id: agency.id,
      name: agency.name,
      slug: agency.slug,
      logoUrl: agency.logoUrl,
      description: agency.description,
      address: agency.address,
      agentCount: agency._count.agentProfiles,
      offers: stats.get(agency.id) ?? { ...EMPTY_STATS },
    }))
    // Ən çox təklifi olan agentlik əvvəl — bina.az və Property Finder kimi.
    .sort((left, right) => right.offers.total - left.offers.total);
}

export type AgencyOfferFilters = {
  listingType?: string;
  typeSlug?: string;
  sort?: SortOption;
  page?: number;
};

function offerOrder(sort: SortOption | undefined): Prisma.PropertyOrderByWithRelationInput[] {
  if (sort === "price_asc") return [{ price: "asc" }];
  if (sort === "price_desc") return [{ price: "desc" }];
  if (sort === "area_desc") return [{ area: "desc" }];
  return [{ isFeatured: "desc" }, { publishedAt: "desc" }];
}

/**
 * Agentlik profil səhifəsi: profil, statistikalar, təkliflər (filtr + səhifələmə),
 * növ çipləri, fəaliyyət əraziləri və agentlər.
 */
export async function getAgencyProfile(slug: string, filters: AgencyOfferFilters = {}) {
  const agency = await prisma.agency.findFirst({
    where: { slug, isVerified: true, ...(await demoWhere()), user: { isActive: true } },
    select: {
      id: true,
      userId: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
      address: true,
      website: true,
      instagram: true,
      workingHours: true,
      phone: true,
      whatsapp: true,
      email: true,
      viewCount: true,
      createdAt: true,
      isDemo: true,
      user: { select: { companyTaxId: true } },
    },
  });
  if (!agency) return null;

  const members = (await agencyMemberIds([agency])).get(agency.id) ?? [agency.userId];
  const base: Prisma.PropertyWhereInput = { ...(await publicPropertyWhere()), authorId: { in: members } };
  const listingType = filters.listingType === LISTING_TYPES.SALE || filters.listingType === LISTING_TYPES.RENT
    ? filters.listingType
    : undefined;
  const where: Prisma.PropertyWhereInput = {
    ...base,
    ...(listingType ? { listingType } : {}),
    ...(filters.typeSlug ? { type: { slug: filters.typeSlug } } : {}),
  };
  const page = Math.max(1, filters.page ?? 1);

  const [properties, filteredCount, byListingType, byType, byDistrict, agents, offices] = await Promise.all([
    prisma.property.findMany({
      where,
      select: propertyCardSelect,
      orderBy: offerOrder(filters.sort),
      skip: (page - 1) * AGENCY_OFFERS_PAGE_SIZE,
      take: AGENCY_OFFERS_PAGE_SIZE,
    }),
    prisma.property.count({ where }),
    prisma.property.groupBy({ by: ["listingType"], where: base, _count: { _all: true } }),
    prisma.property.groupBy({
      by: ["typeId"],
      where: { ...base, ...(listingType ? { listingType } : {}) },
      _count: { _all: true },
    }),
    prisma.property.groupBy({ by: ["districtId", "cityId"], where: base, _count: { _all: true } }),
    prisma.agentProfile.findMany({
      where: { agencyId: agency.id, isPublic: true, ...(await demoWhere()) },
      include: {
        agency: { select: { name: true, slug: true } },
        reviews: { where: { status: REVIEW_STATUSES.APPROVED }, select: { rating: true } },
        _count: { select: { properties: true } },
      },
      orderBy: [{ isVerified: "desc" }, { name: "asc" }],
    }),
    // Filiallar (#157) — nömrə səhifədə maskalanır, tam dəyər `elaqe?ofis=` ilə açılır.
    getAgencyOffices(agency.id),
  ]);

  const stats: OfferStats = { ...EMPTY_STATS };
  for (const row of byListingType) {
    stats.total += row._count._all;
    if (row.listingType === LISTING_TYPES.SALE) stats.sale = row._count._all;
    if (row.listingType === LISTING_TYPES.RENT) stats.rent = row._count._all;
  }

  // Növ və ərazi adları ayrıca oxunur — groupBy əlaqə qaytarmır.
  const placeCounts = new Map<string, number>();
  for (const row of byDistrict) {
    const key = row.districtId ?? row.cityId;
    placeCounts.set(key, (placeCounts.get(key) ?? 0) + row._count._all);
  }
  const topPlaceIds = [...placeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, SERVICE_AREA_LIMIT);
  const [types, places] = await Promise.all([
    byType.length
      ? prisma.propertyType.findMany({ where: { id: { in: byType.map((row) => row.typeId) } }, select: { id: true, name: true, slug: true } })
      : [],
    topPlaceIds.length
      ? prisma.location.findMany({ where: { id: { in: topPlaceIds.map(([id]) => id) } }, select: { id: true, name: true, slug: true, kind: true } })
      : [],
  ]);
  const typeCounts = new Map(byType.map((row) => [row.typeId, row._count._all]));
  const agentCounts = await countAgentListings(agents);

  return {
    agency,
    stats,
    properties,
    filteredCount,
    page,
    pageCount: Math.max(1, Math.ceil(filteredCount / AGENCY_OFFERS_PAGE_SIZE)),
    types: types
      .map((type) => ({ ...type, count: typeCounts.get(type.id) ?? 0 }))
      .sort((a, b) => b.count - a.count),
    serviceAreas: topPlaceIds.flatMap(([id, count]) => {
      const place = places.find((item) => item.id === id);
      return place ? [{ ...place, count }] : [];
    }),
    agents: agents.map((agent) => ({
      ...agent,
      _count: { properties: agentCounts.get(agent.id) ?? 0 },
    })),
    offices,
  };
}
