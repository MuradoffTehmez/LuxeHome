import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "./config";

/**
 * `localePrefix: "as-needed"` — default dil (AZ) prefikssiz qalır ki, indeksləşmiş
 * `/emlaklar` kimi mövcud URL-lər dəyişməsin. EN/RU üçün `/en/...`, `/ru/...` prefiksi
 * əlavə olunur — hər dil variantının öz ayrıca, indeksləşə bilən URL-i olur.
 */
export const routing = defineRouting({
  locales: Object.values(LOCALES),
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "as-needed",
});
