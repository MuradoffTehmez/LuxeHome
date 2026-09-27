/**
 * Paket və ödəniş hesablamaları (#109) — saf funksiyalar, prisma idxal etmir ki,
 * client komponentləri də işlədə bilsin.
 *
 * Məbləğlər qəpiklə (tam ədəd) saxlanılır: 9.90 ₼ → 990.
 */

const DAY_MS = 86_400_000;
/** Bir paketin ağlabatan yuxarı həddi (100 000 ₼) — yazı xətasından qoruyur. */
export const MAX_PACKAGE_PRICE_MINOR = 10_000_000;
export const MAX_PACKAGE_DURATION_DAYS = 365;
/** Kabinetdə eyni anda gözləyən sifariş sayı — spam və təkrar klikdən qoruma. */
export const MAX_PENDING_ORDERS_PER_USER = 3;

/** «9,90», «9.9», «10» → qəpik. Mənfi, 2-dən çox onluq və ya hədddən böyük dəyər üçün null. */
export function parseMoneyToMinor(input: string | null | undefined): number | null {
  const value = (input ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) && minor <= MAX_PACKAGE_PRICE_MINOR ? minor : null;
}

/** 990 → «9,90 ₼», 1000 → «10 ₼». */
export function formatMoneyMinor(minor: number, currency = "AZN"): string {
  const symbol = currency === "AZN" ? "₼" : currency;
  const fractional = minor % 100 !== 0;
  const amount = new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: fractional ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
  return `${amount} ${symbol}`;
}

/** Forma sahəsi üçün: 990 → «9.90», 1000 → «10». */
export function minorToInput(minor: number): string {
  return minor % 100 === 0 ? String(minor / 100) : (minor / 100).toFixed(2);
}

export type PremiumState = { isFeatured: boolean; featuredUntil: Date | null };

/** `isFeatured` + boş `featuredUntil` köhnə müddətsiz premiumdur — ödəniş onu dəyişmir. */
export function isUnlimitedPremium(state: PremiumState): boolean {
  return state.isFeatured && state.featuredUntil === null;
}

/**
 * Ödənilmiş paketin premium müddətinə təsiri. Aktiv premium varsa üstünə gəlinir
 * (ardıcıl iki 7 günlük paket 14 gün verir), yoxsa bu andan sayılır.
 */
export function extendPremium(state: PremiumState, days: number, now = new Date()): PremiumState {
  if (isUnlimitedPremium(state)) return state;
  const active = state.isFeatured && state.featuredUntil !== null && state.featuredUntil.getTime() > now.getTime();
  const base = active ? state.featuredUntil!.getTime() : now.getTime();
  return { isFeatured: true, featuredUntil: new Date(base + days * DAY_MS) };
}

/**
 * Geri qaytarılan paketin müddəti premiumdan çıxılır. Qalan müddət bitibsə premium
 * söndürülür; üst-üstə gələn digər ödənişlərin günləri toxunulmaz qalır.
 */
export function shrinkPremium(state: PremiumState, days: number, now = new Date()): PremiumState {
  if (isUnlimitedPremium(state) || !state.isFeatured || state.featuredUntil === null) return state;
  const next = state.featuredUntil.getTime() - days * DAY_MS;
  return next > now.getTime()
    ? { isFeatured: true, featuredUntil: new Date(next) }
    : { isFeatured: false, featuredUntil: null };
}

/** Ayın Bakı vaxtı ilə başlanğıcı (UTC) — gəlir xülasəsi üçün. */
export function bakuMonthStart(now = new Date()): Date {
  const baku = new Date(now.getTime() + 4 * 3_600_000);
  return new Date(Date.UTC(baku.getUTCFullYear(), baku.getUTCMonth(), 1) - 4 * 3_600_000);
}
