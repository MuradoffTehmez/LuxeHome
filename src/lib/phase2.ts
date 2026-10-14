import { prisma } from "@/lib/prisma";
import { demoWhere } from "@/lib/demo-content";
import { propertyCardSelect, publicPropertyWhere } from "@/lib/queries";
import { REVIEW_STATUSES } from "@/lib/constants";
import { agentListingWhere, countAgentListings } from "@/lib/agency-profile";

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

export async function getPublicAgentBySlug(slug: string) {
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
  // Agentin öz yerləşdirdiyi və ona təyin edilmiş elanlar birlikdə.
  const properties = await prisma.property.findMany({
    where: { ...(await publicPropertyWhere()), ...agentListingWhere(agent) },
    select: propertyCardSelect,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take: 60,
  });
  return { ...agent, properties };
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
