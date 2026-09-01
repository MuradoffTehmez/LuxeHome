/**
 * Admin panelin naviqasiya strukturu.
 * Ayrı fayldadır ki, həm sidebar, həm mobil çekmece eyni mənbədən oxusun.
 *
 * Etiketlər burada saxlanılmır: `labelKey` / `titleKey` `admin.nav` kataloqundakı
 * açarlardır, mətn render anında istifadəçinin dilinə görə seçilir. Açar tipləri
 * kataloqdan törəyir — tərcüməsi olmayan menyu sətri tip yoxlamasından keçmir.
 */

import type { AdminNavGroupKey, AdminNavItemKey } from "@/i18n/admin";

export type AdminNavItem = {
  /** `admin.nav.items` altındakı açar. */
  labelKey: AdminNavItemKey;
  href: string;
  /** lucide-react ikon adı — `admin-icon.tsx` içindəki icazə siyahısından seçilir. */
  icon: string;
  /** Yan paneldə göstərilən sayğac açarı. */
  badgeKey?: "newLeads" | "draftProperties" | "pendingModeration";
  /** Böyük modulların sidebar daxilində açılan ikinci səviyyə keçidləri. */
  children?: AdminNavChild[];
};

export type AdminNavChild = {
  labelKey: AdminNavItemKey;
  href: string;
};

export type AdminNavGroup = {
  /** `admin.nav.groups` altındakı açar. */
  titleKey: AdminNavGroupKey;
  items: AdminNavItem[];
};

export const adminNav: AdminNavGroup[] = [
  {
    titleKey: "general",
    items: [{ labelKey: "dashboard", href: "/admin", icon: "LayoutDashboard" }],
  },
  {
    titleKey: "content",
    items: [
      {
        labelKey: "portfolio",
        href: "/admin/emlaklar",
        icon: "Building2",
        badgeKey: "draftProperties",
        children: [
          { labelKey: "properties", href: "/admin/emlaklar" },
          { labelKey: "moderation", href: "/admin/moderation" },
          { labelKey: "projects", href: "/admin/layiheler" },
          { labelKey: "taxonomy", href: "/admin/taksonomiya" },
          { labelKey: "publicAmenities", href: "/admin/ictimai-imkanlar" },
        ],
      },
      {
        labelKey: "contentHub",
        href: "/admin/blog",
        icon: "Newspaper",
        children: [
          { labelKey: "blog", href: "/admin/blog" },
          { labelKey: "knowledge", href: "/admin/bilik-merkezi" },
          { labelKey: "translations", href: "/admin/tercumeler" },
          { labelKey: "services", href: "/admin/xidmetler" },
          { labelKey: "media", href: "/admin/media" },
          { labelKey: "partners", href: "/admin/terefdaslar" },
        ],
      },
      {
        labelKey: "crm",
        href: "/admin/muracietler",
        icon: "Inbox",
        badgeKey: "newLeads",
        children: [
          { labelKey: "leads", href: "/admin/muracietler" },
          { labelKey: "reservations", href: "/admin/rezervasiyalar" },
          { labelKey: "email", href: "/admin/e-poct" },
          { labelKey: "agencies", href: "/admin/agentlikler" },
          { labelKey: "agents", href: "/admin/agentler" },
          { labelKey: "accounts", href: "/admin/hesablar" },
        ],
      },
    ],
  },
  {
    titleKey: "growth",
    items: [
      {
        labelKey: "serp",
        href: "/admin/serp",
        icon: "SearchCheck",
        children: [
          { labelKey: "seoOverview", href: "/admin/serp" },
          { labelKey: "seoSettings", href: "/admin/serp/parametrler" },
          { labelKey: "seoMetadata", href: "/admin/serp/metadata" },
          { labelKey: "seoLandings", href: "/admin/serp/landingler" },
          { labelKey: "redirects", href: "/admin/redirects" },
          { labelKey: "seoStructuredData", href: "/admin/serp/schema" },
          { labelKey: "seoSitemap", href: "/admin/serp/sitemap" },
          { labelKey: "seoRobots", href: "/admin/serp/robots" },
          { labelKey: "seoEntities", href: "/admin/serp/entities" },
          { labelKey: "seoContent", href: "/admin/serp/content" },
          { labelKey: "seoMedia", href: "/admin/serp/media" },
          { labelKey: "seoKeywords", href: "/admin/serp/acar-sozler" },
          { labelKey: "seoMonitoring", href: "/admin/serp/monitorinq" },
          { labelKey: "seoAudit", href: "/admin/serp/audit" },
          { labelKey: "seoSearchConsole", href: "/admin/serp/search-console" },
          { labelKey: "seoIndexing", href: "/admin/serp/indexing" },
          { labelKey: "seoLinks", href: "/admin/serp/links" },
          { labelKey: "seoNotFound", href: "/admin/redirects#not-found" },
        ],
      },
      { labelKey: "analytics", href: "/admin/analitika", icon: "BarChart3" },
      { labelKey: "aiAssistant", href: "/admin/ai-komekci", icon: "BrainCircuit" },
    ],
  },
  {
    titleKey: "system",
    items: [
      {
        labelKey: "administration",
        href: "/admin/istifadeciler",
        icon: "Settings",
        children: [
          { labelKey: "users", href: "/admin/istifadeciler" },
          { labelKey: "security", href: "/admin/security" },
          { labelKey: "audit", href: "/admin/audit" },
          { labelKey: "settings", href: "/admin/parametrler" },
        ],
      },
      { labelKey: "profile", href: "/admin/hesabim", icon: "UserCog" },
    ],
  },
];
