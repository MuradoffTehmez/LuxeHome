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

/**
 * **Marşruta görə süzgəc qəsdən götürülüb.**
 *
 * Əvvəl bu fayl `pickAdminMessages(messages, pathname)` ilə client-ə yalnız cari
 * marşrutun bölmələrini göndərirdi. Süzgəcin özü düzgün idi, yerləşdiyi yer isə yox:
 * kataloq `admin/layout.tsx`-də seçilirdi, **layout isə client naviqasiyasında
 * yenidən render olunmur** — `/admin`-dən `/admin/emlaklar/[id]`-ə keçəndə provider
 * hələ də ilk yüklənən marşrutun bölmələrini daşıyırdı və panel mətn əvəzinə
 * `admin.pages.properties.*` açarlarını göstərirdi. Səhifə yenilənəndə layout
 * yenidən qurulduğu üçün problem "öz-özünə düzəlirdi".
 *
 * `template.tsx` də bunu həll etmir: template parent seqmentin render nəticəsinə
 * daxildir, naviqasiyada yalnız yenidən mount olunur, serverdə təkrar icra olunmur.
 *
 * İndi layout tam kataloqu göndərir. Bu, ilk yüklənişdə ~78 KB serializə deməkdir
 * (brotli-dən sonra onluqlarla dəfə kiçik), amma paneldaxili hər keçid **sıfıra**
 * düşür: layout bir dəfə render olunduğu üçün mesajlar bütün naviqasiyalar boyu
 * təkrar göndərilmir. Süzgəclə isə hər tam yükləniş azalırdı, keçidlər isə onsuz da
 * heç nə göndərmirdi — yəni qazanc yalnız hard reload-lara aid idi.
 *
 * Marşruta görə süzgəc yenidən lazım olsa, düzgün yeri hər bölmənin öz
 * `layout.tsx`-idir (məs. `admin/emlaklar/layout.tsx`) — o, seqmentə daxil olarkən
 * yenidən render olunur.
 */
