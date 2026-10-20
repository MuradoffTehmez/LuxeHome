/**
 * Admin panelin naviqasiya strukturu.
 * Ayrı fayldadır ki, həm sidebar, həm mobil çekmece eyni mənbədən oxusun.
 *
 * Etiketlər burada saxlanılmır: `labelKey` / `titleKey` `admin.nav` kataloqundakı
 * açarlardır, mətn render anında istifadəçinin dilinə görə seçilir. Açar tipləri
 * kataloqdan törəyir — tərcüməsi olmayan menyu sətri tip yoxlamasından keçmir.
 */

import type { AdminNavGroupKey, AdminNavItemKey, AdminNavSectionKey as AdminNavSectionKeyFromCatalog } from "@/i18n/admin";
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission, type Role } from "@/lib/constants";

export type AdminNavItem = {
  /** `admin.nav.items` altındakı açar. */
  labelKey: AdminNavItemKey;
  href: string;
  /** lucide-react ikon adı — `admin-icon.tsx` içindəki icazə siyahısından seçilir. */
  icon: string;
  /** Yan paneldə göstərilən sayğac açarı. */
  badgeKey?: AdminNavBadgeKey;
  /** Səhifənin guard-ı ilə eyni icazə; yoxdursa hər əməkdaş görür. Alt menyulu modulda uşaqlarda yazılır. */
  permission?: Permission;
  /** Böyük modulların sidebar daxilində açılan ikinci səviyyə keçidləri. */
  children?: AdminNavChild[];
};

export type AdminNavBadgeKey = "newLeads" | "draftProperties" | "pendingModeration" | "pendingApprovals" | "openReports" | "openAppeals" | "pendingTransfers" | "pendingVip" | "pendingPromotions" | "pendingPromotionHub";

export type AdminNavChild = {
  labelKey: AdminNavItemKey;
  href: string;
  /** Alt bənddə kiçik sayğac (#159) — məs. moderasiya növbəsi, açıq şikayətlər. */
  badgeKey?: AdminNavBadgeKey;
  /** Səhifənin guard-ı ilə eyni icazə (`admin-nav-permissions.test.ts` mənbə ilə tutuşdurur). */
  permission: Permission;
  /**
   * Uzun alt menyuda bölmə başlığı (`admin.nav.sections`). Ardıcıl eyni dəyərli bəndlər bir başlıq
   * altında göstərilir — məs. SERP-in gündəlik monitorinqi texniki konfiqurasiyadan ayrılır.
   */
  section?: AdminNavSectionKey;
};

