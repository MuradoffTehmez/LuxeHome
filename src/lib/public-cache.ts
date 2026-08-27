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
  getServiceBySlug,
  getServices,
  getSitemapEntries,
  type PropertyFilters,
} from "@/lib/queries";

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
    const [featured, propertyTypes, services, projects, posts, filterOptions, categories] =
      await Promise.all([
        getFeaturedProperties(6),
        getPropertyTypesWithCounts(),
        getServices(),
        getProjects(),
        getPosts({ pageSize: 3 }),
        getFilterOptions(),
        getBlogCategories(),
      ]);
    return { featured, propertyTypes, services, projects, posts, filterOptions, categories };
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
