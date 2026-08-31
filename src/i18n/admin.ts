import { createTranslator } from "next-intl";

import type adminCatalog from "./locales/az/admin.json";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./config";
import { formats } from "./formats";

/**
 * Admin panelin tərcümə qatı.
 *
 * `/admin` qəsdən locale prefiksi daşımır (`routing.ts`), ona görə `request.ts`-dəki
 * `getRequestConfig` axını burada işləmir: orada dil URL-dən oxunur, panel isə dili
 * `User.locale`-dan götürür. Panel kataloqları ictimai `MESSAGE_NAMESPACES` siyahısına
 * da salınmır — əks halda hər ictimai sorğu admin mesajlarını da yükləyərdi.
 */
export const ADMIN_MESSAGE_NAMESPACES = ["admin"] as const;

export type AdminMessageNamespace = (typeof ADMIN_MESSAGE_NAMESPACES)[number];

/** Kataloqun dəqiq forması — açar avtotamamlaması bundan gəlir (`global.d.ts` ilə eyni mənbə). */
export type AdminMessages = { admin: typeof adminCatalog };

/** Naviqasiya açarları kataloqdan törəyir: menyuya yeni sətir yalnız tərcümə ilə birlikdə əlavə olunur. */
export type AdminNavGroupKey = keyof typeof adminCatalog.nav.groups;
export type AdminNavItemKey = keyof typeof adminCatalog.nav.items;

/** Naməlum dəyəri (məs. bazadakı köhnə sətri) dəstəklənən dilə gətirir. */
export function resolveAdminLocale(value: string | null | undefined): Locale {
  const locales = Object.values(LOCALES) as string[];
  return locales.includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

/**
 * Panel kataloqlarını oxuyur. Statik `import()` yolu qəsdən şablonludur — OpenNext
 * bundle-ı hər üç dilin faylını daxil etsin deyə `locale` dəyəri yalnız fayl adında
 * iştirak edir.
 */
export async function loadAdminMessages(locale: Locale): Promise<AdminMessages> {
  const modules = await Promise.all(
    ADMIN_MESSAGE_NAMESPACES.map((namespace) =>
      import(`./locales/${locale}/${namespace}.json`).then((m) => m.default),
    ),
  );

  return Object.fromEntries(
    ADMIN_MESSAGE_NAMESPACES.map((namespace, i) => [namespace, modules[i]]),
  ) as AdminMessages;
}

/**
 * Server komponentləri üçün tərcüməçi.
 *
 * `getTranslations()` işlədilmir: o, mesajları request konfiqurasiyasından oxuyur və
 * `/admin` üçün dil URL-də olmadığından həmişə AZ-a düşərdi. `createTranslator` isə
 * dili və kataloqu birbaşa qəbul edir.
 */
export function createAdminTranslator(locale: Locale, messages: AdminMessages) {
  return createTranslator({
    locale,
    messages,
    formats,
    namespace: "admin",
    onError(error) {
      console.error("[i18n:admin]", error);
    },
    getMessageFallback({ namespace, key }) {
      return `${namespace ? `${namespace}.` : ""}${key}`;
    },
  });
}
