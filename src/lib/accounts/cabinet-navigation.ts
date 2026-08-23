export type CabinetNavItem = {
  id: "overview" | "listings" | "new-listing" | "profile";
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

export function getCabinetItems(canList: boolean): readonly CabinetNavItem[] {
  return canList ? [BASE_ITEMS[0], ...LISTING_ITEMS, BASE_ITEMS[1]] : BASE_ITEMS;
}

export function isCabinetItemActive(pathname: string, href: string): boolean {
  return pathname === href;
}
