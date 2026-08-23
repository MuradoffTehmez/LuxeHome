export type CabinetNavItem = {
  id: "overview" | "listings" | "new-listing" | "team" | "profile";
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

export function getCabinetItems(canList: boolean, canManageTeam = false): readonly CabinetNavItem[] {
  const items = canList ? [BASE_ITEMS[0], ...LISTING_ITEMS] : [BASE_ITEMS[0]];
  if (canManageTeam) items.push(TEAM_ITEM);
  items.push(BASE_ITEMS[1]);
  return items;
}

export function isCabinetItemActive(pathname: string, href: string): boolean {
  return pathname === href;
}
