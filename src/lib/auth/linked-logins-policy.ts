/**
 * Kabinetdəki «Bağlı giriş üsulları» qaydaları — saf modul, D1 və Next olmadan test olunur.
 *
 * Bağlama həmişə **giriş etmiş istifadəçinin öz sessiyasından** başlayır: hədəf hesab imzalı flow cookie-sindədir
 * (`linkUserId`), callback-də cari sessiya ilə yenidən müqayisə olunur. Ona görə e-poçtu təsdiqsiz provayder
 * (Facebook) də bağlana bilir — sahiblik sessiya ilə sübut olunub, e-poçtla yox.
 *
 * Ayırma hesabı kilidləməməlidir: ayrılan üsuldan sonra ən azı bir giriş yolu (parol, başqa provayder, Telegram,
 * təsdiqlənmiş nömrə ilə SMS girişi) qalmalıdır.
 */

export const LINKABLE_PROVIDERS = ["GOOGLE", "APPLE", "FACEBOOK"] as const;
export type LinkableProvider = (typeof LINKABLE_PROVIDERS)[number];

export function isLinkableProvider(value: unknown): value is LinkableProvider {
  return typeof value === "string" && (LINKABLE_PROVIDERS as readonly string[]).includes(value);
}

export type LoginMethods = {
  password: boolean;
  google: boolean;
  apple: boolean;
  facebook: boolean;
  telegram: boolean;
  /** Təsdiqlənmiş nömrə və SMS provayderi qurulub. */
  phone: boolean;
};

const PROVIDER_FIELD: Record<LinkableProvider, keyof LoginMethods> = { GOOGLE: "google", APPLE: "apple", FACEBOOK: "facebook" };

/** Bu provayder ayrılsa hesabda başqa giriş yolu qalırmı. */
export function canUnlinkLogin(methods: LoginMethods, provider: LinkableProvider): boolean {
  const field = PROVIDER_FIELD[provider];
  if (!methods[field]) return false;
  return (Object.keys(methods) as (keyof LoginMethods)[]).some((key) => key !== field && methods[key]);
}

export type LinkOutcome = "linked" | "already" | "taken" | "other" | "mismatch" | "failed";

/**
 * Bağlama qərarı: kimlik başqa hesabdadırsa `taken`; hesabda eyni provayderin başqa kimliyi varsa `other`
 * (əvvəl ayırmaq lazımdır); eyni kimlik artıq bu hesabdadırsa `already`.
 */
export function linkDecision(input: { userId: string; holderUserId: string | null; currentSubject: string | null; subject: string }): Exclude<LinkOutcome, "mismatch" | "failed"> {
  if (input.holderUserId && input.holderUserId !== input.userId) return "taken";
  if (input.currentSubject === input.subject) return "already";
  if (input.currentSubject) return "other";
  return "linked";
}

/** Kabinetə qayıdış ünvanının sorğu hissəsi — yalnız allowlist dəyərləri. */
export function linkResultQuery(provider: LinkableProvider, outcome: LinkOutcome): string {
  return `bagla=${provider.toLowerCase()}&netice=${outcome}`;
}
