import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  ADMIN_PAGE_SIZE,
  AGENCY_EMPLOYEE_STATUSES,
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

  /** NEW | OLD — yerli bazarda qiymətə ən çox təsir edən ikinci ölçü. */
  buildingType?: string;
  /** Kirayədə MONTH/DAY ayrımı: günlük kirayə ayrıca axtarış kateqoriyasıdır. */
  pricePeriod?: string;
  minFloor?: number;
  maxFloor?: number;
  /** «Birinci mərtəbə olmasın» — yerli elanlarda standart süzgəcdir. */
  excludeFirstFloor?: boolean;
  /** «Son mərtəbə olmasın» — binanın mərtəbə sayı ilə müqayisə olunur. */
  excludeLastFloor?: boolean;
  /** Yalnız şəkli olan elanlar. */
  withImagesOnly?: boolean;
  mortgageOnly?: boolean;
  installmentOnly?: boolean;
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

  if (filters.buildingType) where.buildingType = filters.buildingType;
  if (filters.pricePeriod) where.pricePeriod = filters.pricePeriod;
  if (filters.mortgageOnly) where.mortgageAvailable = true;
  if (filters.installmentOnly) where.installmentAvailable = true;

  if (filters.minFloor !== undefined || filters.maxFloor !== undefined) {
    where.floor = {
      ...(filters.minFloor !== undefined ? { gte: filters.minFloor } : {}),
      ...(filters.maxFloor !== undefined ? { lte: filters.maxFloor } : {}),
    };
  }

  // Birinci mərtəbə istisnası mərtəbə aralığı ilə birlikdə işləməlidir
  if (filters.excludeFirstFloor) {
    where.floor = { ...(where.floor as object), gt: 1 };
  }

  // «Son mərtəbə olmasın» iki sütunun müqayisəsidir; Prisma bunu birbaşa dəstəkləmir,
  // ona görə xam SQL şərti ilə verilir
  if (filters.excludeLastFloor) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { totalFloors: null },
          { floor: null },
          { floor: { lt: prisma.property.fields.totalFloors } },
        ],
      },
    ];
  }

  if (filters.withImagesOnly) {
    where.images = { some: {} };
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

export const compareSelect = {
  ...propertyCardSelect,
  bedrooms: true,
  bathrooms: true,
  renovation: true,
  documentStatus: true,
  buildingType: true,
  mortgageAvailable: true,
  installmentAvailable: true,
  features: {
    select: { feature: { select: { name: true, group: true } } },
  },
} satisfies Prisma.PropertySelect;

export type ComparePropertyData = Prisma.PropertyGetPayload<{
  select: typeof compareSelect;
}>;

/** Müqayisə səhifəsi üçün geniş sahə dəsti — kart göstərmədən daha çox atribut lazımdır. */
export async function getPropertiesForCompare(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.property.findMany({
    where: { ...publicPropertyWhere(), id: { in: ids } },
    select: compareSelect,
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
// AGENTLİKLƏR
// ---------------------------------------------------------------------------

export async function getAgencies() {
  const agencies = await prisma.agency.findMany({
    where: { isVerified: true, user: { isActive: true } },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      phone: true,
      address: true,
      user: {
        select: {
          _count: {
            select: { properties: { where: publicPropertyWhere() } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return agencies.map((agency) => ({
    id: agency.id,
    name: agency.name,
    slug: agency.slug,
    logoUrl: agency.logoUrl,
    phone: agency.phone,
    address: agency.address,
    propertyCount: agency.user._count.properties,
  }));
}

/** Panel — əmlak növü və xüsusiyyət taksonomiyası, idarəetmə üçün tam siyahı. */
export async function getAdminTaxonomy() {
  const [types, features] = await Promise.all([
    prisma.propertyType.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        order: true,
        _count: { select: { properties: true } },
      },
    }),
    prisma.feature.findMany({
      orderBy: [{ group: "asc" }, { order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        group: true,
        order: true,
        _count: { select: { properties: true } },
      },
    }),
  ]);
  return { types, features };
}

/** Panel — ictimai qeydiyyatdan keçən hesablar (STAFF xaric). */
export async function getAdminPublicAccounts() {
  return prisma.user.findMany({
    where: { accountType: { in: [ACCOUNT_TYPES.USER, ACCOUNT_TYPES.OWNER, ACCOUNT_TYPES.AGENCY] } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accountType: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { properties: true, favorites: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Panel — bütün agentliklər (təsdiqlənməmişlər daxil). */
export async function getAdminAgencies() {
  return prisma.agency.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      isVerified: true,
      createdAt: true,
      user: {
        select: {
          email: true,
          isActive: true,
          _count: { select: { properties: true } },
        },
      },
    },
    orderBy: [{ isVerified: "asc" }, { createdAt: "desc" }],
  });
}

export async function getAgencyBySlug(slug: string) {
  const agency = await prisma.agency.findFirst({
    where: { slug, isVerified: true, user: { isActive: true } },
  });
  if (!agency) return null;

  const properties = await prisma.property.findMany({
    where: { ...publicPropertyWhere(), authorId: agency.userId },
    select: propertyCardSelect,
    orderBy: { publishedAt: "desc" },
  });

  return { agency, properties };
}

/** Kabinet — sahibin öz agentlik qeydi (komanda idarəetməsi üçün). */
export async function getAgencyForOwner(userId: string) {
  return prisma.agency.findUnique({
    where: { userId },
    select: { id: true, name: true, isVerified: true },
  });
}

/** Kabinet — agentliyin əməkdaş siyahısı. */
export async function getAgencyEmployees(agencyId: string) {
  return prisma.agencyEmployee.findMany({
    where: { agencyId },
    select: {
      id: true,
      role: true,
      status: true,
      invitedAt: true,
      approvedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { invitedAt: "desc" },
  });
}

/** Panel — Security səhifəsi: son giriş cəhdləri. */
export async function getAdminLoginAttempts(limit = 50) {
  return prisma.loginAttempt.findMany({
    select: { id: true, email: true, ip: true, success: true, reason: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Panel — Security səhifəsi: bütün əməkdaşların aktiv sessiyaları. */
export async function getAdminActiveSessions(limit = 100) {
  return prisma.session.findMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      ip: true,
      userAgent: true,
      lastSeenAt: true,
      createdAt: true,
      authKind: true,
      user: { select: { id: true, name: true, email: true, accountType: true } },
    },
    orderBy: { lastSeenAt: "desc" },
    take: limit,
  });
}

/** Panel — Security səhifəsi: uğursuz cəhdlərə görə kilidlənmiş hesablar. */
export async function getAdminLockedUsers() {
  return prisma.user.findMany({
    where: { lockedUntil: { gt: new Date() } },
    select: { id: true, name: true, email: true, lockedUntil: true, failedAttempts: true },
    orderBy: { lockedUntil: "desc" },
  });
}

/** Panel — Audit Log səhifəsi, səhifələnmiş. */
export async function getAdminAuditLog(page = 1, pageSize = ADMIN_PAGE_SIZE) {
  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      select: {
        id: true,
        userEmail: true,
        action: true,
        entity: true,
        entityId: true,
        summary: true,
        ip: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ]);
  return { entries, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Panel — moderasiya növbəsi: kənar istifadəçilərin göndərdiyi təsdiq gözləyən elanlar. */
export async function getModerationQueue() {
  return prisma.property.findMany({
    where: { status: PROPERTY_STATUSES.PENDING, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      listingType: true,
      price: true,
      currency: true,
      createdAt: true,
      type: { select: { name: true } },
      city: { select: { name: true } },
      images: {
        orderBy: [{ isCover: "desc" }, { order: "asc" }],
        take: 1,
        select: { url: true, alt: true },
      },
      author: {
        select: {
          name: true,
          email: true,
          accountType: true,
          agency: { select: { name: true, isVerified: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Panel — təsdiq gözləyən agentlik əməkdaşları. */
export async function getAdminAgencyEmployeeQueue() {
  return prisma.agencyEmployee.findMany({
    where: { status: AGENCY_EMPLOYEE_STATUSES.PENDING },
    select: {
      id: true,
      role: true,
      invitedAt: true,
      user: { select: { name: true, email: true } },
      agency: { select: { name: true, slug: true } },
    },
    orderBy: { invitedAt: "asc" },
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
  const [properties, projects, services, posts, agencies] = await Promise.all([
    prisma.property.findMany({
      where: {
        ...publicPropertyWhere(),
        status: { in: [PROPERTY_STATUSES.PUBLISHED, PROPERTY_STATUSES.RESERVED] },
        noIndex: false,
        canonicalUrl: null,
      },
      select: { slug: true, updatedAt: true, status: true, noIndex: true, canonicalUrl: true },
    }),
    prisma.project.findMany({
      where: { deletedAt: null, isDemo: false, isActive: true, noIndex: false, canonicalUrl: null },
      select: { slug: true, updatedAt: true, noIndex: true, canonicalUrl: true },
    }),
    prisma.service.findMany({
      where: { isActive: true, noIndex: false, canonicalUrl: null },
      select: { slug: true, updatedAt: true, noIndex: true, canonicalUrl: true },
    }),
    prisma.blogPost.findMany({
      where: {
        deletedAt: null,
        isDemo: false,
        status: POST_STATUSES.PUBLISHED,
        noIndex: false,
        canonicalUrl: null,
      },
      select: { slug: true, updatedAt: true, noIndex: true, canonicalUrl: true },
    }),
    prisma.agency.findMany({
      where: { isVerified: true, user: { isActive: true } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return { properties, projects, services, posts, agencies, landings: [] };
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

/** İdarə paneli — diqqət tələb edən qeydlərin sayı (bildiriş paneli). */
export async function getAdminAlerts() {
  const [pendingProperties, unverifiedAgencies, lockedUsers] = await Promise.all([
    prisma.property.count({ where: { deletedAt: null, status: PROPERTY_STATUSES.PENDING } }),
    prisma.agency.count({ where: { isVerified: false } }),
    prisma.user.count({ where: { accountType: "STAFF", lockedUntil: { gt: new Date() } } }),
  ]);
  return { pendingProperties, unverifiedAgencies, lockedUsers };
}

/** İdarə paneli — ən çox baxılan elanlar (sadə analitika). */
export async function getTopViewedProperties(take = 5) {
  return prisma.property.findMany({
    where: { deletedAt: null, isDemo: false, viewCount: { gt: 0 } },
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      status: true,
      city: { select: { name: true } },
    },
    orderBy: { viewCount: "desc" },
    take,
  });
}

/** İdarə paneli — müraciətlərin status üzrə bölgüsü. */
export async function getLeadStatusBreakdown() {
  const rows = await prisma.lead.groupBy({ by: ["status"], _count: { _all: true } });
  return rows.map((row) => ({ status: row.status, count: row._count._all }));
}

/** SEO auditı — meta başlıq/təsvir çatışmayan dərc olunmuş məzmun. */
export async function getSeoAuditItems() {
  const [properties, posts] = await Promise.all([
    prisma.property.findMany({
      where: {
        deletedAt: null,
        isDemo: false,
        status: { in: PUBLIC_PROPERTY_STATUSES },
        OR: [{ metaTitle: null }, { metaDescription: null }],
      },
      select: { id: true, title: true, slug: true, metaTitle: true, metaDescription: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    }),
    prisma.blogPost.findMany({
      where: {
        deletedAt: null,
        isDemo: false,
        status: POST_STATUSES.PUBLISHED,
        OR: [{ metaTitle: null }, { metaDescription: null }],
      },
      select: { id: true, title: true, slug: true, metaTitle: true, metaDescription: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    }),
  ]);
  return { properties, posts };
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

// ---------------------------------------------------------------------------
// PANEL SORĞULARI — ƏMLAK
// ---------------------------------------------------------------------------

export type AdminPropertyFilters = {
  q?: string;
  status?: string;
  listingType?: string;
  typeId?: string;
  cityId?: string;
  /** `true` — yalnız silinmiş elanlar (zibil qutusu görünüşü). */
  deleted?: boolean;
  page?: number;
};

const adminPropertySelect = {
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
  deletedAt: true,
  type: { select: { name: true } },
  city: { select: { name: true } },
  district: { select: { name: true } },
  images: { orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
} satisfies Prisma.PropertySelect;

export type AdminPropertyRow = Prisma.PropertyGetPayload<{ select: typeof adminPropertySelect }>;

/**
 * Panel siyahısı.
 *
 * `isDemo` şərti burada **yoxdur**: demo qeydlər ictimai saytda gizlədilir, amma
 * redaktor onları paneldə görüb təmizləyə bilməlidir.
 */
export async function getAdminProperties(filters: AdminPropertyFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.PropertyWhereInput = {
    deletedAt: filters.deleted ? { not: null } : null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.listingType ? { listingType: filters.listingType } : {}),
    ...(filters.typeId ? { typeId: filters.typeId } : {}),
    ...(filters.cityId ? { cityId: filters.cityId } : {}),
    // D1-də `mode: "insensitive"` yoxdur; SQLite LIKE yalnız ASCII hərflərində
    // reqistrdən asılı deyil, ona görə azərbaycanca sorğu tam olmaya bilər
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q } },
            { slug: { contains: filters.q } },
            { address: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.property.findMany({
      where,
      select: adminPropertySelect,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    rows,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

/** Redaktə formasının doldurulması üçün tam qeyd. */
export async function getAdminPropertyById(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ isCover: "desc" }, { order: "asc" }] },
      features: { select: { featureId: true } },
    },
  });
}

/** Formadakı bütün açılan siyahılar bir sorğu dəstində gətirilir. */
export async function getPropertyFormOptions() {
  const [types, cities, districts, features, projects] = await Promise.all([
    prisma.propertyType.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
    prisma.location.findMany({
      where: { kind: "CITY" },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
    prisma.location.findMany({
      where: { kind: { in: ["DISTRICT", "SETTLEMENT", "METRO"] } },
      select: { id: true, name: true, kind: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.feature.findMany({
      select: { id: true, name: true, group: true },
      orderBy: [{ group: "asc" }, { order: "asc" }],
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { types, cities, districts, features, projects };
}

export type PropertyFormOptions = Awaited<ReturnType<typeof getPropertyFormOptions>>;

// ---------------------------------------------------------------------------
// PANEL SORĞULARI — MÜRACİƏTLƏR
// ---------------------------------------------------------------------------

export type AdminLeadFilters = {
  q?: string;
  status?: string;
  source?: string;
  page?: number;
};

const adminLeadSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  subject: true,
  source: true,
  status: true,
  createdAt: true,
  property: { select: { id: true, title: true, slug: true } },
  assignee: { select: { id: true, name: true } },
} satisfies Prisma.LeadSelect;

export type AdminLeadRow = Prisma.LeadGetPayload<{ select: typeof adminLeadSelect }>;

export async function getAdminLeads(filters: AdminLeadFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.LeadWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q } },
            { phone: { contains: filters.q } },
            { email: { contains: filters.q } },
            { message: { contains: filters.q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      select: adminLeadSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.lead.count({ where }),
  ]);

  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, slug: true } },
      assignee: { select: { id: true, name: true } },
    },
  });
}

/** Müraciətə təyin oluna bilən aktiv istifadəçilər. */
export async function getAssignableUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

// ---------------------------------------------------------------------------
// PANEL SORĞULARI — BLOQ
// ---------------------------------------------------------------------------

export type AdminPostFilters = {
  q?: string;
  status?: string;
  categoryId?: string;
  deleted?: boolean;
  page?: number;
};

const adminPostSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  coverUrl: true,
  viewCount: true,
  readMinutes: true,
  publishedAt: true,
  updatedAt: true,
  deletedAt: true,
  category: { select: { name: true } },
  author: { select: { name: true } },
} satisfies Prisma.BlogPostSelect;

export type AdminPostRow = Prisma.BlogPostGetPayload<{ select: typeof adminPostSelect }>;

export async function getAdminPosts(filters: AdminPostFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.BlogPostWhereInput = {
    deletedAt: filters.deleted ? { not: null } : null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.q
      ? { OR: [{ title: { contains: filters.q } }, { slug: { contains: filters.q } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      select: adminPostSelect,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminPostById(id: string) {
  return prisma.blogPost.findUnique({ where: { id } });
}

/** Panel üçün kateqoriyalar — ictimai `getBlogCategories()` yalnız dolu olanları qaytarır. */
export async function getAdminBlogCategories() {
  return prisma.blogCategory.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      order: true,
      _count: { select: { posts: true } },
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
}

// ---------------------------------------------------------------------------
// PANEL SORĞULARI — LAYİHƏLƏR VƏ XİDMƏTLƏR
// ---------------------------------------------------------------------------

export type AdminProjectFilters = {
  q?: string;
  status?: string;
  projectType?: string;
  deleted?: boolean;
  page?: number;
};

const adminProjectSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  projectType: true,
  year: true,
  unitCount: true,
  isActive: true,
  order: true,
  coverUrl: true,
  updatedAt: true,
  deletedAt: true,
  city: { select: { name: true } },
  _count: { select: { properties: true, images: true } },
} satisfies Prisma.ProjectSelect;

export type AdminProjectRow = Prisma.ProjectGetPayload<{ select: typeof adminProjectSelect }>;

export async function getAdminProjects(filters: AdminProjectFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.ProjectWhereInput = {
    deletedAt: filters.deleted ? { not: null } : null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.projectType ? { projectType: filters.projectType } : {}),
    ...(filters.q
      ? { OR: [{ name: { contains: filters.q } }, { slug: { contains: filters.q } }] }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: adminProjectSelect,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.project.count({ where }),
  ]);

  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  });
}

/** Layihə formasında yalnız şəhər siyahısı lazımdır. */
export async function getCityOptions() {
  return prisma.location.findMany({
    where: { kind: "CITY" },
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  });
}

export async function getAdminServices() {
  return prisma.service.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      icon: true,
      order: true,
      isActive: true,
      updatedAt: true,
    },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });
}

export async function getAdminServiceById(id: string) {
  return prisma.service.findUnique({ where: { id } });
}

// ---------------------------------------------------------------------------
// PANEL SORĞULARI — MEDİA, İSTİFADƏÇİLƏR, PARAMETRLƏR
// ---------------------------------------------------------------------------

export async function getAdminMedia(filters: { q?: string; page?: number } = {}) {
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.MediaWhereInput = filters.q
    ? { OR: [{ originalName: { contains: filters.q } }, { alt: { contains: filters.q } }] }
    : {};

  const [rows, total] = await Promise.all([
    prisma.media.findMany({
      where,
      select: {
        id: true,
        url: true,
        thumbUrl: true,
        originalName: true,
        mimeType: true,
        size: true,
        width: true,
        height: true,
        alt: true,
        createdAt: true,
        uploader: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.media.count({ where }),
  ]);

  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminUsers() {
  return prisma.user.findMany({
    where: { accountType: ACCOUNT_TYPES.STAFF },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      totpEnabledAt: true,
      mustChangePassword: true,
      lockedUntil: true,
      _count: { select: { sessions: true } },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
}

export async function getSettings() {
  const rows = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Record<string, string>;
}

/** Son panel əməliyyatları — təhlükəsizlik icmalı üçün. */
export async function getAuditLog(take = 50) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

// ---------------------------------------------------------------------------
// YÖNLƏNDİRMƏLƏR VƏ 404 İZLƏMƏSİ
// ---------------------------------------------------------------------------

/**
 * Aktiv yönləndirməni tapır və baxış sayğacını artırır.
 *
 * `[...slug]` catch-all route hər 404-ə düşəndə bunu çağırır — sayğac artırmaq
 * ayrıca sorğu deyil, eyni update-də gedir ki, əlavə gecikmə yaranmasın.
 */
export async function findActiveRedirect(path: string) {
  const redirect = await prisma.redirect.findFirst({
    where: { fromPath: path, isActive: true },
    select: { id: true, toPath: true, statusCode: true },
  });
  if (!redirect) return null;

  await prisma.redirect
    .update({ where: { id: redirect.id }, data: { hitCount: { increment: 1 } } })
    .catch(() => undefined);

  return redirect;
}

/**
 * Uyğun yönləndirməsi olmayan 404-ü qeydə alır.
 *
 * `upsert` ilə: eyni yol təkrar 404 versə sətir təkrarlanmır, sayğac artır.
 * Nadir hallarda (məs. bot skaneri) sətir sayı çox arta bilər, ona görə panel
 * yalnız ən çox rast gəlinənləri göstərir.
 */
export async function recordNotFoundHit(path: string, referrer?: string | null) {
  await prisma.notFoundHit
    .upsert({
      where: { path },
      create: { path, referrer: referrer ?? null },
      update: { count: { increment: 1 }, lastSeenAt: new Date(), referrer: referrer ?? undefined },
    })
    .catch(() => undefined);
}

/** Panel — bütün yönləndirmələr. */
export async function getAdminRedirects() {
  return prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
}

/** Panel — ən çox rast gəlinən 404-lər (yönləndirmə ehtiyacını göstərir). */
export async function getTopNotFoundHits(take = 30) {
  return prisma.notFoundHit.findMany({ orderBy: { count: "desc" }, take });
}
