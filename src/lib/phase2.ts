import { prisma } from "@/lib/prisma";
import { demoWhere } from "@/lib/demo-content";
import { propertyCardSelect, publicPropertyWhere } from "@/lib/queries";
import { REVIEW_STATUSES } from "@/lib/constants";
import { activeOfferWhere, agentListingWhere, countAgentListings, getClosedDeals } from "@/lib/agency-profile";

/**
 * İctimai agent kataloqu — qaralama və gizli profillər heç vaxt sızmır.
 * `_count.properties` agentin öz yerləşdirdiyi + ona təyin edilmiş elanların
 * təkrarsız sayıdır (`countAgentListings`) — əlaqənin `_count`-u yalnız təyin edilmişləri
 * sayırdı və agentin öz elanı kartda «0» görünürdü (#155).
 */
export async function getPublicAgents() {
  const agents = await prisma.agentProfile.findMany({
    where: { isPublic: true, ...(await demoWhere()) },
    include: {
      agency: { select: { name: true, slug: true } },
      reviews: { where: { status: REVIEW_STATUSES.APPROVED }, select: { rating: true } },
    },
    orderBy: [{ isVerified: "desc" }, { soldCount: "desc" }, { name: "asc" }],
  });
  const counts = await countAgentListings(agents);
  return agents.map((agent) => ({ ...agent, _count: { properties: counts.get(agent.id) ?? 0 } }));
}

/** Agent səhifəsində bir səhifədə göstərilən elan sayı. */
export const AGENT_LISTINGS_PAGE_SIZE = 24;

export async function getPublicAgentBySlug(slug: string, page = 1) {
  const agent = await prisma.agentProfile.findFirst({
    where: { slug, isPublic: true, ...(await demoWhere()) },
    include: {
      agency: { select: { name: true, slug: true, logoUrl: true } },
      reviews: {
        where: { status: REVIEW_STATUSES.APPROVED },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!agent) return null;
  // Agentin öz yerləşdirdiyi və ona təyin edilmiş aktiv elanlar birlikdə. Ümumi say ayrıca
  // sayılır — səhifədəki kart sayı (`properties.length`) cəm deyil. Satılmış/icarəyə
  // verilmiş elanlar «Uğurlu sövdələşmələr»dədir (#159).
  const where = { ...(await activeOfferWhere()), ...agentListingWhere(agent) };
  const currentPage = Math.max(1, Math.floor(page) || 1);
  const [properties, propertyCount, deals] = await Promise.all([
    prisma.property.findMany({
      where,
      select: propertyCardSelect,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      skip: (currentPage - 1) * AGENT_LISTINGS_PAGE_SIZE,
      take: AGENT_LISTINGS_PAGE_SIZE,
    }),
    prisma.property.count({ where }),
    getClosedDeals(agentListingWhere(agent)),
  ]);
  return {
    ...agent,
    properties,
    propertyCount,
    deals,
    page: currentPage,
    pageCount: Math.max(1, Math.ceil(propertyCount / AGENT_LISTINGS_PAGE_SIZE)),
  };
}

export async function getApprovedTestimonials(take = 6) {
  return prisma.testimonial.findMany({
    where: { status: REVIEW_STATUSES.APPROVED },
    include: {
      agent: { select: { name: true, slug: true } },
      agency: { select: { name: true, slug: true } },
    },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take,
  });
}

/** Favorit davranışından şəffaf, deterministik tövsiyə profili çıxarır. */
export async function getPersonalizedRecommendations(userId: string, take = 12) {
  const preference = await prisma.notificationPreference.findUnique({
    where: { userId },
    select: { recommendationEnabled: true },
  });
  if (preference?.recommendationEnabled === false) {
    return { items: [], personalized: false, disabled: true };
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId, property: await publicPropertyWhere() },
    select: {
      propertyId: true,
      property: { select: { typeId: true, cityId: true, listingType: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const favoriteIds = favorites.map((item) => item.propertyId);
  const typeIds = [...new Set(favorites.map((item) => item.property.typeId))];
  const cityIds = [...new Set(favorites.map((item) => item.property.cityId))];
  const listingTypes = [...new Set(favorites.map((item) => item.property.listingType))];
  const personalized = favorites.length > 0;
  const affinity = personalized
    ? {
        OR: [
          { typeId: { in: typeIds } },
          { cityId: { in: cityIds } },
          { listingType: { in: listingTypes } },
        ],
      }
    : {};

  const items = await prisma.property.findMany({
    where: {
      AND: [
        await publicPropertyWhere(),
        affinity,
        favoriteIds.length > 0 ? { id: { notIn: favoriteIds } } : {},
      ],
    },
    select: propertyCardSelect,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take,
  });
  return { items, personalized, disabled: false };
}
