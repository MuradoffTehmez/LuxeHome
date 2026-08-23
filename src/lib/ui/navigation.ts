/** Cari route-un naviqasiya elementinə aid olub-olmadığını segment sərhədi ilə yoxlayır. */
export function isNavigationItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
