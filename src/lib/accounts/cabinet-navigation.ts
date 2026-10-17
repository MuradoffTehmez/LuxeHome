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
  { id: "reservations", href: "/kabinet/rezervasiyalar", label: "Rezervasiyalarım" },
  { id: "recommendations", href: "/kabinet/tovsiyeler", label: "Sizin üçün" },
  { id: "recently-viewed", href: "/kabinet/son-baxilanlar", label: "Son baxılanlar" },
];

export function getCabinetItems(canList: boolean, canManageTeam = false, canTransfer = false, canAssignListings = false): readonly CabinetNavItem[] {
  const items = canList ? [BASE_ITEMS[0], ...LISTING_ITEMS] : [BASE_ITEMS[0]];
  if (canManageTeam) {
    items.splice(1, 0, AGENCY_DASHBOARD_ITEM, AGENCY_ANALYTICS_ITEM);
    items.push(TEAM_ITEM, ACTIVITY_ITEM);
  }
  if (canManageTeam || canAssignListings) items.push(ASSIGNMENTS_ITEM);
  if (canTransfer) items.push(TASKS_ITEM, TRANSFERS_ITEM, REVIEWS_ITEM);
  items.push(...DISCOVERY_ITEMS, BASE_ITEMS[1]);
  return items;
}

export function isCabinetItemActive(pathname: string, href: string): boolean {
  return pathname === href;
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
    trail.push({ href: pathname, labelKey: child === "yeni" ? "newListing" : "editListing" });
  }
  if (section === "agentlik" && child === "elanlar") trail.push({ href: pathname, labelKey: "assignments" });
  if (section === "agentlik" && child === "analitika") trail.push({ href: pathname, labelKey: "agencyAnalytics" });
  return trail;
}
