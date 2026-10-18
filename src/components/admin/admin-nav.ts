/**
 * Admin panelin naviqasiya strukturu.
 * Ayrı fayldadır ki, həm sidebar, həm mobil çekmece eyni mənbədən oxusun.
 *
 * Etiketlər burada saxlanılmır: `labelKey` / `titleKey` `admin.nav` kataloqundakı
 * açarlardır, mətn render anında istifadəçinin dilinə görə seçilir. Açar tipləri
 * kataloqdan törəyir — tərcüməsi olmayan menyu sətri tip yoxlamasından keçmir.
 */

import type { AdminNavGroupKey, AdminNavItemKey, AdminNavSectionKey as AdminNavSectionKeyFromCatalog } from "@/i18n/admin";

export type AdminNavItem = {
  /** `admin.nav.items` altındakı açar. */
  labelKey: AdminNavItemKey;
  href: string;
  /** lucide-react ikon adı — `admin-icon.tsx` içindəki icazə siyahısından seçilir. */
  icon: string;
  /** Yan paneldə göstərilən sayğac açarı. */
  badgeKey?: AdminNavBadgeKey;
  /** Böyük modulların sidebar daxilində açılan ikinci səviyyə keçidləri. */
  children?: AdminNavChild[];
};

export type AdminNavBadgeKey = "newLeads" | "draftProperties" | "pendingModeration" | "pendingApprovals" | "openReports" | "openAppeals" | "pendingTransfers" | "pendingVip" | "pendingPromotions" | "pendingPromotionHub";

export type AdminNavChild = {
  labelKey: AdminNavItemKey;
  href: string;
  /** Alt bənddə kiçik sayğac (#159) — məs. moderasiya növbəsi, açıq şikayətlər. */
  badgeKey?: AdminNavBadgeKey;
  /**
   * Uzun alt menyuda bölmə başlığı (`admin.nav.sections`). Ardıcıl eyni dəyərli bəndlər bir başlıq
   * altında göstərilir — məs. SERP-in gündəlik monitorinqi texniki konfiqurasiyadan ayrılır.
   */
  section?: AdminNavSectionKey;
};

export type AdminNavSectionKey = AdminNavSectionKeyFromCatalog;

export type AdminNavGroup = {
  /** `admin.nav.groups` altındakı açar. */
  titleKey: AdminNavGroupKey;
  items: AdminNavItem[];
};

/**
 * Struktur (UX auditi, 2026-10): 11 əsas modul dörd qrupda. Hər səhifənin bir əsas giriş nöqtəsi var —
 * eyni marşrut iki modulda təkrarlanmır (`admin-nav.test.ts` yoxlayır). Gündəlik əməliyyatlar
 * («Əməliyyatlar») parametrlərdən («Sistem») ayrıdır.
 */
