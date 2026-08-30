import { unstable_cache } from "next/cache";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import {
  getBlogCategories,
  getFeaturedProperties,
  getFilterOptions,
  getPostBySlug,
  getPosts,
  getProjectBySlug,
  getProjects,
  getProperties,
  getPropertyBySlug,
  getPropertyTypesWithCounts,
  getHomepagePartners,
  getPartnerBySlug,
  getPublicPartners,
  getPublicPartnerTypeCounts,
  getServiceBySlug,
  getServices,
  getSitemapEntries,
  type PropertyFilters,
} from "@/lib/queries";
import {
  getKnowledgeArticleBySlug,
  getKnowledgeArticles,
  getKnowledgeCategories,
  getKnowledgeTerms,
  getKnowledgeSitemapEntries,
  getPublishedFaqEntries,
  type KnowledgeArticleFilters,
} from "@/lib/knowledge";

const FIVE_MINUTES = 300;

export const getCachedProperties = unstable_cache(
  async (filters: PropertyFilters) => getProperties(filters),
  ["public-property-list-v1"],
  { tags: [PUBLIC_CACHE_TAGS.properties], revalidate: FIVE_MINUTES },
);

/**
 * Filtr açılışlarının məzmunu (əmlak növü, şəhər/rayon, metro, xüsusiyyət).
 *
 * `/emlaklar` səhifəsi bunu hər sorğuda keşsiz oxuyurdu — dörd ayrı D1 sorğusu,
 * halbuki taksonomiya ayda bir dəfə dəyişir. Nəticələr `taxonomy` teqi ilə
 * bağlıdır, ona görə paneldən taksonomiya dəyişəndə keş dərhal təmizlənir.
 */
export const getCachedFilterOptions = unstable_cache(
  getFilterOptions,
  ["public-filter-options-v1"],
  { tags: [PUBLIC_CACHE_TAGS.taxonomy], revalidate: FIVE_MINUTES },
);

export const getCachedPosts = unstable_cache(
  async (filters: { categorySlug?: string; page?: number; pageSize?: number; search?: string }) =>
    getPosts(filters),
  ["public-post-list-v1"],
  { tags: [PUBLIC_CACHE_TAGS.posts], revalidate: FIVE_MINUTES },
);

export const getCachedPropertyBySlug = unstable_cache(
  async (slug: string) => getPropertyBySlug(slug),
  ["public-property-detail-v1"],
  { tags: [PUBLIC_CACHE_TAGS.properties], revalidate: FIVE_MINUTES },
);

export const getCachedProjectBySlug = unstable_cache(
  async (slug: string) => getProjectBySlug(slug),
  ["public-project-detail-v1"],
  { tags: [PUBLIC_CACHE_TAGS.projects], revalidate: FIVE_MINUTES },
);

export const getCachedPostBySlug = unstable_cache(
  async (slug: string) => getPostBySlug(slug),
  ["public-post-detail-v1"],
  { tags: [PUBLIC_CACHE_TAGS.posts], revalidate: FIVE_MINUTES },
);

export const getCachedServiceBySlug = unstable_cache(
  async (slug: string) => getServiceBySlug(slug),
  ["public-service-detail-v1"],
  { tags: [PUBLIC_CACHE_TAGS.services], revalidate: FIVE_MINUTES },
);

export const getCachedHomePageData = unstable_cache(
  async () => {
    const [featured, propertyTypes, services, projects, posts, filterOptions, categories, partners] =
      await Promise.all([
        getFeaturedProperties(6),
        getPropertyTypesWithCounts(),
        getServices(),
        getProjects(),
        getPosts({ pageSize: 3 }),
        getFilterOptions(),
        getBlogCategories(),
        getHomepagePartners(),
      ]);
    return { featured, propertyTypes, services, projects, posts, filterOptions, categories, partners };
  },
  ["public-home-discovery-v1"],
  {
    tags: [
      PUBLIC_CACHE_TAGS.home,
      PUBLIC_CACHE_TAGS.properties,
      PUBLIC_CACHE_TAGS.projects,
      PUBLIC_CACHE_TAGS.posts,
      PUBLIC_CACHE_TAGS.services,
      PUBLIC_CACHE_TAGS.agencies,
      PUBLIC_CACHE_TAGS.partners,
      PUBLIC_CACHE_TAGS.taxonomy,
    ],
    revalidate: FIVE_MINUTES,
  },
);

