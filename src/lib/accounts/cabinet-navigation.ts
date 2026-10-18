export type CabinetNavItem = {
  id:
    | "overview"
    | "agency-dashboard"
    | "agency-analytics"
    | "assignments"
    | "listings"
    | "new-listing"
    | "leads"
    | "clients"
    | "analytics"
    | "packages"
    | "team"
    | "activity"
    | "tasks"
    | "transfers"
    | "reviews"
    | "saved-searches"
    | "notifications"
    | "reports"
    | "restrictions"
    | "reservations"
    | "recommendations"
    | "recently-viewed"
    | "profile";
  href: string;
  label: string;
};

const BASE_ITEMS: readonly CabinetNavItem[] = [
  { id: "overview", href: "/kabinet", label: "Ümumi baxış" },
  { id: "profile", href: "/kabinet/profil", label: "Profil" },
];

const LISTING_ITEMS: readonly CabinetNavItem[] = [
  { id: "listings", href: "/kabinet/elanlar", label: "Elanlarım" },
  { id: "new-listing", href: "/kabinet/elanlar/yeni", label: "Yeni elan" },
  { id: "leads", href: "/kabinet/muracietler", label: "Müraciətlər" },
  /** Mini CRM (#226) — elan yerləşdirən hər hesab. */
  { id: "clients", href: "/kabinet/musteriler", label: "Müştərilər" },
  { id: "analytics", href: "/kabinet/analitika", label: "Analitika" },
  { id: "packages", href: "/kabinet/paketler", label: "Premium paketlər" },
];

const TEAM_ITEM: CabinetNavItem = { id: "team", href: "/kabinet/komanda", label: "Komanda" };
/** Agentlik idarəetmə paneli (#216) — yalnız sahib, «Ümumi baxış»dan dərhal sonra. */
const AGENCY_DASHBOARD_ITEM: CabinetNavItem = { id: "agency-dashboard", href: "/kabinet/agentlik", label: "Agentlik paneli" };
/** Agentlik analitikası (#234) — sahib (səhifə `LEADS_MANAGE` menecerə də açıqdır). */
const AGENCY_ANALYTICS_ITEM: CabinetNavItem = { id: "agency-analytics", href: "/kabinet/agentlik/analitika", label: "Agentlik analitikası" };
/** Elan təyinatları (#218) — sahib və `LISTINGS_ASSIGN` səlahiyyətli agent. */
const ASSIGNMENTS_ITEM: CabinetNavItem = { id: "assignments", href: "/kabinet/agentlik/elanlar", label: "Elan təyinatları" };
/** Agentlik daxili fəaliyyət jurnalı (#214) — yalnız sahib. */
const ACTIVITY_ITEM: CabinetNavItem = { id: "activity", href: "/kabinet/fealiyyet", label: "Fəaliyyət jurnalı" };
/** Agentlik daxili tapşırıqları (#220) — agentlik sahibi və agent. */
const TASKS_ITEM: CabinetNavItem = { id: "tasks", href: "/kabinet/tapsiriqlar", label: "Tapşırıqlar" };
/** Agentliklər arası köçürmə (#212) — agentlik sahibi və agent. */
const TRANSFERS_ITEM: CabinetNavItem = { id: "transfers", href: "/kabinet/kocurmeler", label: "Köçürmələr" };
/** Rəylər və cavablar (#230) — agentlik sahibi və agent. */
const REVIEWS_ITEM: CabinetNavItem = { id: "reviews", href: "/kabinet/reyler", label: "Rəylər" };

/** Hər hesab növünə görünən yeni bölmələr — elan yerləşdirmə icazəsindən asılı deyil. */
const DISCOVERY_ITEMS: readonly CabinetNavItem[] = [
  { id: "saved-searches", href: "/kabinet/axtarislarim", label: "Saxlanmış axtarışlarım" },
  { id: "notifications", href: "/kabinet/bildirisler", label: "Bildirişlər" },
  { id: "reports", href: "/kabinet/sikayetlerim", label: "Şikayətlərim" },
  { id: "restrictions", href: "/kabinet/mehdudiyyetler", label: "Məhdudiyyətlər" },
  { id: "reservations", href: "/kabinet/rezervasiyalar", label: "Rezervasiyalarım" },
  { id: "recommendations", href: "/kabinet/tovsiyeler", label: "Sizin üçün" },
  { id: "recently-viewed", href: "/kabinet/son-baxilanlar", label: "Son baxılanlar" },
];

