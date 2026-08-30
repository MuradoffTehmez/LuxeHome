import { prisma } from "@/lib/prisma";
import {
  FAQ_CATEGORIES,
  KNOWLEDGE_AUDIENCES,
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_PAGE_SIZE,
  KNOWLEDGE_STATUSES,
  type FaqCategory,
  type KnowledgeAudience,
  type KnowledgeLevel,
} from "@/lib/constants";
import { normalizeSearchText } from "@/lib/search-normalization";

/**
 * Bilik Mərkəzi — sorğu və domen qatı.
 *
 * Ayrıca modul saxlanılır (`queries.ts`-ə əlavə edilmir), çünki modul üç ayrı
 * məzmun tipini (bələdçi, termin, FAQ) idarə edir və `queries.ts` onsuz da
 * ~2 900 sətirdir. `partners.ts` və `phase2.ts` ilə eyni yanaşmadır.
 *
 * **Görünürlük invariantı.** Hər ictimai sorğu `publishedKnowledgeWhere()`-dən
 * başlayır: `status = PUBLISHED`, `deletedAt = null`, `isDemo = false`. Yeni
 * ictimai sorğu yazarkən bu şərt buraxılsa, qaralama məzmun sızır — eynilə
 * `publicPropertyWhere()`-də olduğu kimi.
 */

// ---------------------------------------------------------------------------
// GÖRÜNÜRLÜK
// ---------------------------------------------------------------------------

export function publishedKnowledgeWhere() {
  return {
    status: KNOWLEDGE_STATUSES.PUBLISHED,
    deletedAt: null,
    isDemo: false,
  } as const;
}

// ---------------------------------------------------------------------------
// SEÇİM DƏSTLƏRİ
// ---------------------------------------------------------------------------

/** Bələdçi kartlarının gözlədiyi dəqiq sahə dəsti. */
export const knowledgeCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  audience: true,
  level: true,
  readMinutes: true,
  coverUrl: true,
  coverAlt: true,
  isFeatured: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { slug: true, name: true, icon: true } },
} as const;

export type KnowledgeCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  audience: string;
  level: string;
  readMinutes: number;
  coverUrl: string | null;
  coverAlt: string;
  isFeatured: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  category: { slug: string; name: string; icon: string | null } | null;
};

// ---------------------------------------------------------------------------
// NORMALLAŞDIRMA
// ---------------------------------------------------------------------------

/** Bələdçinin registrsiz/diakritiksiz axtarış indeksi. */
export function knowledgeSearchText(input: { title: string; excerpt: string }): string {
  return normalizeSearchText(`${input.title} ${input.excerpt}`);
}

/**
 * Terminin hərf indeksindəki başlığı.
 *
 * Normallaşdırılmış formadan götürülür ki, «Ə» və «E» eyni qrupa düşsün —
 * əks halda lüğətdə iki ayrı «E» bölməsi yaranardı və oxucu terminləri tapmazdı.
 */
export function termInitial(term: string): string {
  const normalized = normalizeSearchText(term);
  return normalized ? normalized[0].toUpperCase() : "#";
}

export function isKnowledgeAudience(value: string): value is KnowledgeAudience {
  return (Object.values(KNOWLEDGE_AUDIENCES) as string[]).includes(value);
}

export function isKnowledgeLevel(value: string): value is KnowledgeLevel {
  return (Object.values(KNOWLEDGE_LEVELS) as string[]).includes(value);
}

export function isFaqCategory(value: string): value is FaqCategory {
  return (Object.values(FAQ_CATEGORIES) as string[]).includes(value);
}

// ---------------------------------------------------------------------------
// İCTİMAİ SORĞULAR — BƏLƏDÇİLƏR
// ---------------------------------------------------------------------------

