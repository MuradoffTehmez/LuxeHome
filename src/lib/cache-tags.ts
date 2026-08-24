export const PUBLIC_CACHE_TAGS = {
  home: "public:home",
  properties: "public:properties",
  projects: "public:projects",
  posts: "public:posts",
  services: "public:services",
  agencies: "public:agencies",
  taxonomy: "public:taxonomy",
  sitemap: "public:sitemap",
} as const;

export type PublicContentKind = "property" | "project" | "post" | "service" | "agency" | "taxonomy";

const CONFIG: Record<PublicContentKind, { tag: string; listPath: string; detailBase?: string }> = {
  property: { tag: PUBLIC_CACHE_TAGS.properties, listPath: "/emlaklar", detailBase: "/emlaklar" },
  project: { tag: PUBLIC_CACHE_TAGS.projects, listPath: "/layiheler", detailBase: "/layiheler" },
  post: { tag: PUBLIC_CACHE_TAGS.posts, listPath: "/blog", detailBase: "/blog" },
  service: { tag: PUBLIC_CACHE_TAGS.services, listPath: "/xidmetler", detailBase: "/xidmetler" },
  agency: { tag: PUBLIC_CACHE_TAGS.agencies, listPath: "/agentlikler", detailBase: "/agentlikler" },
  taxonomy: { tag: PUBLIC_CACHE_TAGS.taxonomy, listPath: "/emlaklar" },
};

export function contentInvalidation(kind: PublicContentKind, slug?: string) {
  const config = CONFIG[kind];
  return {
    tags: [PUBLIC_CACHE_TAGS.home, config.tag, PUBLIC_CACHE_TAGS.sitemap],
    paths: [
      "/",
      config.listPath,
      "/sitemap.xml",
      ...(slug && config.detailBase ? [`${config.detailBase}/${slug}`] : []),
    ],
  };
}
