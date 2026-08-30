import { LOCALES, DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from "@/lib/constants";

/**
 * i18n-in tək mənbəsi. Dil siyahısı özü `src/lib/constants.ts`-dədir (`LOCALES`) —
 * `User.locale`/`AgencyEmployee` kimi domen sahələri artıq ordan asılıdır, ona görə
 * burada təkrarlanmır, sadəcə i18n qatının ehtiyac duyduğu formada yenidən verilir.
 */
export { LOCALES, DEFAULT_LOCALE, LOCALE_LABELS };
export type { Locale };

/** Mesaj faylları bölündüyü modullar — hər dil eyni siyahını daşımalıdır. */
export const MESSAGE_NAMESPACES = [
  "common",
  "navigation",
  "auth",
  "account",
  "property",
  "validation",
  "home",
  "listings",
  "content",
  "contact",
  "legal",
  "partners",
  "seoLandings",
  "phase2",
  "phase3",
  "knowledge",
] as const;

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

/** `next-intl` middleware-in dil seçimini saxladığı cookie adı. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
