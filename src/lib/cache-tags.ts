export const PUBLIC_CACHE_TAGS = {
  home: "public:home",
  properties: "public:properties",
  projects: "public:projects",
  posts: "public:posts",
  services: "public:services",
  agencies: "public:agencies",
  agents: "public:agents",
  partners: "public:partners",
  taxonomy: "public:taxonomy",
  knowledge: "public:knowledge",
  sitemap: "public:sitemap",
} as const;

export type PublicContentKind =
  | "property"
  | "project"
  | "post"
  | "service"
  | "agency"
  | "agent"
  | "partner"
  | "taxonomy"
  | "knowledge";

const CONFIG: Record<
  PublicContentKind,
  { tag: string; listPath: string; detailBase?: string; extraPaths?: string[] }
> = {
  property: { tag: PUBLIC_CACHE_TAGS.properties, listPath: "/emlaklar", detailBase: "/emlaklar" },
  project: { tag: PUBLIC_CACHE_TAGS.projects, listPath: "/layiheler", detailBase: "/layiheler" },
  post: { tag: PUBLIC_CACHE_TAGS.posts, listPath: "/blog", detailBase: "/blog" },
  service: { tag: PUBLIC_CACHE_TAGS.services, listPath: "/xidmetler", detailBase: "/xidmetler" },
  agency: { tag: PUBLIC_CACHE_TAGS.agencies, listPath: "/agentlikler", detailBase: "/agentlikler" },
  agent: { tag: PUBLIC_CACHE_TAGS.agents, listPath: "/agentler", detailBase: "/agentler" },
  partner: { tag: PUBLIC_CACHE_TAGS.partners, listPath: "/terefdaslar", detailBase: "/terefdaslar" },
  taxonomy: { tag: PUBLIC_CACHE_TAGS.taxonomy, listPath: "/emlaklar" },
  // Bilik Mərkəzi bələdçisi dəyişəndə lüğət və FAQ səhifələri də eyni teqdən asılıdır:
  // üçü bir modulun səthidir və ayrı-ayrı teq saxlamaq keşi lazımsız parçalayardı.
  knowledge: {
    tag: PUBLIC_CACHE_TAGS.knowledge,
    listPath: "/bilik-merkezi",
    detailBase: "/bilik-merkezi",
    // Lüğət və FAQ ayrı marşrutlardır, amma eyni teqdən qidalanır: bələdçi
    // dəyişəndə hər üç səth eyni anda yenilənməlidir.
    extraPaths: ["/lugat", "/suallar", "/kalkulyator"],
  },
};

export function contentInvalidation(kind: PublicContentKind, slug?: string) {
  const config = CONFIG[kind];
  const localized = (path: string) =>
    Object.values(LOCALES).map((locale) => localizePath(path, locale as Locale));
  return {
    tags: [PUBLIC_CACHE_TAGS.home, config.tag, PUBLIC_CACHE_TAGS.sitemap],
    paths: [
      ...localized("/"),
      ...localized(config.listPath),
      "/sitemap.xml",
      ...(config.extraPaths ?? []).flatMap((path) => localized(path)),
      ...(slug && config.detailBase ? localized(`${config.detailBase}/${slug}`) : []),
    ],
  };
}
import { LOCALES, type Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