export const getCachedSitemapEntries = unstable_cache(
  getSitemapEntries,
  ["public-sitemap-entries-v1"],
  { tags: [PUBLIC_CACHE_TAGS.sitemap], revalidate: FIVE_MINUTES },
);

/**
 * Tərəfdaş siyahısı və profili.
 *
 * `partners` teqi paneldəki hər tərəfdaş yazısında təmizlənir
 * (`revalidatePublicContent("partner", slug)`), ona görə beş dəqiqəlik
 * revalidate yalnız son çarə kimi işləyir — redaktə dərhal görünür.
 */
export const getCachedPublicPartners = unstable_cache(
  async (filters: { types?: string[] | null; page?: number }) => getPublicPartners(filters),
  ["public-partner-list-v1"],
  { tags: [PUBLIC_CACHE_TAGS.partners], revalidate: FIVE_MINUTES },
);

export const getCachedPartnerTypeCounts = unstable_cache(
  getPublicPartnerTypeCounts,
  ["public-partner-type-counts-v1"],
  { tags: [PUBLIC_CACHE_TAGS.partners], revalidate: FIVE_MINUTES },
);

export const getCachedPartnerBySlug = unstable_cache(
  async (slug: string) => getPartnerBySlug(slug),
  ["public-partner-detail-v1"],
  {
    // Profil əlaqəli elan və layihələri də göstərir — onlar dəyişəndə də
    // yenilənməlidir, əks halda satılmış elan tərəfdaş səhifəsində qalır.
    tags: [
      PUBLIC_CACHE_TAGS.partners,
      PUBLIC_CACHE_TAGS.properties,
      PUBLIC_CACHE_TAGS.projects,
    ],
    revalidate: FIVE_MINUTES,
  },
);

// ---------------------------------------------------------------------------
// BİLİK MƏRKƏZİ
// ---------------------------------------------------------------------------

/**
 * Bilik Mərkəzi məzmunu bloq və elandan qat-qat nadir dəyişir — köhnəlməyən
 * təlimat məzmunudur. Buna baxmayaraq revalidate müddəti sayt boyu vahid
 * saxlanılır: paneldən yazma `knowledge` teqini onsuz da dərhal təmizləyir,
 * ona görə uzun TTL yalnız gecikmiş nasazlıq halında fərq yaradardı.
 */
export const getCachedKnowledgeArticles = unstable_cache(
  async (filters: KnowledgeArticleFilters) => getKnowledgeArticles(filters),
  ["public-knowledge-list-v1"],
  { tags: [PUBLIC_CACHE_TAGS.knowledge], revalidate: FIVE_MINUTES },
);

export const getCachedKnowledgeArticleBySlug = unstable_cache(
  async (slug: string) => getKnowledgeArticleBySlug(slug),
  ["public-knowledge-detail-v1"],
  { tags: [PUBLIC_CACHE_TAGS.knowledge], revalidate: FIVE_MINUTES },
);

export const getCachedKnowledgeCategories = unstable_cache(
  getKnowledgeCategories,
  ["public-knowledge-categories-v1"],
  { tags: [PUBLIC_CACHE_TAGS.knowledge], revalidate: FIVE_MINUTES },
);

export const getCachedKnowledgeTerms = unstable_cache(
  async (filters: { search?: string; initial?: string }) => getKnowledgeTerms(filters),
  ["public-knowledge-terms-v1"],
  { tags: [PUBLIC_CACHE_TAGS.knowledge], revalidate: FIVE_MINUTES },
);

export const getCachedFaqEntries = unstable_cache(
  getPublishedFaqEntries,
  ["public-knowledge-faq-v1"],
  { tags: [PUBLIC_CACHE_TAGS.knowledge], revalidate: FIVE_MINUTES },
);

export const getCachedKnowledgeSitemapEntries = unstable_cache(
  getKnowledgeSitemapEntries,
  ["public-knowledge-sitemap-v1"],
  { tags: [PUBLIC_CACHE_TAGS.knowledge, PUBLIC_CACHE_TAGS.sitemap], revalidate: FIVE_MINUTES },
);