export function getCabinetItems(
  canList: boolean,
  canManageTeam = false,
  canTransfer = false,
  canAssignListings = false,
  /** `LEADS_MANAGE` səlahiyyətli agent (#234) — agentlik analitikasını görür. */
  canViewAnalytics = false,
  /** Funksiya bayrağı ilə söndürülmüş modulların bəndləri (#242). */
  hiddenItems: readonly CabinetNavItem["id"][] = [],
): readonly CabinetNavItem[] {
  const items = canList ? [BASE_ITEMS[0], ...LISTING_ITEMS] : [BASE_ITEMS[0]];
  if (canManageTeam) {
    items.splice(1, 0, AGENCY_DASHBOARD_ITEM, AGENCY_ANALYTICS_ITEM);
  } else if (canViewAnalytics) {
    items.splice(1, 0, AGENCY_ANALYTICS_ITEM);
  }
  if (canManageTeam) {
    items.push(TEAM_ITEM, ACTIVITY_ITEM);
  }
  if (canManageTeam || canAssignListings) items.push(ASSIGNMENTS_ITEM);
  if (canTransfer) items.push(TASKS_ITEM, TRANSFERS_ITEM, REVIEWS_ITEM);
  items.push(...DISCOVERY_ITEMS, BASE_ITEMS[1]);
  return hiddenItems.length ? items.filter((item) => !hiddenItems.includes(item.id)) : items;
}

/**
 * Menyu bölmələri (UX auditi): 20-dən çox bənd bir siyahıda idi və agentlik sahibində əsas bəndlər
 * ekranın altına düşürdü. Bənd dəsti və icazə qaydası dəyişmir — `getCabinetItems()` nəticəsi yalnız
 * məntiqi qruplara bölünür, boş bölmə göstərilmir.
 */
export const CABINET_SECTIONS = ["overview", "listings", "work", "personal", "account"] as const;
export type CabinetSection = (typeof CABINET_SECTIONS)[number];

export const CABINET_ITEM_SECTION: Record<CabinetNavItem["id"], CabinetSection> = {
  overview: "overview",
  "agency-dashboard": "overview",
  "agency-analytics": "overview",
  listings: "listings",
  "new-listing": "listings",
  analytics: "listings",
  packages: "listings",
  assignments: "listings",
  transfers: "listings",
  leads: "work",
  clients: "work",
  reservations: "work",
  tasks: "work",
  reviews: "work",
  team: "work",
  activity: "work",
  "saved-searches": "personal",
  recommendations: "personal",
  "recently-viewed": "personal",
  reports: "personal",
  notifications: "account",
  restrictions: "account",
  profile: "account",
};

export function groupCabinetItems(items: readonly CabinetNavItem[]): { section: CabinetSection; items: CabinetNavItem[] }[] {
  return CABINET_SECTIONS.map((section) => ({ section, items: items.filter((item) => CABINET_ITEM_SECTION[item.id] === section) }))
    .filter((group) => group.items.length > 0);
}

export function isCabinetItemActive(pathname: string, href: string): boolean {
  return pathname === href;
}

/** Bundan çox bənd olanda (agentlik sahibi ~23) passiv bölmələr bağlı başlayır ki, menyu ekrana sığsın. */
export const CABINET_COLLAPSE_THRESHOLD = 16;

/**
 * İlk açıq bölmələr: qısa menyuda hamısı; uzun menyuda «Ümumi baxış», «Hesab» və aktiv bəndin bölməsi.
 * Bağlı bölmə yalnız vizual qatlanmadır — bəndlər itmir, başlığa basmaqla açılır.
 */
export function defaultOpenCabinetSections(
  groups: readonly { section: CabinetSection; items: readonly Pick<CabinetNavItem, "href">[] }[],
  activeHref: string | null,
): CabinetSection[] {
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  if (total <= CABINET_COLLAPSE_THRESHOLD) return groups.map((group) => group.section);
  return groups
    .filter((group) => group.section === "overview" || group.section === "account" || group.items.some((item) => item.href === activeHref))
    .map((group) => group.section);
}

