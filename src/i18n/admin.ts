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
 * Client-ə göndərilən mesajların marşruta görə süzülməsi.
 *
 * `NextIntlClientProvider` aldığı hər şeyi RSC payload-una serializə edir. Tam
 * `admin` kataloqu 83 KB (RU-da 132 KB) idi və hər panel səhifəsində təkrar
 * göndərilirdi, halbuki bir səhifənin client komponentləri yalnız öz bölməsini
 * oxuyur.
 *
 * Siyahı təxmini deyil: hər marşrutun client komponentləri skan edilib. Naməlum
 * marşrut tam kataloqa düşür — yeni səhifə heç vaxt açar adı göstərmir.
 */
const SHARED_SECTIONS = ["shell", "nav", "actions", "labels", "components"] as const;

const ROUTE_SECTIONS: Record<string, readonly string[]> = {
  agentler: ["pages.agents", "pages.misc"],
  agentlikler: ["pages.agents"],
  "bilik-merkezi": ["pages.knowledge", "pages.misc"],
  blog: ["pages.blog", "pages.misc"],
  emlaklar: ["pages.misc", "pages.properties"],
  hesabim: ["pages.account", "profile"],
  hesablar: ["pages.common", "pages.misc"],
  "ictimai-imkanlar": ["pages.amenities", "pages.misc"],
  istifadeciler: ["pages.common", "pages.users"],
  layiheler: ["pages.common", "pages.misc", "pages.projects"],
  media: ["pages.common", "pages.misc", "pages.settings"],
  moderation: ["pages.common", "pages.moderation"],
  muracietler: ["pages.common", "pages.leads"],
  parametrler: ["pages.common", "pages.settings"],
  redirects: ["pages.common", "pages.misc", "pages.serp"],
  rezervasiyalar: ["pages.ops"],
  taksonomiya: ["pages.common", "pages.misc", "pages.taxonomy"],
  tercumeler: ["pages.translations"],
  terefdaslar: ["pages.common", "pages.misc", "pages.partners"],
  xidmetler: ["pages.misc", "pages.services"],
  // Client komponenti tərcümə işlətməyən ağaclar yalnız ortaq bölmələri alır
  "ai-komekci": [],
  analitika: [],
  audit: [],
  "e-poct": [],
  security: [],
  seo: [],
  serp: [],
  "": [],
};

function assign(target: Record<string, unknown>, path: string, value: unknown) {
  const [head, tail] = path.split(".") as [string, string | undefined];
  if (!tail) {
    target[head] = value;
    return;
  }
  const nested = (target[head] ??= {}) as Record<string, unknown>;
  nested[tail] = value;
}

function read(source: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], source);
}

/** `/admin/emlaklar/123` → `emlaklar`; `/admin` → `""`. */
export function adminRouteSegment(pathname: string): string {
  return pathname.replace(/^\/admin\/?/, "").split("/")[0] ?? "";
}

export function pickAdminMessages(messages: AdminMessages, pathname: string): AdminMessages {
  const sections = ROUTE_SECTIONS[adminRouteSegment(pathname)];
  if (!sections) return messages;

  const source = messages.admin as unknown as Record<string, unknown>;
  const picked: Record<string, unknown> = {};
  for (const path of [...SHARED_SECTIONS, ...sections]) {
    const value = read(source, path);
    if (value !== undefined) assign(picked, path, value);
  }

  return { admin: picked } as AdminMessages;
}
