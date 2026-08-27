import { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  ADMIN_PAGE_SIZE,
  AGENCY_EMPLOYEE_STATUSES,
  DEFAULT_LOCALE,
  LOCALES,
  NOTIFICATION_TYPES,
  PAGE_SIZE,
  PARTNER_STATUSES,
  POST_STATUSES,
  PUBLIC_PARTNER_STATUSES,
  PUBLIC_PROPERTY_STATUSES,
  PROPERTY_STATUSES,
  SAVED_SEARCH_FREQUENCIES,
  type Locale,
  type SortOption,
} from "@/lib/constants";
import { parseSavedSearchFilters } from "@/lib/saved-search-filters";
import type { DigestStore } from "@/lib/saved-search-digest";

const LOCALE_VALUES = Object.values(LOCALES);
import { MIN_INDEXABLE_LISTINGS, SEO_LANDINGS, type SeoLanding } from "@/lib/seo-landings";
import { evaluateSeoAudit, type SeoAuditContent } from "@/lib/seo-audit";

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
    // `thumbUrl` kart üçün vacibdir: `/media/` ünvanları `next/image`
    // optimizasiyasından yan keçir (zona səviyyəsində Images transformations hələ
    // açılmayıb), ona görə `url` verilsə kartda 2400 px-lik master şəkil yüklənir.
    select: { url: true, thumbUrl: true, alt: true, width: true, height: true },
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
  metroSlug?: string;
  statuses?: string[];
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

/**
 * `where.AND`-ə şərt əlavə edir, mövcud şərtləri qoruyaraq.
 *
 * Birbaşa `where.AND = [...]` yazmaq təhlükəlidir: iki müstəqil filtr (məsələn
 * «son mərtəbə olmasın» və xüsusiyyət seçimi) eyni sahəyə yazır və sonuncu
 * birincini səssizcə silir. Filtr UI-da aktiv görünməyə davam edir, nəticə isə
 * yanlış olur — ona görə hər əlavə bu funksiyadan keçir.
 */
function andWhere(
  where: Prisma.PropertyWhereInput,
  ...conditions: Prisma.PropertyWhereInput[]
): void {
  if (conditions.length === 0) return;
  const existing = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
  where.AND = [...existing, ...conditions];
}