/**
 * Aktiv menyu bəndi: ən uzun prefiksi uyğun gələn bənd. `/kabinet/muracietler/<id>` «Müraciətlər»i,
 * `/kabinet/elanlar/yeni` isə yalnız «Yeni elan»ı işıqlandırır; «Ümumi baxış» yalnız dəqiq ünvanda aktivdir.
 */
export function activeCabinetHref(pathname: string, items: readonly Pick<CabinetNavItem, "href">[]): string | null {
  let best: string | null = null;
  for (const { href } of items) {
    const matches = pathname === href || (href !== "/kabinet" && pathname.startsWith(`${href}/`));
    if (matches && (!best || href.length > best.length)) best = href;
  }
  return best;
}

export type CabinetCrumb = {
  href: string;
  labelKey:
    | "eyebrow"
    | "agencyDashboard"
    | "agencyAnalytics"
    | "assignments"
    | "listings"
    | "newListing"
    | "editListing"
    | "listingDocuments"
    | "leadCard"
    | "newClient"
    | "clientCard"
    | "listingPerformance"
    | "leads"
    | "clients"
    | "analytics"
    | "packages"
    | "team"
    | "activity"
    | "tasks"
    | "transfers"
    | "reviews"
    | "savedSearches"
    | "notifications"
    | "reports"
    | "restrictions"
    | "reservations"
    | "recommendations"
    | "recentlyViewed"
    | "profile";
};

const CRUMB_SEGMENTS: Record<string, CabinetCrumb["labelKey"]> = {
  elanlar: "listings",
  muracietler: "leads",
  musteriler: "clients",
  analitika: "analytics",
  paketler: "packages",
  komanda: "team",
  agentlik: "agencyDashboard",
  kocurmeler: "transfers",
  fealiyyet: "activity",
  tapsiriqlar: "tasks",
  reyler: "reviews",
  axtarislarim: "savedSearches",
  bildirisler: "notifications",
  sikayetlerim: "reports",
  mehdudiyyetler: "restrictions",
  rezervasiyalar: "reservations",
  tovsiyeler: "recommendations",
  "son-baxilanlar": "recentlyViewed",
  profil: "profile",
};

/**
 * Kabinet ünvanından breadcrumb zənciri (locale prefiksi olmadan):
 * `/kabinet/elanlar/yeni` → Kabinet › Elanlarım › Yeni elan;
 * `/kabinet/elanlar/<id>` → Kabinet › Elanlarım › Redaktə.
 */
export function cabinetBreadcrumbTrail(pathname: string): CabinetCrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "kabinet") return [];
  const trail: CabinetCrumb[] = [{ href: "/kabinet", labelKey: "eyebrow" }];
  const section = segments[1];
  if (!section) return trail;
  const sectionKey = CRUMB_SEGMENTS[section];
  if (!sectionKey) return trail;
  trail.push({ href: `/kabinet/${section}`, labelKey: sectionKey });
  const child = segments[2];
  if (section === "elanlar" && child) {
    trail.push({ href: `/kabinet/elanlar/${child}`, labelKey: child === "yeni" ? "newListing" : "editListing" });
    // Sənəd yükləmə səhifəsi (#256) əvvəl «Redaktə» kimi görünürdü.
    if (child !== "yeni" && segments[3] === "senedler") trail.push({ href: pathname, labelKey: "listingDocuments" });
  }
  // Detal səhifələri: müraciət kartı (#222), müştəri kartı (#226), elan performansı (#236).
  if (section === "muracietler" && child) trail.push({ href: pathname, labelKey: "leadCard" });
  if (section === "musteriler" && child) trail.push({ href: pathname, labelKey: child === "yeni" ? "newClient" : "clientCard" });
  if (section === "analitika" && child) trail.push({ href: pathname, labelKey: "listingPerformance" });
  if (section === "agentlik" && child === "elanlar") trail.push({ href: pathname, labelKey: "assignments" });
  if (section === "agentlik" && child === "analitika") trail.push({ href: pathname, labelKey: "agencyAnalytics" });
  return trail;
}
