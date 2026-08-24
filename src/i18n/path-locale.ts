import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/constants";

/** Xarici URL-dən ictimai məzmun dilini müəyyən edir. */
export function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return Object.values(LOCALES).includes(segment as Locale)
    ? (segment as Locale)
    : DEFAULT_LOCALE;
}

/** Xarici URL-dən locale seqmentini çıxarıb tətbiqdaxili pathname qaytarır. */
export function pathnameWithoutLocale(pathname: string): string {
  const match = pathname.match(/^\/([^/?#]+)(.*)$/);
  if (!match || !Object.values(LOCALES).includes(match[1] as Locale)) return pathname;
  return match[2] || "/";
}

/** İstənilən tətbiqdaxili yolu bütün dillər üçün məcburi locale prefiksi ilə qurur. */
export function localizePath(path: string, locale: Locale): string {
  const suffixIndex = path.search(/[?#]/);
  const pathname = suffixIndex === -1 ? path : path.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : path.slice(suffixIndex);
  const normalized = pathnameWithoutLocale(pathname || "/");
  return `/${locale}${normalized === "/" ? "" : normalized}${suffix}`;
}
