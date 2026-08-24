import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/constants";

/** Xarici URL-dən ictimai məzmun dilini müəyyən edir. */
export function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return Object.values(LOCALES).includes(segment as Locale)
    ? (segment as Locale)
    : DEFAULT_LOCALE;
}
