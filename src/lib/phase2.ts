import { prisma } from "@/lib/prisma";
import { propertyCardSelect, publicPropertyWhere } from "@/lib/queries";

/** İctimai agent kataloqu — qaralama və gizli profillər heç vaxt sızmır. */
export async function getPublicAgents() {
  return prisma.agentProfile.findMany({
    where: { isPublic: true },
    include: {
      agency: { select: { name: true, slug: true } },
      reviews: { where: { status: "APPROVED" }, select: { rating: true } },
      _count: { select: { properties: { where: publicPropertyWhere() } } },
    },
    orderBy: [{ isVerified: "desc" }, { soldCount: "desc" }, { name: "asc" }],
  });
}

export async function getPublicAgentBySlug(slug: string) {
  return prisma.agentProfile.findFirst({
    where: { slug, isPublic: true },
    include: {
      agency: { select: { name: true, slug: true, logoUrl: true } },
      properties: {
        where: publicPropertyWhere(),
        select: propertyCardSelect,
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getApprovedTestimonials(take = 6) {
  return prisma.testimonial.findMany({
    where: { status: "APPROVED" },
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
    where: { userId, property: publicPropertyWhere() },
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
        publicPropertyWhere(),
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