export const adminNav: AdminNavGroup[] = [
  {
    titleKey: "general",
    items: [{ labelKey: "dashboard", href: "/admin", icon: "LayoutDashboard" }],
  },
  {
    titleKey: "operations",
    items: [
      {
        labelKey: "portfolio",
        href: "/admin/emlaklar",
        icon: "Building2",
        badgeKey: "draftProperties",
        children: [
          { labelKey: "properties", href: "/admin/emlaklar" },
          { labelKey: "moderation", href: "/admin/moderation", badgeKey: "pendingModeration" },
          { labelKey: "transfers", href: "/admin/kocurmeler", badgeKey: "pendingTransfers" },
          { labelKey: "projects", href: "/admin/layiheler" },
          { labelKey: "taxonomy", href: "/admin/taksonomiya" },
          { labelKey: "publicAmenities", href: "/admin/ictimai-imkanlar" },
        ],
      },
      {
        // Elanların təşviqi: VIP, irəli çəkmə və premium paketlər əvvəl portfelin 9 bəndi arasında idi.
        // Backend qaydaları ayrı qalır — yalnız giriş nöqtəsi və ümumi baxış ortaqdır.
        labelKey: "promotionHub",
        href: "/admin/tesviq",
        icon: "Megaphone",
        badgeKey: "pendingPromotionHub",
        children: [
          { labelKey: "promotionOverview", href: "/admin/tesviq" },
          { labelKey: "vip", href: "/admin/vip", badgeKey: "pendingVip" },
          { labelKey: "promotion", href: "/admin/irelicekme", badgeKey: "pendingPromotions" },
          { labelKey: "packages", href: "/admin/paketler" },
        ],
      },
      {
        // İstifadəçilər və agentliklər: ictimai hesablar CRM-də, əməkdaşlar «Sistem»də idi.
        labelKey: "agencyHub",
        href: "/admin/agentlikler/tesdiq",
        icon: "UserRoundCheck",
        badgeKey: "pendingApprovals",
        children: [
          { labelKey: "approvals", href: "/admin/agentlikler/tesdiq", badgeKey: "pendingApprovals" },
          { labelKey: "agencies", href: "/admin/agentlikler" },
          { labelKey: "agents", href: "/admin/agentler" },
          { labelKey: "accounts", href: "/admin/hesablar" },
          { labelKey: "users", href: "/admin/istifadeciler" },
        ],
      },
      {
        labelKey: "crm",
        href: "/admin/muracietler",
        icon: "Inbox",
        badgeKey: "newLeads",
        children: [
          { labelKey: "leads", href: "/admin/muracietler", badgeKey: "newLeads" },
          { labelKey: "leadBoard", href: "/admin/muracietler/lovhe" },
          { labelKey: "funnel", href: "/admin/huni" },
          { labelKey: "reservations", href: "/admin/rezervasiyalar" },
          { labelKey: "calendar", href: "/admin/rezervasiyalar/teqvim" },
          { labelKey: "email", href: "/admin/e-poct" },
        ],
      },
      {
        // Təhlükəsizlik və moderasiya (#260, PRD Modul 19): şikayətlər, riskli hesablar, sənəd yoxlaması,
        // etirazlar, moderasiya tarixçəsi, təhlükəsizlik hadisələri və audit jurnalı.
        labelKey: "trustHub",
        href: "/admin/sikayetler",
        icon: "ShieldAlert",
        badgeKey: "openReports",
        children: [
          { labelKey: "reports", href: "/admin/sikayetler", badgeKey: "openReports" },
          { labelKey: "appeals", href: "/admin/etirazlar", badgeKey: "openAppeals" },
          { labelKey: "trust", href: "/admin/etibarliliq" },
          { labelKey: "verification", href: "/admin/senedler" },
          { labelKey: "moderationHistory", href: "/admin/moderasiya-tarixcesi" },
          { labelKey: "securityCenter", href: "/admin/tehlukesizlik" },
          { labelKey: "audit", href: "/admin/audit" },
        ],
      },
    ],
  },
  {
    titleKey: "growth",
    items: [
      {
        labelKey: "contentHub",
        href: "/admin/blog",
        icon: "Newspaper",
        children: [
          { labelKey: "blog", href: "/admin/blog" },
          { labelKey: "knowledge", href: "/admin/bilik-merkezi" },
          { labelKey: "services", href: "/admin/xidmetler" },
          { labelKey: "partners", href: "/admin/terefdaslar" },
          { labelKey: "media", href: "/admin/media" },
          { labelKey: "translations", href: "/admin/tercumeler" },
          // Əlaqə panelinin beh xəbərdarlığı (#199) — təhlükəsizlik məzmunu, Redaktor idarə edir.
          { labelKey: "safetyTexts", href: "/admin/xeberdarliqlar" },
          { labelKey: "aiAssistant", href: "/admin/ai-komekci" },
        ],
      },
      {
        labelKey: "serp",
        href: "/admin/serp",
        icon: "SearchCheck",
        children: [
          { labelKey: "seoOverview", href: "/admin/serp", section: "seoDaily" },
          { labelKey: "seoMonitoring", href: "/admin/serp/monitorinq", section: "seoDaily" },
          { labelKey: "seoAudit", href: "/admin/serp/audit", section: "seoDaily" },
          { labelKey: "seoLiveAudit", href: "/admin/seo", section: "seoDaily" },
          { labelKey: "seoSearchConsole", href: "/admin/serp/search-console", section: "seoDaily" },
          { labelKey: "seoIndexing", href: "/admin/serp/indexing", section: "seoDaily" },
          { labelKey: "seoLinks", href: "/admin/serp/links", section: "seoDaily" },
          { labelKey: "seoNotFound", href: "/admin/redirects#not-found", section: "seoDaily" },
          { labelKey: "seoKeywords", href: "/admin/serp/acar-sozler", section: "seoContentGroup" },
          { labelKey: "seoContent", href: "/admin/serp/content", section: "seoContentGroup" },
          { labelKey: "seoMedia", href: "/admin/serp/media", section: "seoContentGroup" },
          { labelKey: "seoLandings", href: "/admin/serp/landingler", section: "seoContentGroup" },
          { labelKey: "seoSettings", href: "/admin/serp/parametrler", section: "seoTechnical" },
          { labelKey: "seoMetadata", href: "/admin/serp/metadata", section: "seoTechnical" },
          { labelKey: "seoStructuredData", href: "/admin/serp/schema", section: "seoTechnical" },
          { labelKey: "seoEntities", href: "/admin/serp/entities", section: "seoTechnical" },
          { labelKey: "seoSitemap", href: "/admin/serp/sitemap", section: "seoTechnical" },
          { labelKey: "seoRobots", href: "/admin/serp/robots", section: "seoTechnical" },
          { labelKey: "redirects", href: "/admin/redirects", section: "seoTechnical" },
        ],
      },
      {
        // Analitika (#262, PRD Modul 20): trafik və hesabatlar/biznes analitikası.
        labelKey: "analytics",
        href: "/admin/analitika",
        icon: "BarChart3",
        children: [
          { labelKey: "traffic", href: "/admin/analitika" },
          { labelKey: "businessReports", href: "/admin/hesabatlar" },
        ],
      },
    ],
  },
  {
    titleKey: "system",
    items: [
      {
        labelKey: "finance",
        href: "/admin/maliyye",
        icon: "Wallet",
        children: [
          { labelKey: "subscriptionPlans", href: "/admin/maliyye" },
          { labelKey: "subscriptions", href: "/admin/maliyye/abuneler" },
          { labelKey: "discounts", href: "/admin/maliyye/endirimler" },
          { labelKey: "campaigns", href: "/admin/maliyye/kampaniyalar" },
          { labelKey: "payments", href: "/admin/maliyye/odenisler" },
        ],
      },
      {
        // Parametrlər mərkəzi: yalnız konfiqurasiya; gündəlik iş yuxarıdakı modullardadır.
        labelKey: "administration",
        href: "/admin/parametrler",
        icon: "Settings",
        children: [
          { labelKey: "settings", href: "/admin/parametrler" },
          { labelKey: "featureFlags", href: "/admin/funksiyalar" },
          { labelKey: "systemMode", href: "/admin/sistem" },
          { labelKey: "botProtection", href: "/admin/security" },
          { labelKey: "demoContent", href: "/admin/demo-mezmun" },
        ],
      },
      { labelKey: "profile", href: "/admin/hesabim", icon: "UserCog" },
    ],
  },
];