/** Yalnız oxuma — filtr birləşmə məntiqi unit testlərlə örtülsün deyə ixrac olunur. */
export function buildPropertyWhere(filters: PropertyFilters): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = publicPropertyWhere();

  if (filters.statuses?.length) where.status = { in: filters.statuses };
  if (filters.listingType) where.listingType = filters.listingType;
  if (filters.typeSlug) where.type = { slug: filters.typeSlug };
  if (filters.citySlug) where.city = { slug: filters.citySlug };
  if (filters.districtSlug) where.district = { slug: filters.districtSlug };
  if (filters.metroSlug) where.metro = { slug: filters.metroSlug };
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
    andWhere(where, {
      OR: [
        { totalFloors: null },
        { floor: null },
        { floor: { lt: prisma.property.fields.totalFloors } },
      ],
    });
  }

  if (filters.withImagesOnly) {
    where.images = { some: {} };
  }

  // Hər xüsusiyyət ayrıca AND şərtidir — «hovuz VƏ qaraj» seçimi ikisi də olan
  // elanları qaytarmalıdır, birini daşıyanı yox.
  if (filters.featureSlugs?.length) {
    andWhere(
      where,
      ...filters.featureSlugs.map((slug) => ({
        features: { some: { feature: { slug } } },
      })),
    );
  }

  // Mətn axtarışı da AND-in içinə salınır: `where.OR` birbaşa yazılsaydı,
  // gələcəkdə əlavə olunan hər OR-lu filtr onu üzərinə yazardı.
  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      andWhere(where, {
        OR: [
          { title: { contains: term } },
          { description: { contains: term } },
          { address: { contains: term } },
          { city: { name: { contains: term } } },
          { district: { name: { contains: term } } },
        ],
      });
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
      metro: true,
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
    select: { feature: { select: { name: true, slug: true, group: true } } },
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
  const [types, cities, metros, features] = await Promise.all([
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
    prisma.location.findMany({
      where: { kind: "METRO" },
      orderBy: { order: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.feature.findMany({
      orderBy: { order: "asc" },
      select: { name: true, slug: true, group: true },
    }),
  ]);

  return { types, cities, metros, features };
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
  const [properties, projects, services, posts, agencies, partners, seoLandings, districts, metros] = await Promise.all([
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
    getSitemapPartners(),
    getIndexableSeoLandingEntries(),
    getIndexableTaxonomyLandings("DISTRICT"),
    getIndexableTaxonomyLandings("METRO"),
  ]);

  return {
    properties,
    projects,
    services,
    posts,
    agencies,
    partners,
    landings: [
      ...seoLandings,
      ...districts.map((item) => ({ path: `/rayon/${item.slug}`, updatedAt: item.updatedAt })),
      ...metros.map((item) => ({ path: `/metro/${item.slug}`, updatedAt: item.updatedAt })),
    ],
  };
}

const INDEXABLE_LISTING_STATUSES = [
  PROPERTY_STATUSES.PUBLISHED,
  PROPERTY_STATUSES.RESERVED,
];

/** Sabit kommersiya landing-i üçün yalnız aktiv, canonical public elanlar. */
export async function getSeoLandingProperties(landing: SeoLanding, page = 1) {
  return getProperties({
    ...landing.filters,
    statuses: INDEXABLE_LISTING_STATUSES,
    page,
    pageSize: 12,
  });
}

export async function getTaxonomyLandingProperties(
  kind: "DISTRICT" | "METRO",
  slug: string,
  page = 1,
) {
  const location = await prisma.location.findFirst({
    where: { slug, kind },
    select: { id: true, name: true, slug: true, kind: true, parent: { select: { name: true } } },
  });
  if (!location) return null;

  const result = await getProperties({
    ...(kind === "DISTRICT" ? { districtSlug: slug } : { metroSlug: slug }),
    statuses: INDEXABLE_LISTING_STATUSES,
    page,
    pageSize: 12,
  });
  return { location, ...result };
}

async function getIndexableSeoLandingEntries() {
  const rows = await Promise.all(
    SEO_LANDINGS.map(async (landing) => {
      const where = buildPropertyWhere({
        ...landing.filters,
        statuses: INDEXABLE_LISTING_STATUSES,
      });
      const aggregate = await prisma.property.aggregate({
        where,
        _count: { _all: true },
        _max: { updatedAt: true },
      });
      return aggregate._count._all >= MIN_INDEXABLE_LISTINGS
        ? { path: landing.path, updatedAt: aggregate._max.updatedAt ?? undefined }
        : null;
    }),
  );
  return rows.filter((row): row is NonNullable<typeof row> => row !== null);
}

export async function getIndexableTaxonomyLandings(kind: "DISTRICT" | "METRO") {
  const baseWhere = buildPropertyWhere({ statuses: INDEXABLE_LISTING_STATUSES });
  const grouped: Array<{
    locationId: string | null;
    count: number;
    updatedAt?: Date;
  }> =
    kind === "DISTRICT"
      ? (
          await prisma.property.groupBy({
            by: ["districtId"],
            where: { ...baseWhere, districtId: { not: null } },
            _count: { _all: true },
            _max: { updatedAt: true },
          })
        ).map((row) => ({
          locationId: row.districtId,
          count: row._count._all,
          updatedAt: row._max.updatedAt ?? undefined,
        }))
      : (
          await prisma.property.groupBy({
            by: ["metroId"],
            where: { ...baseWhere, metroId: { not: null } },
            _count: { _all: true },
            _max: { updatedAt: true },
          })
        ).map((row) => ({
          locationId: row.metroId,
          count: row._count._all,
          updatedAt: row._max.updatedAt ?? undefined,
        }));
  const eligible = grouped.filter((row) => row.count >= MIN_INDEXABLE_LISTINGS);
  const ids = eligible.map((row) => row.locationId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const locations = await prisma.location.findMany({
    where: { id: { in: ids }, kind },
    select: { id: true, name: true, slug: true },
  });
  const counts = new Map(
    eligible.map((row) => [row.locationId, { count: row.count, updatedAt: row.updatedAt }]),
  );
  return locations.map((location) => ({ ...location, ...counts.get(location.id)! }));
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

/** SEO auditı — public məzmunun bounded keyfiyyət proyeksiyası. */
export async function getSeoAuditItems() {
  const [properties, posts, projects, services] = await Promise.all([
    prisma.property.findMany({
      where: publicPropertyWhere(),
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        metaTitle: true,
        metaDescription: true,
        noIndex: true,
        publishedAt: true,
        districtId: true,
        metroId: true,
        images: { select: { url: true, alt: true }, orderBy: [{ isCover: "desc" }, { order: "asc" }], take: 1 },
      },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
    prisma.blogPost.findMany({
      where: {
        deletedAt: null,
        isDemo: false,
        status: POST_STATUSES.PUBLISHED,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        metaTitle: true,
        metaDescription: true,
        noIndex: true,
        coverUrl: true,
        coverAlt: true,
        authorId: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
    prisma.project.findMany({
      where: { deletedAt: null, isDemo: false, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        metaTitle: true,
        metaDescription: true,
        noIndex: true,
        coverUrl: true,
        cityId: true,
        images: { select: { alt: true }, orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        metaTitle: true,
        metaDescription: true,
        noIndex: true,
        imageUrl: true,
      },
      orderBy: { order: "asc" },
      take: 200,
    }),
  ]);

  const contents: SeoAuditContent[] = [
    ...properties.map((item) => ({
      kind: "property" as const,
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      noIndex: item.noIndex,
      imageUrl: item.images[0]?.url,
      imageAlt: item.images[0]?.alt,
      hasLocation: Boolean(item.districtId || item.metroId),
      hasAuthor: true,
      hasPublishedAt: Boolean(item.publishedAt),
      internalLinkCount: 1,
      adminPath: `/admin/emlaklar/${item.id}`,
      publicPath: `/emlaklar/${item.slug}`,
    })),
    ...posts.map((item) => ({
      kind: "post" as const,
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.content,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      noIndex: item.noIndex,
      imageUrl: item.coverUrl,
      imageAlt: item.coverAlt,
      hasAuthor: Boolean(item.authorId),
      hasPublishedAt: Boolean(item.publishedAt),
      internalLinkCount: 1,
      adminPath: `/admin/blog/${item.id}`,
      publicPath: `/blog/${item.slug}`,
    })),
    ...projects.map((item) => ({
      kind: "project" as const,
      id: item.id,
      title: item.name,
      slug: item.slug,
      description: item.description,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      noIndex: item.noIndex,
      imageUrl: item.coverUrl,
      imageAlt: item.images[0]?.alt,
      hasLocation: Boolean(item.cityId),
      hasAuthor: true,
      hasPublishedAt: true,
      internalLinkCount: 1,
      adminPath: `/admin/layiheler/${item.id}`,
      publicPath: `/layiheler/${item.slug}`,
    })),
    ...services.map((item) => ({
      kind: "service" as const,
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      noIndex: item.noIndex,
      imageUrl: item.imageUrl,
      imageAlt: item.imageUrl ? item.title : null,
      hasAuthor: true,
      hasPublishedAt: true,
      internalLinkCount: 1,
      adminPath: `/admin/xidmetler/${item.id}`,
      publicPath: `/xidmetler/${item.slug}`,
    })),
  ];
  return evaluateSeoAudit(contents);
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
  const [types, cities, districts, metros, features, projects] = await Promise.all([
    prisma.propertyType.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { order: "asc" },
    }),
    prisma.location.findMany({
      where: { kind: "CITY" },
      select: { id: true, name: true, slug: true },
      orderBy: { order: "asc" },
    }),
    prisma.location.findMany({
      where: { kind: { in: ["DISTRICT", "SETTLEMENT"] } },
      select: { id: true, name: true, slug: true, kind: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { kind: "METRO" },
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { name: "asc" },
    }),
    prisma.feature.findMany({
      select: { id: true, name: true, slug: true, group: true },
      orderBy: [{ group: "asc" }, { order: "asc" }],
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { types, cities, districts, metros, features, projects };
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
/** Cədvəldə saxlanılan fərqli yolların tavanı — skaner selini məhdudlaşdırır. */
const NOT_FOUND_HIT_LIMIT = 5_000;
/** Uzun yol yalnız jurnal üçündür; tam saxlamağın faydası yoxdur. */
const NOT_FOUND_PATH_MAX = 512;

/**
 * 404 sayğacı.
 *
 * Marşrut autentifikasiyasız və `force-dynamic`-dir: təsadüfi URL-lərlə gəzən
 * bir skaner cədvəldə limitsiz sətir yarada bilirdi. İndi iki hədd var —
 * yolun uzunluğu və fərqli yolların sayı.
 *
 * Əvvəlcə `update` sınanır: təkrar 404 (adi hal) bir sorğuya düşür. Yalnız
 * yeni yol üçün sayğac oxunur və sətir yaradılır.
 */
export async function recordNotFoundHit(path: string, referrer?: string | null) {
  const safePath = path.slice(0, NOT_FOUND_PATH_MAX);

  try {
    const updated = await prisma.notFoundHit.updateMany({
      where: { path: safePath },
      data: { count: { increment: 1 }, lastSeenAt: new Date(), referrer: referrer ?? undefined },
    });
    if (updated.count > 0) return;

    if ((await prisma.notFoundHit.count()) >= NOT_FOUND_HIT_LIMIT) return;

    await prisma.notFoundHit.create({
      data: { path: safePath, referrer: referrer?.slice(0, NOT_FOUND_PATH_MAX) ?? null },
    });
  } catch {
    // Sayğac jurnaldır — 404 səhifəsi ona görə sınmamalıdır
  }
}

/** Panel — bütün yönləndirmələr. */
export async function getAdminRedirects() {
  return prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
}

/** Panel — ən çox rast gəlinən 404-lər (yönləndirmə ehtiyacını göstərir). */
export async function getTopNotFoundHits(take = 30) {
  return prisma.notFoundHit.findMany({ orderBy: { count: "desc" }, take });
}

// ---------------------------------------------------------------------------
// SAXLANMIŞ AXTARIŞ UYĞUNLUQ MÜHƏRRİKİ
// ---------------------------------------------------------------------------

type SavedSearchNotificationInput = {
  userId: string;
  type: string;
  title: string;
  content: string;
  actionUrl: string;
};

type SavedSearchMatchProperty = {
  title: string;
  slug: string;
};

type ActiveSavedSearch = {
  id: string;
  userId: string;
  name: string;
  filters: string;
  frequency: string;
  user: { email: string; locale: string };
};

export type SavedSearchMatchStore = {
  findActiveSavedSearches(): Promise<ActiveSavedSearch[]>;
  matchesFilters(filters: PropertyFilters, propertyId: string): Promise<boolean>;
  recordMatch(savedSearchId: string, propertyId: string): Promise<boolean>;
  getProperty(propertyId: string): Promise<SavedSearchMatchProperty | null>;
  createNotification(input: SavedSearchNotificationInput): Promise<void>;
  /** İstifadəçinin dilində bildiriş başlığı — mətn yazılma anında hazırlanır. */
  notificationCopy(
    locale: string,
    searchName: string,
  ): Promise<{ title: string }>;
  sendImmediateEmail(
    userEmail: string,
    locale: string,
    property: SavedSearchMatchProperty,
    searchName: string,
  ): Promise<void>;
};

export async function runSavedSearchMatching(
  propertyId: string,
  store: SavedSearchMatchStore,
): Promise<void> {
  const property = await store.getProperty(propertyId);
  if (!property) return;

  const searches = await store.findActiveSavedSearches();

  for (const search of searches) {
    // Hər saxlanmış axtarış öz təcridində işlənir.
    //
    // Əvvəl try/catch bütün döngəni əhatə edirdi: siyahıda əvvəldə duran bir
    // pozulmuş filtr istisna atanda döngə dayanırdı və **sonrakı bütün
    // istifadəçilər** həmin elan üçün bildiriş almırdı. İndi nasaz qeyd yalnız
    // özünü keçir.
    try {
      await matchOneSavedSearch(propertyId, property, search, store);
    } catch (error) {
      console.error(`[saved-search] «${search.id}» yoxlanmadı:`, error);
    }
  }
}

async function matchOneSavedSearch(
  propertyId: string,
  property: SavedSearchMatchProperty,
  search: ActiveSavedSearch,
  store: SavedSearchMatchStore,
): Promise<void> {
  // Pozulmuş və ya sxemə uyğun gəlməyən filtr sorğuya buraxılmır
  const filters = parseSavedSearchFilters(search.filters);
  if (!filters) return;

  // Söndürülmüş tezlik uyğunluğu qeyd etmir və bildiriş yaratmır
  if (search.frequency === SAVED_SEARCH_FREQUENCIES.OFF) return;

  const isMatch = await store.matchesFilters(filters, propertyId);
  if (!isMatch) return;

  const isNewMatch = await store.recordMatch(search.id, propertyId);
  if (!isNewMatch) return;

  const copy = await store.notificationCopy(search.user.locale, search.name);

  await store.createNotification({
    userId: search.userId,
    type: NOTIFICATION_TYPES.SAVED_SEARCH_MATCH,
    title: copy.title,
    content: property.title,
    // Dil prefiksi qəsdən yoxdur: link klik anında oxucunun cari dilinə
    // uyğunlaşdırılır (bax `bildirisler/notification-list.tsx`). Yazılma anında
    // sabitlənsəydi, rus dilində gəzən istifadəçi AZ versiyaya düşərdi.
    actionUrl: `/emlaklar/${property.slug}`,
  });

  // DAILY/WEEKLY üçün e-poçt burada getmir — uyğunluq `SavedSearchMatch`-də
  // `notifiedAt: null` kimi qalır və digest işi (`/api/cron/saved-search-digest`)
  // onu yığıb tək məktubda göndərir.
  if (search.frequency === SAVED_SEARCH_FREQUENCIES.IMMEDIATE) {
    try {
      await store.sendImmediateEmail(
        search.user.email,
        search.user.locale,
        property,
        search.name,
      );
    } catch (error) {
      console.error("[saved-search] dərhal e-poçt göndərilmədi:", error);
    }
  }
}

/**
 * Prisma-nın `PrismaClientKnownRequestError` sinifini import etmək (`@prisma/client/wasm.js`
 * `exports` xəritəsi ilə) workerd test mühitində modul həlli xətası yaradır — bax
 * `src/lib/prisma.ts`-dəki wasm qeydi. `code` sahəsinə görə "duck typing" yoxlaması
 * Prisma-nın rəsmi sənədlərində də tövsiyə olunan təhlükəsiz alternativdir.
 */
function isPrismaKnownRequestErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === code
  );
}

const savedSearchMatchStore: SavedSearchMatchStore = {
  async findActiveSavedSearches() {
    return prisma.savedSearch.findMany({
      where: { enabled: true },
      select: {
        id: true,
        userId: true,
        name: true,
        filters: true,
        frequency: true,
        user: { select: { email: true, locale: true } },
      },
    });
  },

  async matchesFilters(filters, propertyId) {
    const match = await prisma.property.findFirst({
      where: { ...buildPropertyWhere(filters), id: propertyId },
      select: { id: true },
    });
    return match !== null;
  },

  async recordMatch(savedSearchId, propertyId) {
    try {
      await prisma.savedSearchMatch.create({ data: { savedSearchId, propertyId } });
      return true;
    } catch (error) {
      // Unikal indeks toqquşması (P2002) — bu əmlak bu axtarışa artıq bildirilib.
      //
      // Prisma-nın `PrismaClientKnownRequestError` sinifini `@prisma/client/wasm.js`-dən
      // idxal etmək workerd test mühitində (Vitest + Miniflare) modul/tip həlli xətası
      // yaradır — bax `src/lib/prisma.ts`-dəki wasm qeydinə: bu paketin `exports`
      // xəritəsi şərti çox qatlıdır. `code` sahəsinə görə "duck typing" yoxlaması
      // Prisma-nın rəsmi sənədlərində də istifadə olunan təhlükəsiz alternativdir.
      if (isPrismaKnownRequestErrorCode(error, "P2002")) {
        return false;
      }
      throw error;
    }
  },

  async getProperty(propertyId) {
    return prisma.property.findUnique({
      where: { id: propertyId },
      select: { title: true, slug: true },
    });
  },

  async createNotification(input) {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        content: input.content,
        actionUrl: input.actionUrl,
      },
    });
  },

  async notificationCopy(locale, searchName) {
    // `getTranslations`-a dil açıq şəkildə verilir: bu kod istifadəçinin öz
    // sorğusunda deyil, elanı dərc edən **admin sorğusunda** işləyir, ona görə
    // request locale-i yanlış dili (adminin dilini) qaytarardı.
    const safeLocale = (LOCALE_VALUES as readonly string[]).includes(locale)
      ? (locale as Locale)
      : DEFAULT_LOCALE;
    try {
      const t = await getTranslations({
        locale: safeLocale,
        namespace: "account.notifications",
      });
      return { title: t("savedSearchMatch", { name: searchName }) };
    } catch (error) {
      console.error("[saved-search] bildiriş mətni tərcümə olunmadı:", error);
      return { title: `"${searchName}" axtarışına uyğun yeni elan` };
    }
  },

  async sendImmediateEmail(userEmail, locale, property, searchName) {
    // Dinamik import qəsdən: `resend` paketi statik idxal olunsaydı, bu modulu
    // yükləyən hər domen testi (unit test) onu da yükləməyə məcbur olardı.
    const { sendSavedSearchMatchEmail } = await import("@/lib/email");
    await sendSavedSearchMatchEmail(userEmail, locale, property, searchName);
  },
};

export async function notifyMatchingSavedSearches(propertyId: string): Promise<void> {
  try {
    await runSavedSearchMatching(propertyId, savedSearchMatchStore);
  } catch (error) {
    console.error("[saved-search] uyğunluq yoxlanmadı:", error);
  }
}

// ---------------------------------------------------------------------------
// BİLDİRİŞ MƏRKƏZİ
// ---------------------------------------------------------------------------

/** Naviqasiyada göstərilən oxunmamış bildiriş sayı. */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

// ---------------------------------------------------------------------------
// SAXLANMIŞ AXTARIŞ DIGEST-İ (GÜNDƏLİK / HƏFTƏLİK)
// ---------------------------------------------------------------------------

/**
 * Digest mühərrikinin D1 implementasiyası.
 *
 * Mühərrikin özü `src/lib/saved-search-digest.ts`-dədir və store-u kənardan
 * alır — beləliklə vaxt/tezlik məntiqi Prisma olmadan test edilə bilir.
 */
export const savedSearchDigestStore: DigestStore = {
  async findDigestSavedSearches() {
    return prisma.savedSearch.findMany({
      where: {
        enabled: true,
        frequency: {
          in: [SAVED_SEARCH_FREQUENCIES.DAILY, SAVED_SEARCH_FREQUENCIES.WEEKLY],
        },
      },
      select: {
        id: true,
        userId: true,
        name: true,
        frequency: true,
        lastNotifiedAt: true,
        user: { select: { email: true, locale: true } },
      },
    });
  },

  async findPendingMatches(savedSearchId, limit) {
    const matches = await prisma.savedSearchMatch.findMany({
      where: {
        savedSearchId,
        notifiedAt: null,
        // Elan bu arada silinib və ya qaralamaya qaytarılıbsa məktuba düşməməlidir
        property: publicPropertyWhere(),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            images: {
              orderBy: { order: "asc" },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    return matches.map(({ property }) => ({
      id: property.id,
      title: property.title,
      slug: property.slug,
      price: property.price,
      currency: property.currency,
      imageUrl: property.images[0]?.url ?? null,
    }));
  },

  async countPendingMatches(savedSearchId) {
    return prisma.savedSearchMatch.count({
      where: { savedSearchId, notifiedAt: null, property: publicPropertyWhere() },
    });
  },

  async sendDigestEmail({ email, locale, searchName, frequency, properties, totalCount }) {
    // Dinamik import: `resend` paketi bu modulu yükləyən unit testlərə düşməsin
    const { sendSavedSearchDigestEmail } = await import("@/lib/email");
    await sendSavedSearchDigestEmail({
      userEmail: email,
      locale,
      searchName,
      frequency,
      properties,
      totalCount,
    });
  },

  async markNotified(savedSearchId, propertyIds, at) {
    // D1 transaction dəstəkləmir: əvvəlcə uyğunluqlar möhürlənir, sonra axtarış.
    // Sıra qəsdəndir — aradakı nasazlıqda təkrar məktub getmir, sadəcə növbəti
    // işləmə `lastNotifiedAt`-ı yeniləyir.
    await prisma.savedSearchMatch.updateMany({
      where: { savedSearchId, propertyId: { in: propertyIds }, notifiedAt: null },
      data: { notifiedAt: at },
    });
    await prisma.savedSearch.update({
      where: { id: savedSearchId },
      data: { lastNotifiedAt: at, lastCheckedAt: at },
    });
  },

  async markChecked(savedSearchId, at) {
    await prisma.savedSearch.update({
      where: { id: savedSearchId },
      data: { lastCheckedAt: at },
    });
  },
};

// ---------------------------------------------------------------------------
// TƏRƏFDAŞLAR (PARTNERS)
// ---------------------------------------------------------------------------

/** Müqavilə tarixləri gün dəqiqliyindədir — son gün bütöv sayılır. */
function startOfToday(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Hər ictimai tərəfdaş sorğusunun bazası.
 *
 * `publicPropertyWhere()` ilə eyni rolu oynayır və eyni intizamı tələb edir:
 * **yeni ictimai tərəfdaş sorğusu mütləq bundan başlamalıdır**, əks halda
 * qaralama, dayandırılmış və silinmiş tərəfdaşlar sayta sızır.
 *
 * `partnershipEndDate` şərti SQL səviyyəsində qəsdən yoxlanılır: cron gecikə
 * bilər, amma müddəti bitmiş müqavilə həmin an görünməməlidir. `null` (müddətsiz)
 * və gələcək tarix keçir; keçmiş tarix süzülür.
 */
function publicPartnerWhere(now: Date = new Date()): Prisma.PartnerWhereInput {
  return {
    deletedAt: null,
    status: { in: PUBLIC_PARTNER_STATUSES },
    showPublicly: true,
    OR: [{ partnershipEndDate: null }, { partnershipEndDate: { gte: startOfToday(now) } }],
  };
}

/**
 * Kart komponentlərinin gözlədiyi dəqiq sahə dəsti.
 *
 * Müqavilə metadatası (`contractNumber`, `internalNotes` və s.) burada **yoxdur**
 * və olmamalıdır: ictimai sorğu onu heç vaxt bazadan çıxarmır, beləliklə səhvən
 * serializasiya olunub client bundle-a düşməsi mümkün deyil.
 */
export const partnerCardSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  shortDescriptionEn: true,
  shortDescriptionRu: true,
  logoUrl: true,
  logoLight: true,
  logoDark: true,
  partnershipType: true,
  status: true,
  verified: true,
  officialPartner: true,
  featured: true,
  showPublicly: true,
  showOnHomepage: true,
  officialSince: true,
  partnershipEndDate: true,
  websiteUrl: true,
  country: true,
  city: true,
  sortOrder: true,
} satisfies Prisma.PartnerSelect;

export type PartnerCardData = Prisma.PartnerGetPayload<{ select: typeof partnerCardSelect }>;

/** Kartdakı sahələr + profil səhifəsinin əlavə tələb etdikləri. */
const partnerDetailSelect = {
  ...partnerCardSelect,
  legalName: true,
  description: true,
  descriptionEn: true,
  descriptionRu: true,
  disclaimer: true,
  disclaimerEn: true,
  disclaimerRu: true,
  coverImage: true,
  email: true,
  phone: true,
  whatsapp: true,
  address: true,
  seoTitle: true,
  seoDescription: true,
  seoKeywords: true,
  ogImage: true,
  updatedAt: true,
} satisfies Prisma.PartnerSelect;

export type PartnerDetailData = Prisma.PartnerGetPayload<{ select: typeof partnerDetailSelect }>;

const PARTNER_ORDER: Prisma.PartnerOrderByWithRelationInput[] = [
  { featured: "desc" },
  { sortOrder: "asc" },
  { name: "asc" },
];

export const PARTNER_PAGE_SIZE = 24;

/**
 * İctimai tərəfdaş siyahısı.
 *
 * Səhifələmə server tərəfdədir — siyahı yüzlərlə tərəfdaşa qədər böyüyə bilər
 * və hamısını bir sorğuda çəkmək siyahı səhifəsinin LCP-sini pozardı.
 */
export async function getPublicPartners(
  filters: { types?: string[] | null; page?: number; pageSize?: number } = {},
) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PARTNER_PAGE_SIZE;
  const where: Prisma.PartnerWhereInput = {
    ...publicPartnerWhere(),
    ...(filters.types?.length ? { partnershipType: { in: filters.types } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      select: partnerCardSelect,
      orderBy: PARTNER_ORDER,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.partner.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Filtr düymələrinin yanındakı saylar — qrupda tərəfdaş yoxdursa düymə gizlədilir. */
export async function getPublicPartnerTypeCounts(): Promise<Record<string, number>> {
  const rows = await prisma.partner.groupBy({
    by: ["partnershipType"],
    where: publicPartnerWhere(),
    _count: { _all: true },
  });

  return Object.fromEntries(rows.map((row) => [row.partnershipType, row._count._all]));
}

/** Ana səhifədə göstərilən tərəfdaşlar — hamısı deyil, yalnız işarələnmişlər. */
export async function getHomepagePartners(take = 6) {
  return prisma.partner.findMany({
    where: { ...publicPartnerWhere(), showOnHomepage: true },
    select: partnerCardSelect,
    orderBy: PARTNER_ORDER,
    take,
  });
}

/**
 * Tərəfdaş profili və onunla əlaqəli ictimai məzmun.
 *
 * Əlaqələr `partnerId` üzrə indekslənmiş əlaqə cədvəllərindən bir sorğu ilə
 * gətirilir — hər elan üçün ayrıca sorğu yoxdur, N+1 yaranmır. Elanlara
 * `publicPropertyWhere()` yenidən tətbiq olunur: tərəfdaş ictimai olsa da
 * onun qaralama elanı görünməməlidir.
 */
export async function getPartnerBySlug(slug: string) {
  const partner = await prisma.partner.findFirst({
    where: { ...publicPartnerWhere(), slug },
    select: partnerDetailSelect,
  });

  if (!partner) return null;

  const [propertyLinks, projectLinks, agencyLinks] = await Promise.all([
    prisma.propertyPartner.findMany({
      where: { partnerId: partner.id, isPublic: true, property: publicPropertyWhere() },
      select: { role: true, property: { select: propertyCardSelect } },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.projectPartner.findMany({
      where: {
        partnerId: partner.id,
        isPublic: true,
        project: { deletedAt: null, isDemo: false, isActive: true },
      },
      select: { role: true, project: { select: projectCardSelect } },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.agencyPartner.findMany({
      where: {
        partnerId: partner.id,
        isPublic: true,
        agency: { isVerified: true, user: { isActive: true } },
      },
      select: {
        role: true,
        agency: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return {
    partner,
    properties: propertyLinks,
    projects: projectLinks,
    agencies: agencyLinks,
  };
}

/**
 * Elan səhifəsindəki tərəfdaş bloku.
 *
 * Yalnız `isPublic` əlaqələr və yalnız ictimai görünən tərəfdaşlar qaytarılır —
 * dayandırılmış tərəfdaşın loqosu elan səhifəsində qalmamalıdır.
 */
export async function getPropertyPartners(propertyId: string) {
  return prisma.propertyPartner.findMany({
    where: { propertyId, isPublic: true, partner: publicPartnerWhere() },
    select: { role: true, isPrimary: true, sourceUrl: true, partner: { select: partnerCardSelect } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export type PropertyPartnerLink = Awaited<ReturnType<typeof getPropertyPartners>>[number];

export async function getProjectPartners(projectId: string) {
  return prisma.projectPartner.findMany({
    where: { projectId, isPublic: true, partner: publicPartnerWhere() },
    select: { role: true, isPrimary: true, partner: { select: partnerCardSelect } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export type ProjectPartnerLink = Awaited<ReturnType<typeof getProjectPartners>>[number];

/** Sitemap: yalnız ictimai görünən tərəfdaşlar. */
export async function getSitemapPartners() {
  return prisma.partner.findMany({
    where: publicPartnerWhere(),
    select: { slug: true, updatedAt: true },
  });
}

// ---------------------------------------------------------------------------
// TƏRƏFDAŞLAR — PANEL
// ---------------------------------------------------------------------------

export type AdminPartnerFilters = {
  search?: string;
  status?: string;
  type?: string;
  verified?: string;
  official?: string;
  featured?: string;
  homepage?: string;
  country?: string;
  page?: number;
};

const adminPartnerSelect = {
  id: true,
  name: true,
  slug: true,
  legalName: true,
  logoUrl: true,
  logoLight: true,
  logoDark: true,
  partnershipType: true,
  status: true,
  verified: true,
  officialPartner: true,
  featured: true,
  showPublicly: true,
  showOnHomepage: true,
  officialSince: true,
  partnershipEndDate: true,
  country: true,
  city: true,
  sortOrder: true,
  updatedAt: true,
  deletedAt: true,
  _count: { select: { properties: true, projects: true } },
} satisfies Prisma.PartnerSelect;

export type AdminPartnerRow = Prisma.PartnerGetPayload<{ select: typeof adminPartnerSelect }>;

/** «1»/«0» filtr dəyərini boolean şərtinə çevirir; boş dəyər filtri söndürür. */
function partnerBooleanFilter(value: string | undefined): boolean | undefined {
  if (value === "1") return true;
  if (value === "0") return false;
  return undefined;
}

export async function getAdminPartners(filters: AdminPartnerFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const search = filters.search?.trim();
  const verified = partnerBooleanFilter(filters.verified);
  const official = partnerBooleanFilter(filters.official);
  const featured = partnerBooleanFilter(filters.featured);
  const homepage = partnerBooleanFilter(filters.homepage);

  const where: Prisma.PartnerWhereInput = {
    // `ARCHIVED` adi statusdur və siyahıda görünür; `deletedAt` isə həqiqi
    // yumşaq silmədir — silinmiş qeyd yalnız bərpa əməliyyatı ilə qayıdır.
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { partnershipType: filters.type } : {}),
    ...(filters.country ? { country: filters.country } : {}),
    ...(verified !== undefined ? { verified } : {}),
    ...(official !== undefined ? { officialPartner: official } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(homepage !== undefined ? { showOnHomepage: homepage } : {}),
    // D1 `mode: "insensitive"` dəstəkləmir — SQLite LIKE yalnız ASCII-də reqistrsizdir.
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { legalName: { contains: search } },
            { websiteUrl: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      select: adminPartnerSelect,
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.partner.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

/**
 * Redaktə formasının məlumatı.
 *
 * `includeContract` **məcburi** parametrdir: çağıran tərəf `partner:contract`
 * icazəsini yoxlamağa borcludur. Standart dəyər qoyulmayıb ki, unudulan çağırış
 * səssizcə kommersiya sirrini forma HTML-inə çıxarmasın.
 */
export async function getAdminPartnerById(id: string, includeContract: boolean) {
  return prisma.partner.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...adminPartnerSelect,
      shortDescription: true,
      shortDescriptionEn: true,
      shortDescriptionRu: true,
      description: true,
      descriptionEn: true,
      descriptionRu: true,
      disclaimer: true,
      disclaimerEn: true,
      disclaimerRu: true,
      coverImage: true,
      websiteUrl: true,
      email: true,
      phone: true,
      whatsapp: true,
      address: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      ogImage: true,
      verifiedAt: true,
      createdAt: true,
      ...(includeContract
        ? {
            contractNumber: true,
            contractStartDate: true,
            contractEndDate: true,
            contractDocument: true,
            internalNotes: true,
          }
        : {}),
    },
  });
}

export type AdminPartnerDetail = NonNullable<Awaited<ReturnType<typeof getAdminPartnerById>>>;

/** Filtr açılışındakı ölkə siyahısı — yalnız real istifadə olunan dəyərlər. */
export async function getAdminPartnerCountries() {
  const rows = await prisma.partner.findMany({
    where: { deletedAt: null, country: { not: null } },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });
  return rows.map((row) => row.country).filter((value): value is string => Boolean(value));
}

/** Status üzrə saylar — panelin alt naviqasiyasındakı rəqəmlər. */
export async function getAdminPartnerStatusCounts(): Promise<Record<string, number>> {
  const rows = await prisma.partner.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
}

/**
 * Dublikat xəbərdarlığı üçün namizədlər.
 *
 * Domen müqayisəsi SQL-də deyil tətbiqdə aparılır (`partnerDomain()`): `www.`
 * prefiksi və protokol fərqi SQL `LIKE` ilə etibarlı tutulmur. Siyahı kiçikdir —
 * tərəfdaş sayı minlərlə ölçülən kolleksiya deyil.
 */
export async function findPartnerDuplicateCandidates(excludeId?: string) {
  return prisma.partner.findMany({
    where: { deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, name: true, slug: true, legalName: true, websiteUrl: true },
  });
}

/** Elan/layihə formasında tərəfdaş seçimi — arxivlənmiş tərəfdaş təklif edilmir. */
export async function getPartnerOptions() {
  return prisma.partner.findMany({
    where: { deletedAt: null, status: { not: PARTNER_STATUSES.ARCHIVED } },
    select: { id: true, name: true, partnershipType: true, status: true },
    orderBy: { name: "asc" },
  });
}

/** Konkret elanın bütün tərəfdaş əlaqələri — paneldə redaktə üçün. */
export async function getAdminPropertyPartnerLinks(propertyId: string) {
  return prisma.propertyPartner.findMany({
    where: { propertyId },
    select: {
      id: true,
      partnerId: true,
      role: true,
      sourceUrl: true,
      isPublic: true,
      isPrimary: true,
      partner: { select: { name: true, slug: true } },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

export async function getAdminProjectPartnerLinks(projectId: string) {
  return prisma.projectPartner.findMany({
    where: { projectId },
    select: {
      id: true,
      partnerId: true,
      role: true,
      isPublic: true,
      isPrimary: true,
      partner: { select: { name: true, slug: true } },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

/**
 * Cron: müddəti bitmiş, amma hələ `ACTIVE` qalan tərəfdaşlar.
 * Yekun qərar `shouldMarkExpired()`-də verilir — burada yalnız namizədlər daraldılır.
 */
export async function getExpiredActivePartners(now: Date = new Date()) {
  return prisma.partner.findMany({
    where: {
      deletedAt: null,
      status: PARTNER_STATUSES.ACTIVE,
      partnershipEndDate: { not: null, lt: startOfToday(now) },
    },
    select: { id: true, name: true, status: true, partnershipEndDate: true, deletedAt: true },
  });
}

/** Paneldə xəbərdarlıq üçün: müqaviləsi yaxınlaşan və ya bitmiş aktiv tərəfdaşlar. */
export async function getPartnerExpiryAlerts(withinDays: number, now: Date = new Date()) {
  const horizon = new Date(startOfToday(now).getTime() + withinDays * 24 * 60 * 60 * 1000);
  return prisma.partner.findMany({
    where: {
      deletedAt: null,
      status: { in: [PARTNER_STATUSES.ACTIVE, PARTNER_STATUSES.EXPIRED] },
      partnershipEndDate: { not: null, lte: horizon },
    },
    select: { id: true, name: true, slug: true, status: true, partnershipEndDate: true },
    orderBy: { partnershipEndDate: "asc" },
    take: 10,
  });
}
