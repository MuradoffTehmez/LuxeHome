import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "./config";

/**
 * `localePrefix: "always"` — saytın bütün istifadəçi səhifələri eyni URL prinsipini
 * daşıyır: `/az/...`, `/en/...`, `/ru/...`. Prefikssiz köhnə URL-ləri middleware
 * uyğun dil ünvanına yönləndirir; `/admin` və texniki endpoint-lər istisnadır.
 */
export const routing = defineRouting({
  locales: Object.values(LOCALES),
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});
