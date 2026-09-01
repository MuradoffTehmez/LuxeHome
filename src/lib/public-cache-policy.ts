import { LOCALES } from "@/lib/constants";

/**
 * İctimai HTML keşinin təhlükəsizlik siyasəti.
 *
 * Əsas qayda: **istifadəçiyə məxsus HTML heç vaxt paylaşılan keşə düşməməlidir.**
 * Ona görə keşlənə bilən yolun şərti sadədir — server komponentində sessiya
 * oxunmamalıdır. Bu modul yeganə mənbədir; `public-cache-safety.test.ts` siyahını
 * mənbə kodundan yenidən hesablayıb burada yazılanla tutuşdurur.
 *
 * Modul hazırda yalnız siyasəti təsvir edir — keş hələ aktiv deyil. Aktivləşmə
 * `RSC` / `Next-Router-*` ölçüləri keş açarına salındıqdan sonra mümkündür,
 * çünki sənəd sorğusu ilə naviqasiya payload-u eyni girişi bölüşməməlidir.
 */

/** Server komponentində sessiya oxuyan ictimai marşrutlar (locale prefiksi olmadan). */
export const SESSION_DEPENDENT_PUBLIC_ROUTES = [
  "/emlaklar/[param]",
  "/mene-emlak-tap",
] as const;

/** Heç bir halda keşlənməyən ön şəkilçilər — auth, kabinet, panel və API. */
const NEVER_CACHED_PREFIXES = [
  "/admin",
  "/api",
  "/giris",
  "/daxil-ol",
  "/qeydiyyat",
  "/kabinet",
  "/parolu-unutdum",
  "/parolu-yenile",
  "/favoritler",
] as const;

const LOCALE_PREFIX = new RegExp(`^/(${Object.values(LOCALES).join("|")})(?=/|$)`);

/** `/az/emlaklar/villa` → `/emlaklar/villa`; prefiks yoxdursa toxunulmur. */
export function stripLocale(pathname: string): string {
  const stripped = pathname.replace(LOCALE_PREFIX, "");
  return stripped === "" ? "/" : stripped;
}

/** `/emlaklar/villa-123` marşrut şablonuna (`/emlaklar/[param]`) uyğun gəlirmi. */
function matchesRoute(path: string, pattern: string): boolean {
  const pathSegments = path.split("/").filter(Boolean);
  const patternSegments = pattern.split("/").filter(Boolean);
  if (pathSegments.length !== patternSegments.length) return false;

  return patternSegments.every(
    (segment, i) => segment === "[param]" || segment === pathSegments[i],
  );
}

/**
 * Bu yolun cavabı paylaşılan keşə salına bilərmi.
 *
 * `false` qaytarmaq həmişə təhlükəsizdir; `true` yalnız sessiyadan asılı olmayan
 * ictimai səhifələr üçün qaytarılır.
 */
export function isCacheablePublicRoute(pathname: string): boolean {
  const path = stripLocale(pathname);

  if (NEVER_CACHED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return false;
  }

  return !SESSION_DEPENDENT_PUBLIC_ROUTES.some((pattern) => matchesRoute(path, pattern));
}