export type KnowledgeArticleFilters = {
  categorySlug?: string;
  audience?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function getKnowledgeArticles(filters: KnowledgeArticleFilters = {}) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize ?? KNOWLEDGE_PAGE_SIZE;

  const where: Record<string, unknown> = { ...publishedKnowledgeWhere() };
  if (filters.categorySlug) where.category = { slug: filters.categorySlug };
  if (filters.audience && isKnowledgeAudience(filters.audience)) where.audience = filters.audience;
  if (filters.search?.trim()) {
    where.searchText = { contains: normalizeSearchText(filters.search) };
  }

  const [items, total] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: knowledgeCardSelect,
    }),
    prisma.knowledgeArticle.count({ where }),
  ]);

  return {
    items: items as KnowledgeCardData[],
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getKnowledgeArticleBySlug(slug: string) {
  return prisma.knowledgeArticle.findFirst({
    where: { slug, ...publishedKnowledgeWhere() },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      audience: true,
      level: true,
      legalStatus: true,
      riskLevel: true,
      jurisdiction: true,
      legalReviewedAt: true,
      legalActs: true,
      sourceUrls: true,
      legalBasis: true,
      requiredDocuments: true,
      procedure: true,
      duration: true,
      costs: true,
      risks: true,
      checklist: true,
      template: true,
      courtPosition: true,
      readMinutes: true,
      coverUrl: true,
      coverAlt: true,
      viewCount: true,
      publishedAt: true,
      updatedAt: true,
      metaTitle: true,
      metaDescription: true,
      noIndex: true,
      canonicalUrl: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
      category: { select: { slug: true, name: true, description: true, icon: true } },
      author: { select: { name: true } },
    },
  });
}

/** Eyni kateqoriya/auditoriyadan növbəti oxu tövsiyələri. */
export async function getRelatedKnowledgeArticles(input: {
  excludeId: string;
  categorySlug?: string | null;
  audience: string;
  take?: number;
}) {
  const take = input.take ?? 3;
  const base = { ...publishedKnowledgeWhere(), id: { not: input.excludeId } };

  const sameCategory = input.categorySlug
    ? await prisma.knowledgeArticle.findMany({
        where: { ...base, category: { slug: input.categorySlug } },
        orderBy: [{ publishedAt: "desc" }],
        take,
        select: knowledgeCardSelect,
      })
    : [];

  if (sameCategory.length >= take) return sameCategory as KnowledgeCardData[];

  const fill = await prisma.knowledgeArticle.findMany({
    where: {
      ...base,
      audience: input.audience,
      id: { notIn: [input.excludeId, ...sameCategory.map((item) => item.id)] },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: take - sameCategory.length,
    select: knowledgeCardSelect,
  });

  return [...sameCategory, ...fill] as KnowledgeCardData[];
}

export async function getKnowledgeCategories() {
  return prisma.knowledgeCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      _count: {
        select: {
          articles: { where: publishedKnowledgeWhere() },
          terms: { where: { status: KNOWLEDGE_STATUSES.PUBLISHED } },
        },
      },
    },
  });
}

export async function getKnowledgeCategoryBySlug(slug: string) {
  return prisma.knowledgeCategory.findFirst({
    where: { slug, isActive: true },
    select: { id: true, slug: true, name: true, description: true, icon: true },
  });
}

// ---------------------------------------------------------------------------
// İCTİMAİ SORĞULAR — LÜĞƏT
// ---------------------------------------------------------------------------

export type KnowledgeTermData = {
  id: string;
  slug: string;
  term: string;
  shortDefinition: string;
  initial: string;
  category: { slug: string; name: string } | null;
};

export async function getKnowledgeTerms(filters: { search?: string; initial?: string } = {}) {
  const where: Record<string, unknown> = { status: KNOWLEDGE_STATUSES.PUBLISHED };
  if (filters.initial) where.initial = filters.initial.toUpperCase();
  if (filters.search?.trim()) {
    where.searchName = { contains: normalizeSearchText(filters.search) };
  }

  const terms = await prisma.knowledgeTerm.findMany({
    where,
    orderBy: [{ initial: "asc" }, { order: "asc" }, { term: "asc" }],
    select: {
      id: true,
      slug: true,
      term: true,
      shortDefinition: true,
      initial: true,
      category: { select: { slug: true, name: true } },
    },
  });
  return terms as KnowledgeTermData[];
}

/** Terminləri hərf üzrə qruplaşdırır — lüğət səhifəsinin A-Z indeksi üçün. */
export function groupTermsByInitial(terms: KnowledgeTermData[]) {
  const groups = new Map<string, KnowledgeTermData[]>();
  for (const term of terms) {
    const key = term.initial || "#";
    const bucket = groups.get(key) ?? [];
    bucket.push(term);
    groups.set(key, bucket);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "az"));
}

