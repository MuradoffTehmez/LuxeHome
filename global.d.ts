import type common from "./src/i18n/locales/az/common.json";
import type navigation from "./src/i18n/locales/az/navigation.json";
import type auth from "./src/i18n/locales/az/auth.json";
import type account from "./src/i18n/locales/az/account.json";
import type property from "./src/i18n/locales/az/property.json";
import type validation from "./src/i18n/locales/az/validation.json";
import type home from "./src/i18n/locales/az/home.json";
import type listings from "./src/i18n/locales/az/listings.json";
import type content from "./src/i18n/locales/az/content.json";
import type contact from "./src/i18n/locales/az/contact.json";
import type legal from "./src/i18n/locales/az/legal.json";
import type partners from "./src/i18n/locales/az/partners.json";
import type seoLandings from "./src/i18n/locales/az/seoLandings.json";
import type phase2 from "./src/i18n/locales/az/phase2.json";
import type phase3 from "./src/i18n/locales/az/phase3.json";
import type knowledge from "./src/i18n/locales/az/knowledge.json";
import type admin from "./src/i18n/locales/az/admin.json";

/**
 * `useTranslations()`/`getTranslations()` üçün açar avtotamamlama.
 * Mənbə dil AZ-dır (default) — `en`/`ru` faylları struktur baxımından bunun eyni
 * olmalıdır, əks halda TypeScript deyil, `next-intl`-in özü işarə edəcək.
 *
 * `admin` kataloqu da buradadır ki, panel açarları avtotamamlansın. Runtime-da o,
 * ictimai sorğulara yüklənmir — yalnız `/admin` ağacına (`src/i18n/admin.ts`).
 */
type Messages = {
  common: typeof common;
  navigation: typeof navigation;
  auth: typeof auth;
  account: typeof account;
  property: typeof property;
  validation: typeof validation;
  home: typeof home;
  listings: typeof listings;
  content: typeof content;
  contact: typeof contact;
  legal: typeof legal;
  partners: typeof partners;
  seoLandings: typeof seoLandings;
  phase2: typeof phase2;
  phase3: typeof phase3;
  knowledge: typeof knowledge;
  admin: typeof admin;
};

declare module "next-intl" {
  interface AppConfig {
    Messages: Messages;
  }
}
