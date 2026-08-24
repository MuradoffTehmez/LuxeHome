import type common from "./src/i18n/locales/az/common.json";
import type navigation from "./src/i18n/locales/az/navigation.json";
import type auth from "./src/i18n/locales/az/auth.json";
import type property from "./src/i18n/locales/az/property.json";
import type validation from "./src/i18n/locales/az/validation.json";

/**
 * `useTranslations()`/`getTranslations()` üçün açar avtotamamlama.
 * Mənbə dil AZ-dır (default) — `en`/`ru` faylları struktur baxımından bunun eyni
 * olmalıdır, əks halda TypeScript deyil, `next-intl`-in özü işarə edəcək.
 */
type Messages = {
  common: typeof common;
  navigation: typeof navigation;
  auth: typeof auth;
  property: typeof property;
  validation: typeof validation;
};

declare module "next-intl" {
  interface AppConfig {
    Messages: Messages;
  }
}