export async function getKnowledgeTermBySlug(slug: string) {
  return prisma.knowledgeTerm.findFirst({
    where: { slug, status: KNOWLEDGE_STATUSES.PUBLISHED },
    select: {
      id: true,
      slug: true,
      term: true,
      shortDefinition: true,
      definition: true,
      relatedSlugs: true,
      updatedAt: true,
      category: { select: { slug: true, name: true } },
    },
  });
}

export async function getRelatedTerms(slugs: string[], excludeSlug: string) {
  const wanted = slugs.filter((slug) => slug && slug !== excludeSlug).slice(0, 6);
  if (wanted.length === 0) return [];
  const terms = await prisma.knowledgeTerm.findMany({
    where: { slug: { in: wanted }, status: KNOWLEDGE_STATUSES.PUBLISHED },
    select: { slug: true, term: true, shortDefinition: true },
  });
  return terms;
}

// ---------------------------------------------------------------------------
// İCTİMAİ SORĞULAR — FAQ
// ---------------------------------------------------------------------------

export type FaqEntryData = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export async function getPublishedFaqEntries(): Promise<FaqEntryData[]> {
  return prisma.knowledgeFaq.findMany({
    where: { status: KNOWLEDGE_STATUSES.PUBLISHED },
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: { id: true, question: true, answer: true, category: true },
  });
}

/** FAQ qeydlərini PRD §86-dakı kateqoriya sırası ilə qruplaşdırır. */
export function groupFaqByCategory(entries: FaqEntryData[]) {
  const order = Object.values(FAQ_CATEGORIES) as string[];
  const groups = new Map<string, FaqEntryData[]>();
  for (const entry of entries) {
    const key = isFaqCategory(entry.category) ? entry.category : FAQ_CATEGORIES.PLATFORM;
    const bucket = groups.get(key) ?? [];
    bucket.push(entry);
    groups.set(key, bucket);
  }
  return [...groups.entries()].sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
  );
}

// ---------------------------------------------------------------------------
// SITEMAP
// ---------------------------------------------------------------------------

export async function getKnowledgeSitemapEntries() {
  const [articles, terms, categories] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where: { ...publishedKnowledgeWhere(), noIndex: false, canonicalUrl: null },
      select: { slug: true, updatedAt: true },
    }),
    prisma.knowledgeTerm.findMany({
      where: { status: KNOWLEDGE_STATUSES.PUBLISHED },
      select: { slug: true, updatedAt: true },
    }),
    prisma.knowledgeCategory.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    ...categories.map((item) => ({
      path: `/bilik-merkezi/kateqoriya/${item.slug}`,
      updatedAt: item.updatedAt,
    })),
    ...articles.map((item) => ({
      path: `/bilik-merkezi/${item.slug}`,
      updatedAt: item.updatedAt,
    })),
    ...terms.map((item) => ({ path: `/lugat/${item.slug}`, updatedAt: item.updatedAt })),
  ];
}

// ---------------------------------------------------------------------------
// ADMIN SORĞULARI
// ---------------------------------------------------------------------------

export async function getAdminKnowledgeArticles(filters: { search?: string; status?: string } = {}) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.search?.trim()) {
    where.searchText = { contains: normalizeSearchText(filters.search) };
  }
  return prisma.knowledgeArticle.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      audience: true,
      level: true,
      readMinutes: true,
      viewCount: true,
      isFeatured: true,
      updatedAt: true,
      category: { select: { name: true } },
    },
  });
}

export async function getAdminKnowledgeCategories() {
  return prisma.knowledgeCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      order: true,
      isActive: true,
      _count: { select: { articles: true, terms: true } },
    },
  });
}

export async function getAdminKnowledgeTerms() {
  return prisma.knowledgeTerm.findMany({
    orderBy: [{ term: "asc" }],
    take: 500,
    select: {
      id: true,
      slug: true,
      term: true,
      shortDefinition: true,
      definition: true,
      relatedSlugs: true,
      status: true,
      order: true,
      categoryId: true,
      category: { select: { name: true } },
    },
  });
}

export async function getAdminFaqEntries() {
  return prisma.knowledgeFaq.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
    take: 500,
    select: {
      id: true,
      question: true,
      answer: true,
      category: true,
      status: true,
      order: true,
    },
  });
}