export type AdminNavSectionKey = AdminNavSectionKeyFromCatalog;
export type AdminNavItemKeyOf = AdminNavItemKey;

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
          { labelKey: "properties", href: "/admin/emlaklar", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "moderation", href: "/admin/moderation", badgeKey: "pendingModeration", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "transfers", href: "/admin/kocurmeler", badgeKey: "pendingTransfers", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "projects", href: "/admin/layiheler", permission: PERMISSIONS.PROJECT_MANAGE },
          { labelKey: "taxonomy", href: "/admin/taksonomiya", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "publicAmenities", href: "/admin/ictimai-imkanlar", permission: PERMISSIONS.PROPERTY_MANAGE },
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
          { labelKey: "promotionOverview", href: "/admin/tesviq", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "vip", href: "/admin/vip", badgeKey: "pendingVip", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "promotion", href: "/admin/irelicekme", badgeKey: "pendingPromotions", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "packages", href: "/admin/paketler", permission: PERMISSIONS.BILLING_MANAGE },
        ],
      },
      {
        // İstifadəçilər və agentliklər: ictimai hesablar CRM-də, əməkdaşlar «Sistem»də idi.
        labelKey: "agencyHub",
        href: "/admin/agentlikler/tesdiq",
        icon: "UserRoundCheck",
        badgeKey: "pendingApprovals",
        children: [
          { labelKey: "approvals", href: "/admin/agentlikler/tesdiq", badgeKey: "pendingApprovals", permission: PERMISSIONS.USER_MANAGE },
          { labelKey: "agencies", href: "/admin/agentlikler", permission: PERMISSIONS.USER_MANAGE },
          { labelKey: "agents", href: "/admin/agentler", permission: PERMISSIONS.USER_MANAGE },
          { labelKey: "accounts", href: "/admin/hesablar", permission: PERMISSIONS.USER_MANAGE },
          { labelKey: "users", href: "/admin/istifadeciler", permission: PERMISSIONS.USER_MANAGE },
        ],
      },
      {
        labelKey: "crm",
        href: "/admin/muracietler",
        icon: "Inbox",
        badgeKey: "newLeads",
        children: [
          { labelKey: "leads", href: "/admin/muracietler", badgeKey: "newLeads", permission: PERMISSIONS.LEAD_MANAGE },
          { labelKey: "leadBoard", href: "/admin/muracietler/lovhe", permission: PERMISSIONS.LEAD_MANAGE },
          { labelKey: "funnel", href: "/admin/huni", permission: PERMISSIONS.LEAD_MANAGE },
          { labelKey: "reservations", href: "/admin/rezervasiyalar", permission: PERMISSIONS.LEAD_MANAGE },
          { labelKey: "calendar", href: "/admin/rezervasiyalar/teqvim", permission: PERMISSIONS.LEAD_MANAGE },
          { labelKey: "email", href: "/admin/e-poct", permission: PERMISSIONS.LEAD_MANAGE },
          // Telegram `/support` müraciətləri — operator cavabı Telegram-a gedir.
          { labelKey: "support", href: "/admin/destek", permission: PERMISSIONS.LEAD_MANAGE },
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
          { labelKey: "reports", href: "/admin/sikayetler", badgeKey: "openReports", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "appeals", href: "/admin/etirazlar", badgeKey: "openAppeals", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "trust", href: "/admin/etibarliliq", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "verification", href: "/admin/senedler", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "moderationHistory", href: "/admin/moderasiya-tarixcesi", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "securityCenter", href: "/admin/tehlukesizlik", permission: PERMISSIONS.USER_MANAGE },
          { labelKey: "audit", href: "/admin/audit", permission: PERMISSIONS.SETTINGS_MANAGE },
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
          { labelKey: "blog", href: "/admin/blog", permission: PERMISSIONS.BLOG_MANAGE },
          { labelKey: "knowledge", href: "/admin/bilik-merkezi", permission: PERMISSIONS.KNOWLEDGE_MANAGE },
          { labelKey: "services", href: "/admin/xidmetler", permission: PERMISSIONS.SERVICE_MANAGE },
          { labelKey: "partners", href: "/admin/terefdaslar", permission: PERMISSIONS.PARTNER_VIEW },
          { labelKey: "media", href: "/admin/media", permission: PERMISSIONS.MEDIA_MANAGE },
          { labelKey: "translations", href: "/admin/tercumeler", permission: PERMISSIONS.TRANSLATION_MANAGE },
          // Əlaqə panelinin beh xəbərdarlığı (#199) — təhlükəsizlik məzmunu, Redaktor idarə edir.
          { labelKey: "safetyTexts", href: "/admin/xeberdarliqlar", permission: PERMISSIONS.KNOWLEDGE_MANAGE },
          { labelKey: "aiAssistant", href: "/admin/ai-komekci", permission: PERMISSIONS.PROPERTY_MANAGE },
        ],
      },
      {
        labelKey: "serp",
        href: "/admin/serp",
        icon: "SearchCheck",
        children: [
          { labelKey: "seoOverview", href: "/admin/serp", section: "seoDaily", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoMonitoring", href: "/admin/serp/monitorinq", section: "seoDaily", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoAudit", href: "/admin/serp/audit", section: "seoDaily", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoLiveAudit", href: "/admin/seo", section: "seoDaily", permission: PERMISSIONS.PROPERTY_MANAGE },
          { labelKey: "seoSearchConsole", href: "/admin/serp/search-console", section: "seoDaily", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoIndexing", href: "/admin/serp/indexing", section: "seoDaily", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoLinks", href: "/admin/serp/links", section: "seoDaily", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoNotFound", href: "/admin/redirects#not-found", section: "seoDaily", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoKeywords", href: "/admin/serp/acar-sozler", section: "seoContentGroup", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoContent", href: "/admin/serp/content", section: "seoContentGroup", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoMedia", href: "/admin/serp/media", section: "seoContentGroup", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoLandings", href: "/admin/serp/landingler", section: "seoContentGroup", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoSettings", href: "/admin/serp/parametrler", section: "seoTechnical", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoMetadata", href: "/admin/serp/metadata", section: "seoTechnical", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoStructuredData", href: "/admin/serp/schema", section: "seoTechnical", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoEntities", href: "/admin/serp/entities", section: "seoTechnical", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoSitemap", href: "/admin/serp/sitemap", section: "seoTechnical", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "seoRobots", href: "/admin/serp/robots", section: "seoTechnical", permission: PERMISSIONS.SEO_VIEW },
          { labelKey: "redirects", href: "/admin/redirects", section: "seoTechnical", permission: PERMISSIONS.SEO_VIEW },
        ],
      },
      {
        // Analitika (#262, PRD Modul 20): trafik və hesabatlar/biznes analitikası.
        labelKey: "analytics",
        href: "/admin/analitika",
        icon: "BarChart3",
        children: [
          { labelKey: "traffic", href: "/admin/analitika", permission: PERMISSIONS.SETTINGS_MANAGE },
          { labelKey: "businessReports", href: "/admin/hesabatlar", permission: PERMISSIONS.BILLING_MANAGE },
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
          { labelKey: "subscriptionPlans", href: "/admin/maliyye", permission: PERMISSIONS.BILLING_MANAGE },
          { labelKey: "subscriptions", href: "/admin/maliyye/abuneler", permission: PERMISSIONS.BILLING_MANAGE },
          { labelKey: "discounts", href: "/admin/maliyye/endirimler", permission: PERMISSIONS.BILLING_MANAGE },
          { labelKey: "campaigns", href: "/admin/maliyye/kampaniyalar", permission: PERMISSIONS.BILLING_MANAGE },
          { labelKey: "payments", href: "/admin/maliyye/odenisler", permission: PERMISSIONS.BILLING_MANAGE },
        ],
      },
      {
        // Parametrlər mərkəzi: yalnız konfiqurasiya; gündəlik iş yuxarıdakı modullardadır.
        labelKey: "administration",
        href: "/admin/parametrler",
        icon: "Settings",
        children: [
          { labelKey: "settings", href: "/admin/parametrler", permission: PERMISSIONS.SETTINGS_MANAGE },
          { labelKey: "featureFlags", href: "/admin/funksiyalar", permission: PERMISSIONS.SETTINGS_MANAGE },
          { labelKey: "systemMode", href: "/admin/sistem", permission: PERMISSIONS.SETTINGS_MANAGE },
          { labelKey: "telegram", href: "/admin/telegram", permission: PERMISSIONS.SETTINGS_MANAGE },
          { labelKey: "botProtection", href: "/admin/security", permission: PERMISSIONS.USER_MANAGE },
          { labelKey: "demoContent", href: "/admin/demo-mezmun", permission: PERMISSIONS.SETTINGS_MANAGE },
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
export function findAdminNavLocation(pathname: string, nav: readonly AdminNavGroup[] = adminNav): AdminNavLocation | null {
  let best: (AdminNavLocation & { length: number }) | null = null;
  for (const group of nav) {
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
export function adminNavBreadcrumbs(pathname: string, role?: Role): AdminNavCrumb[] {
  if (pathname === "/admin") return [];
  // Rol verilibsə zəncir süzülmüş menyudan qurulur: modul linki icazəsiz səhifəyə (403) aparmasın.
  const location = findAdminNavLocation(pathname, role ? adminNavForRole(role) : adminNav);
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

/**
 * Rola görə menyu: icazəsi olmayan alt bənd göstərilmir, uşaqsız qalan modul atılır, modulun öz linki
 * ilk görünən alt bəndə yönəlir (məs. Redaktor «Məzmun idarəetməsi»ndə Bloqdan başlayır). Səhifə guard-ları
 * dəyişmir — bu yalnız əlçatmaz bəndləri gizlədir ki, menyu 403-ə aparmasın.
 */
export function adminNavForRole(role: Role): AdminNavGroup[] {
  const granted = new Set<Permission>(ROLE_PERMISSIONS[role] ?? []);
  const allowed = (permission?: Permission) => !permission || granted.has(permission);
  return adminNav
    .map((group) => ({
      ...group,
      items: group.items.flatMap((item): AdminNavItem[] => {
        if (!item.children?.length) return allowed(item.permission) ? [item] : [];
        const children = item.children.filter((child) => allowed(child.permission));
        if (children.length === 0) return [];
        const keepsHref = children.some((child) => child.href === item.href);
        return [{ ...item, href: keepsHref ? item.href : children[0].href.split("#", 1)[0], children }];
      }),
    }))
    .filter((group) => group.items.length > 0);
}
