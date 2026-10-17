/**
 * Abunə planlarının qaydaları (#244, PRD 16.1–16.4) — saf modul (Prisma yoxdur): ictimai səhifə,
 * admin forması və migration generatoru eyni mənbəni işlədir.
 *
 * Plan imkanları səviyyə ilə ifadə olunur (`CAPABILITY_LEVELS`). Cədvəl PRD 16.2-nin təklif olunan
 * strukturudur; dəqiq limit və qiymətlər paneldən dəyişir. Tanıtım mərhələsində (monetizasiya bağlı)
 * planlar yalnız məlumatdır — qiymət göstərilmir və ödəniş yaratmaq imkanı yoxdur (PRD 16.4).
 */

export const PLAN_CODES = ["BASIC", "PRO", "PREMIUM"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const PLAN_AUDIENCES = ["INDIVIDUAL", "AGENCY"] as const;
export type PlanAudience = (typeof PLAN_AUDIENCES)[number];

/** Abunə müddətləri (ay) — PRD 16.3. */
export const PLAN_DURATIONS = [1, 3, 6, 12] as const;
export type PlanDuration = (typeof PLAN_DURATIONS)[number];

export const DEFAULT_TRIAL_DAYS = 15;
export const TRIAL_DAYS_MAX = 90;
export const PLAN_PRICE_MAX_MINOR = 10_000_000; // 100 000 AZN
export const PLAN_DESCRIPTION_MAX = 500;

export const PLAN_CAPABILITIES = [
  "LISTINGS",
  "LISTING_STATS",
  "FEATURED",
  "REPORTS",
  "NOTIFICATIONS",
  "ANALYTICS",
  "EXPORT",
  "AGENCY_MANAGEMENT",
  "CRM",
  "AUTOMATION",
  "SUPPORT",
] as const;
export type PlanCapability = (typeof PLAN_CAPABILITIES)[number];

/** Səviyyələr artan sıra ilə; `rank` müqayisə üçündür (eyni rank — eyni güc, fərqli ad). */
export const CAPABILITY_LEVELS = {
  NONE: 0,
  LIMITED: 1,
  BASIC: 2,
  STANDARD: 2,
  INCLUDED: 3,
  EXTENDED: 4,
  PRIORITY: 4,
  FULL: 5,
  PROFESSIONAL: 5,
  HIGH: 5,
} as const;
export type CapabilityLevel = keyof typeof CAPABILITY_LEVELS;

export type PlanCapabilities = Record<PlanCapability, CapabilityLevel>;

/** PRD 16.2 cədvəli. */
export const DEFAULT_PLAN_CAPABILITIES: Record<PlanCode, PlanCapabilities> = {
  BASIC: {
    LISTINGS: "INCLUDED", LISTING_STATS: "BASIC", FEATURED: "INCLUDED", REPORTS: "INCLUDED", NOTIFICATIONS: "BASIC",
    ANALYTICS: "BASIC", EXPORT: "LIMITED", AGENCY_MANAGEMENT: "BASIC", CRM: "LIMITED", AUTOMATION: "NONE", SUPPORT: "STANDARD",
  },
  PRO: {
    LISTINGS: "INCLUDED", LISTING_STATS: "EXTENDED", FEATURED: "INCLUDED", REPORTS: "INCLUDED", NOTIFICATIONS: "EXTENDED",
    ANALYTICS: "EXTENDED", EXPORT: "INCLUDED", AGENCY_MANAGEMENT: "EXTENDED", CRM: "INCLUDED", AUTOMATION: "LIMITED", SUPPORT: "PRIORITY",
  },
  PREMIUM: {
    LISTINGS: "INCLUDED", LISTING_STATS: "FULL", FEATURED: "INCLUDED", REPORTS: "INCLUDED", NOTIFICATIONS: "EXTENDED",
    ANALYTICS: "PROFESSIONAL", EXPORT: "EXTENDED", AGENCY_MANAGEMENT: "FULL", CRM: "EXTENDED", AUTOMATION: "INCLUDED", SUPPORT: "HIGH",
  },
};

/** Xidmət limitləri (PRD 16.5) — `null` limitsizdir. Tanıtım mərhələsində tətbiq olunmur. */
export const PLAN_LIMITS = ["activeListings", "agents", "crmClients", "exportsPerMonth"] as const;
export type PlanLimit = (typeof PLAN_LIMITS)[number];
export type PlanLimits = Record<PlanLimit, number | null>;
export const PLAN_LIMIT_MAX = 100_000;

export const EMPTY_PLAN_LIMITS: PlanLimits = { activeListings: null, agents: null, crmClients: null, exportsPerMonth: null };

export function isPlanCode(value: unknown): value is PlanCode {
  return typeof value === "string" && (PLAN_CODES as readonly string[]).includes(value);
}
export function isPlanAudience(value: unknown): value is PlanAudience {
  return typeof value === "string" && (PLAN_AUDIENCES as readonly string[]).includes(value);
}
export function isPlanDuration(value: unknown): value is PlanDuration {
  return typeof value === "number" && (PLAN_DURATIONS as readonly number[]).includes(value);
}
export function isCapabilityLevel(value: unknown): value is CapabilityLevel {
  return typeof value === "string" && Object.hasOwn(CAPABILITY_LEVELS, value);
}

/** Bazadakı JSON → tam imkan dəsti; pozulmuş/naməlum dəyər planın defoltuna qayıdır. */
export function parsePlanCapabilities(raw: string | null | undefined, code: PlanCode): PlanCapabilities {
  const result = { ...DEFAULT_PLAN_CAPABILITIES[code] };
  if (!raw) return result;
  try {
    const value = JSON.parse(raw) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const capability of PLAN_CAPABILITIES) {
        const level = (value as Record<string, unknown>)[capability];
        if (isCapabilityLevel(level)) result[capability] = level;
      }
    }
  } catch {
    // Pozulmuş dəyər — defolt.
  }
  return result;
}

