import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PAGE_SIZE,
  POST_STATUSES,
  PUBLIC_PROPERTY_STATUSES,
  PROPERTY_STATUSES,
  type SortOption,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// SEÇİM (SELECT) TƏRİFLƏRİ — kart və detal görünüşləri üçün
// ---------------------------------------------------------------------------

export const propertyCardSelect = {
  id: true,
  title: true,
  slug: true,
  listingType: true,
  status: true,
  price: true,
  currency: true,
  pricePeriod: true,
  rooms: true,
  area: true,
  landArea: true,
  floor: true,
  totalFloors: true,
  isFeatured: true,
  publishedAt: true,
  createdAt: true,
  type: { select: { name: true, slug: true } },
  city: { select: { name: true, slug: true } },
  district: { select: { name: true, slug: true } },
  images: {
    orderBy: [{ isCover: "desc" }, { order: "asc" }],
    take: 1,
    select: { url: true, alt: true, width: true, height: true },
  },
} satisfies Prisma.PropertySelect;

export type PropertyCardData = Prisma.PropertyGetPayload<{
  select: typeof propertyCardSelect;
}>;

export const projectCardSelect = {
  id: true,
  name: true,
  slug: true,
  summary: true,
  projectType: true,
  status: true,
  year: true,
  coverUrl: true,
  city: { select: { name: true } },
} satisfies Prisma.ProjectSelect;

export type ProjectCardData = Prisma.ProjectGetPayload<{
  select: typeof projectCardSelect;
}>;

export const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverUrl: true,
  coverAlt: true,
  readMinutes: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.BlogPostSelect;

export type PostCardData = Prisma.BlogPostGetPayload<{
  select: typeof postCardSelect;
}>;

// ---------------------------------------------------------------------------
// ƏMLAK FİLTRLƏRİ
// ---------------------------------------------------------------------------

export type PropertyFilters = {
  listingType?: string;
  typeSlug?: string;
  citySlug?: string;
  districtSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  minArea?: number;
  maxArea?: number;
  renovation?: string;
  documentStatus?: string;
  featureSlugs?: string[];
  search?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

/** İctimai səhifələr üçün baza şərt — silinmiş və qaralama əmlaklar görünmür. */
function publicPropertyWhere(): Prisma.PropertyWhereInput {
  return {
    deletedAt: null,
    isDemo: false,
    status: { in: PUBLIC_PROPERTY_STATUSES },
  };
}

function buildPropertyWhere(filters: PropertyFilters): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = publicPropertyWhere();

  if (filters.listingType) where.listingType = filters.listingType;
  if (filters.typeSlug) where.type = { slug: filters.typeSlug };
  if (filters.citySlug) where.city = { slug: filters.citySlug };
  if (filters.districtSlug) where.district = { slug: filters.districtSlug };
  if (filters.renovation) where.renovation = filters.renovation;
  if (filters.documentStatus) where.documentStatus = filters.documentStatus;

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    };
  }

  if (filters.minArea !== undefined || filters.maxArea !== undefined) {
    where.area = {
      ...(filters.minArea !== undefined ? { gte: filters.minArea } : {}),
      ...(filters.maxArea !== undefined ? { lte: filters.maxArea } : {}),
    };
  }

  // "5" seçimi "5 və daha çox otaq" mənasını verir
  if (filters.rooms !== undefined) {
    where.rooms = filters.rooms >= 5 ? { gte: 5 } : filters.rooms;
  }

  if (filters.featureSlugs?.length) {
    where.AND = filters.featureSlugs.map((slug) => ({
      features: { some: { feature: { slug } } },
    }));
  }

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      where.OR = [
        { title: { contains: term } },
        { description: { contains: term } },
        { address: { contains: term } },
        { city: { name: { contains: term } } },
        { district: { name: { contains: term } } },
      ];
    }
  }

  return where;
}

function buildPropertyOrderBy(
  sort: SortOption = "newest",
): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "area_desc":
      return [{ area: "desc" }];
    case "featured":
      return [{ isFeatured: "desc" }, { publishedAt: "desc" }];
    default:
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
  }
}

export async function getProperties(filters: PropertyFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE;
  const where = buildPropertyWhere(filters);

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      select: propertyCardSelect,
      orderBy: buildPropertyOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFeaturedProperties(take = 6) {
  return prisma.property.findMany({
    where: { ...publicPropertyWhere(), isFeatured: true },
    select: propertyCardSelect,
    orderBy: [{ publishedAt: "desc" }],
    take,
  });
}

export async function getPropertyBySlug(slug: string) {
  return prisma.property.findFirst({
    where: { ...publicPropertyWhere(), slug },
    include: {
      type: true,
      city: true,
      district: true,
      images: { orderBy: [{ isCover: "desc" }, { order: "asc" }] },
      features: { include: { feature: true } },
      project: { select: { name: true, slug: true } },
    },
  });
}

/** Eyni şəhər/tipdə oxşar əmlaklar. */
export async function getSimilarProperties(
  property: { id: string; cityId: string; typeId: string; listingType: string },
  take = 4,
) {
  return prisma.property.findMany({
    where: {
      ...publicPropertyWhere(),
      id: { not: property.id },
      listingType: property.listingType,
      OR: [{ cityId: property.cityId }, { typeId: property.typeId }],
    },
    select: propertyCardSelect,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    take,
  });
}

export async function getPropertiesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.property.findMany({
    where: { ...publicPropertyWhere(), id: { in: ids } },
    select: propertyCardSelect,
  });
}

// ---------------------------------------------------------------------------
// FİLTER SEÇİMLƏRİ (dropdown-lar üçün)
// ---------------------------------------------------------------------------

