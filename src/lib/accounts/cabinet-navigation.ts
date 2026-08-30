export type CabinetNavItem = {
  id:
    | "overview"
    | "listings"
    | "new-listing"
    | "team"
    | "saved-searches"
    | "notifications"
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
];

const TEAM_ITEM: CabinetNavItem = { id: "team", href: "/kabinet/komanda", label: "Komanda" };

/** Hər hesab növünə görünən yeni bölmələr — elan yerləşdirmə icazəsindən asılı deyil. */
const DISCOVERY_ITEMS: readonly CabinetNavItem[] = [
  { id: "saved-searches", href: "/kabinet/axtarislarim", label: "Saxlanmış axtarışlarım" },
  { id: "notifications", href: "/kabinet/bildirisler", label: "Bildirişlər" },
  { id: "reservations", href: "/kabinet/rezervasiyalar", label: "Rezervasiyalarım" },
  { id: "recommendations", href: "/kabinet/tovsiyeler", label: "Sizin üçün" },
  { id: "recently-viewed", href: "/kabinet/son-baxilanlar", label: "Son baxılanlar" },
];

export function getCabinetItems(canList: boolean, canManageTeam = false): readonly CabinetNavItem[] {
  const items = canList ? [BASE_ITEMS[0], ...LISTING_ITEMS] : [BASE_ITEMS[0]];
  if (canManageTeam) items.push(TEAM_ITEM);
  items.push(...DISCOVERY_ITEMS, BASE_ITEMS[1]);
  return items;
}

export function isCabinetItemActive(pathname: string, href: string): boolean {
  return pathname === href;
}
