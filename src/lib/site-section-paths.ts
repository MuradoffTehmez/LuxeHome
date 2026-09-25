/**
 * Gizlədilə bilən ictimai bölmələrin marşrut köməkçiləri (#83).
 *
 * Saf funksiyalardır və client komponentlərindən (Navbar) idxal olunur — ona görə
 * `settings`/Prisma-dan asılı olan `site-sections.ts`-dən ayrı saxlanılır.
 */

export const PROJECTS_SECTION_PATH = "/layiheler";

/** `href` gizli bölməyə (özünə və ya alt marşrutuna) aiddirmi? */
export function isHiddenPath(href: string, hiddenPaths: readonly string[]): boolean {
  return hiddenPaths.some((path) => href === path || href.startsWith(`${path}/`));
}

/** Siyahıdan gizli bölmələrin keçidlərini çıxarır. */
export function withoutHiddenPaths<T extends { href: string }>(items: readonly T[], hiddenPaths: readonly string[]): T[] {
  return hiddenPaths.length === 0 ? [...items] : items.filter((item) => !isHiddenPath(item.href, hiddenPaths));
}