export async function getFilterOptions() {
  const [types, cities, features] = await Promise.all([
    prisma.propertyType.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { name: true, slug: true, imageUrl: true, description: true, icon: true },
    }),
    prisma.location.findMany({
      where: { kind: "CITY" },
      orderBy: { order: "asc" },
      select: {
        name: true,
        slug: true,
        children: {
          orderBy: { order: "asc" },
          select: { name: true, slug: true },
        },
      },
    }),
    prisma.feature.findMany({
      orderBy: { order: "asc" },
      select: { name: true, slug: true, group: true },
    }),
  ]);

  return { types, cities, features };
}

/** Kateqoriya kartlarında göstərilən əmlak sayları. */
export async function getPropertyTypeCounts() {
  const grouped = await prisma.property.groupBy({
    by: ["typeId"],
    where: publicPropertyWhere(),
    _count: { _all: true },
  });
  return new Map(grouped.map((row) => [row.typeId, row._count._all]));
}

export async function getPropertyTypesWithCounts() {
  const types = await prisma.propertyType.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: {
          properties: {
            where: publicPropertyWhere(),
          },
        },
      },
    },
  });
  return types;
}

// ---------------------------------------------------------------------------
// LAYİHƏLƏR
// ---------------------------------------------------------------------------

export async function getProjects(filters: { status?: string; type?: string } = {}) {
  return prisma.project.findMany({
    where: {
      deletedAt: null,
      isDemo: false,
      isActive: true,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { projectType: filters.type } : {}),
    },
    select: projectCardSelect,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug, deletedAt: null, isDemo: false, isActive: true },
    include: {
      city: true,
      images: { orderBy: { order: "asc" } },
      properties: {
        where: publicPropertyWhere(),
        select: propertyCardSelect,
        take: 6,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// XİDMƏTLƏR
// ---------------------------------------------------------------------------

export async function getServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

export async function getServiceBySlug(slug: string) {
  return prisma.service.findFirst({ where: { slug, isActive: true } });
}

// ---------------------------------------------------------------------------
// BLOQ
// ---------------------------------------------------------------------------

export async function getPosts(
  filters: { categorySlug?: string; page?: number; pageSize?: number; search?: string } = {},
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 9;

  const where: Prisma.BlogPostWhereInput = {
    deletedAt: null,
    isDemo: false,
    status: POST_STATUSES.PUBLISHED,
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search } },
            { excerpt: { contains: filters.search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: postCardSelect,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, deletedAt: null, isDemo: false, status: POST_STATUSES.PUBLISHED },
    include: {
      category: true,
      author: { select: { name: true } },
    },
  });
}

export async function getRelatedPosts(postId: string, categoryId: string | null, take = 3) {
  return prisma.blogPost.findMany({
    where: {
      deletedAt: null,
      isDemo: false,
      status: POST_STATUSES.PUBLISHED,
      id: { not: postId },
      ...(categoryId ? { categoryId } : {}),
    },
    select: postCardSelect,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getBlogCategories() {
  return prisma.blogCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: {
          posts: { where: { deletedAt: null, isDemo: false, status: POST_STATUSES.PUBLISHED } },
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// SITEMAP ÜÇÜN
// ---------------------------------------------------------------------------

export async function getSitemapEntries() {
  const [properties, projects, services, posts] = await Promise.all([
    prisma.property.findMany({
      where: publicPropertyWhere(),
      select: { slug: true, updatedAt: true },
    }),
    prisma.project.findMany({
      where: { deletedAt: null, isDemo: false, isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { deletedAt: null, isDemo: false, status: POST_STATUSES.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return { properties, projects, services, posts };
}

// ---------------------------------------------------------------------------
// ADMIN DASHBOARD
// ---------------------------------------------------------------------------

export async function getDashboardStats() {
  const [
    activeProperties,
    soldProperties,
    rentedProperties,
    draftProperties,
    activeProjects,
    newLeads,
    totalLeads,
    publishedPosts,
    mediaCount,
  ] = await Promise.all([
    prisma.property.count({
      where: { deletedAt: null, isDemo: false, status: PROPERTY_STATUSES.PUBLISHED },
    }),
    prisma.property.count({
      where: { deletedAt: null, isDemo: false, status: PROPERTY_STATUSES.SOLD },
    }),
    prisma.property.count({
      where: { deletedAt: null, isDemo: false, status: PROPERTY_STATUSES.RENTED },
    }),
    prisma.property.count({
      where: { deletedAt: null, isDemo: false, status: PROPERTY_STATUSES.DRAFT },
    }),
    prisma.project.count({ where: { deletedAt: null, isDemo: false, status: "ONGOING" } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count(),
    prisma.blogPost.count({
      where: { deletedAt: null, isDemo: false, status: POST_STATUSES.PUBLISHED },
    }),
    prisma.media.count(),
  ]);

  return {
    activeProperties,
    soldProperties,
    rentedProperties,
    draftProperties,
    activeProjects,
    newLeads,
    totalLeads,
    publishedPosts,
    mediaCount,
  };
}

export async function getAdminProperties() {
  return prisma.property.findMany({
    where: { deletedAt: null, isDemo: false },
    select: {
      id: true,
      title: true,
      slug: true,
      listingType: true,
      status: true,
      price: true,
      currency: true,
      rooms: true,
      area: true,
      isFeatured: true,
      viewCount: true,
      updatedAt: true,
      type: { select: { name: true } },
      city: { select: { name: true } },
      district: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getRecentAdminProperties(take = 5) {
  return prisma.property.findMany({
    where: { deletedAt: null, isDemo: false },
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      currency: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function getRecentAdminLeads(take = 5) {
  return prisma.lead.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      source: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
