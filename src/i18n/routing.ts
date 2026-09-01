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
  // Hreflang yalnız `buildMetadata` vasitəsilə HTML `<head>`-də qurulur.
  // Middleware-in ayrıca `Link` başlığı fərqli x-default yaradaraq siqnalları ziddiyyətə salırdı.
  alternateLinks: false,

  // Dil yalnız URL prefiksindən oxunur.
  //
  // `localeCookie: false` — `NEXT_LOCALE` cookie-si yazılmır. Bu, ilk növbədə
  // performans qərarıdır: cookie hər ictimai cavaba `Set-Cookie` əlavə edirdi və
  // Cloudflare `Set-Cookie` daşıyan cavabı keşləmir. Prefiks həmişə mövcud
  // olduğuna görə (`localePrefix: "always"`) cookie marşrutlaşdırmaya heç nə
  // əlavə etmirdi.
  //
  // `localeDetection: false` — Accept-Language ilə təxmin edilmir; prefikssiz
  // ünvan default dilə düşür. Beləliklə eyni URL hər ziyarətçiyə eyni cavabı
  // verir, bu da keşlənə bilən olmasının şərtidir.
  localeCookie: false,
  localeDetection: false,
});