export function parsePlanLimits(raw: string | null | undefined): PlanLimits {
  const result = { ...EMPTY_PLAN_LIMITS };
  if (!raw) return result;
  try {
    const value = JSON.parse(raw) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const limit of PLAN_LIMITS) {
        const amount = (value as Record<string, unknown>)[limit];
        if (typeof amount === "number" && Number.isInteger(amount) && amount >= 0 && amount <= PLAN_LIMIT_MAX) result[limit] = amount;
      }
    }
  } catch {
    // Pozulmuş dəyər — limitsiz.
  }
  return result;
}

/** Forma sahəsi → limit: boş — limitsiz, səhv — `undefined` (xəta). */
export function parseLimitInput(value: FormDataEntryValue | null): number | null | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  if (!/^\d+$/.test(text)) return undefined;
  const amount = Number(text);
  return amount <= PLAN_LIMIT_MAX ? amount : undefined;
}

/** «12.50» → 1250 qəpik; boş — tarif yoxdur (`null`), səhv — `undefined`. */
export function parsePriceInput(value: FormDataEntryValue | null): number | null | undefined {
  const text = typeof value === "string" ? value.trim().replace(",", ".") : "";
  if (!text) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return undefined;
  const minor = Math.round(Number(text) * 100);
  return minor <= PLAN_PRICE_MAX_MINOR ? minor : undefined;
}

/** Bir aylıq ekvivalentə görə endirim faizi (uzun müddətli tarifin üstünlüyü). */
export function durationSavingsPercent(monthlyMinor: number | null, priceMinor: number, months: number): number | null {
  if (!monthlyMinor || months <= 1) return null;
  const full = monthlyMinor * months;
  if (priceMinor >= full) return null;
  return Math.round(((full - priceMinor) / full) * 100);
}

/**
 * Paket səhifəsinin rejimi (PRD 16.4): tanıtım mərhələsində qiymət gizlənir və tanıtım mesajı
 * göstərilir; ödənişli abunə açılanda qiymətlər görünür, checkout isə ayrıca bayraqdır.
 */
export function pricingMode(flags: { MONETIZATION_ENABLED: boolean; PAID_SUBSCRIPTIONS_ENABLED: boolean; PAYMENT_CHECKOUT_ENABLED: boolean }) {
  if (!flags.MONETIZATION_ENABLED || !flags.PAID_SUBSCRIPTIONS_ENABLED) return { promo: true, showPrices: false, checkout: false } as const;
  return { promo: false, showPrices: true, checkout: flags.PAYMENT_CHECKOUT_ENABLED } as const;
}