/** Marşrutun aktivlik yoxlaması — sidebar, breadcrumb və testlər eyni qaydanı işlədir. */
export function adminRouteIsActive(href: string, pathname: string): boolean {
  const path = href.split("#", 1)[0];
  if (path === "/admin") return pathname === "/admin";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export type AdminNavLocation = {
  group: AdminNavGroup;
  item: AdminNavItem;
  child: AdminNavChild | null;
};

/**
 * Cari ünvanın naviqasiyadakı yeri: ən uzun prefiksli bənd qalib gəlir
 * (`/admin/rezervasiyalar/teqvim` «Təqvim»dir, «Rezervasiyalar» deyil). Breadcrumb buradan qurulur.
 */
export function findAdminNavLocation(pathname: string): AdminNavLocation | null {
  let best: (AdminNavLocation & { length: number }) | null = null;
  for (const group of adminNav) {
    for (const item of group.items) {
      const candidates: { child: AdminNavChild | null; href: string }[] = item.children?.length
        ? item.children.map((child) => ({ child, href: child.href }))
        : [{ child: null, href: item.href }];
      for (const candidate of candidates) {
        if (candidate.href.includes("#") || !adminRouteIsActive(candidate.href, pathname)) continue;
        const length = candidate.href.length;
        if (!best || length > best.length) best = { group, item, child: candidate.child, length };
      }
    }
  }
  return best ? { group: best.group, item: best.item, child: best.child } : null;
}

export type AdminNavCrumb =
  | { kind: "group"; key: AdminNavGroupKey; href?: undefined }
  | { kind: "item"; key: AdminNavItemKey; href?: string };

/**
 * Menyudan breadcrumb zənciri: «Qrup › Modul › Səhifə». Cari səhifənin özü link deyil; menyudakı bəndin
 * alt səhifəsində (məs. redaktə) son bənd onun siyahısına aparır. İdarə panelinin özündə boşdur.
 */
export function adminNavBreadcrumbs(pathname: string): AdminNavCrumb[] {
  if (pathname === "/admin") return [];
  const location = findAdminNavLocation(pathname);
  if (!location) return [];
  const { group, item, child } = location;
  const crumbs: AdminNavCrumb[] = [{ kind: "group", key: group.titleKey }];
  if (child && child.href !== item.href) {
    crumbs.push({ kind: "item", key: item.labelKey, href: item.href });
    crumbs.push({ kind: "item", key: child.labelKey, href: pathname === child.href ? undefined : child.href });
  } else {
    crumbs.push({ kind: "item", key: item.labelKey, href: pathname === item.href ? undefined : item.href });
  }
  return crumbs;
}
