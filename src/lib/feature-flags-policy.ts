/**
 * Funksiya bayraqları (#242, PRD 23, 16.6) — saf modul (Prisma yoxdur), həm server, həm admin forması işlədir.
 *
 * Modul açarları platforma funksiyalarını söndürür; monetizasiya açarları PRD 16.6-nın adları ilə
 * saxlanılır. Defoltlar ilkin mərhələyə uyğundur: modullar açıq, ödəniş və abunə bağlı, VIP üçün
 * administrator təsdiqi açıq. Bazadakı dəyər yalnız tanınan açarları üstələyir — pozulmuş JSON və
 * ya naməlum açar defolta qayıdır.
 */

export const FEATURE_FLAGS = {
  // Modullar (PRD 23)
  REPORTS: "REPORTS",
  AUTO_MODERATION: "AUTO_MODERATION",
  AGENCY_ANALYTICS: "AGENCY_ANALYTICS",
  RATINGS: "RATINGS",
  CRM: "CRM",
  VIP_REQUESTS: "VIP_REQUESTS",
  PROMOTION: "PROMOTION",
  SUBSCRIPTIONS: "SUBSCRIPTIONS",
  PAYMENTS: "PAYMENTS",
  NOTIFICATIONS: "NOTIFICATIONS",
  LISTING_FRESHNESS: "LISTING_FRESHNESS",
  EXTRA_VERIFICATION: "EXTRA_VERIFICATION",
  // Monetizasiya (PRD 16.6)
  MONETIZATION_ENABLED: "MONETIZATION_ENABLED",
  PAID_SUBSCRIPTIONS_ENABLED: "PAID_SUBSCRIPTIONS_ENABLED",
  PAYMENT_CHECKOUT_ENABLED: "PAYMENT_CHECKOUT_ENABLED",
  VIP_SELF_SERVICE_ENABLED: "VIP_SELF_SERVICE_ENABLED",
  PROMOTION_SELF_SERVICE_ENABLED: "PROMOTION_SELF_SERVICE_ENABLED",
  ADMIN_APPROVAL_FOR_VIP: "ADMIN_APPROVAL_FOR_VIP",
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
export type FeatureFlags = Record<FeatureFlag, boolean>;

export const MODULE_FLAGS: readonly FeatureFlag[] = [
  "REPORTS", "AUTO_MODERATION", "AGENCY_ANALYTICS", "RATINGS", "CRM", "VIP_REQUESTS", "PROMOTION",
  "SUBSCRIPTIONS", "PAYMENTS", "NOTIFICATIONS", "LISTING_FRESHNESS", "EXTRA_VERIFICATION",
];
export const MONETIZATION_FLAGS: readonly FeatureFlag[] = [
  "MONETIZATION_ENABLED", "PAID_SUBSCRIPTIONS_ENABLED", "PAYMENT_CHECKOUT_ENABLED",
  "VIP_SELF_SERVICE_ENABLED", "PROMOTION_SELF_SERVICE_ENABLED", "ADMIN_APPROVAL_FOR_VIP",
];

/** Kritik açarlar — admin təsdiq dialoqundan dəyişir və audit jurnalında xüsusi qeyd olunur. */
export const CRITICAL_FLAGS: readonly FeatureFlag[] = [
  "PAYMENTS", "SUBSCRIPTIONS", "MONETIZATION_ENABLED", "PAID_SUBSCRIPTIONS_ENABLED", "PAYMENT_CHECKOUT_ENABLED", "AUTO_MODERATION",
];

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  REPORTS: true,
  AUTO_MODERATION: true,
  AGENCY_ANALYTICS: true,
  RATINGS: true,
  CRM: true,
  VIP_REQUESTS: true,
  PROMOTION: true,
  SUBSCRIPTIONS: true,
  PAYMENTS: false,
  NOTIFICATIONS: true,
  LISTING_FRESHNESS: true,
  EXTRA_VERIFICATION: true,
  MONETIZATION_ENABLED: false,
  PAID_SUBSCRIPTIONS_ENABLED: false,
  PAYMENT_CHECKOUT_ENABLED: false,
  VIP_SELF_SERVICE_ENABLED: false,
  PROMOTION_SELF_SERVICE_ENABLED: false,
  ADMIN_APPROVAL_FOR_VIP: true,
};

export function isFeatureFlag(value: unknown): value is FeatureFlag {
  return typeof value === "string" && Object.hasOwn(FEATURE_FLAGS, value);
}

export function parseFeatureFlags(raw: string | null | undefined): FeatureFlags {
  const flags = { ...DEFAULT_FEATURE_FLAGS };
  if (!raw) return flags;
  try {
    const value = JSON.parse(raw) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, enabled] of Object.entries(value)) if (isFeatureFlag(key) && typeof enabled === "boolean") flags[key] = enabled;
    }
  } catch {
    // Pozulmuş dəyər — defolt.
  }
  return flags;
}

/**
 * Asılı açarlar: ödəniş checkout-u ödəniş modulu və monetizasiya olmadan, ödənişli abunə abunə modulu və
 * monetizasiya olmadan işləyə bilməz; özünəxidmət VIP/irəli çəkmə öz modulu olmadan mənasızdır.
 */
export function effectiveFeatureFlags(flags: FeatureFlags): FeatureFlags {
  const effective = { ...flags };
  effective.PAYMENT_CHECKOUT_ENABLED = flags.PAYMENT_CHECKOUT_ENABLED && flags.PAYMENTS && flags.MONETIZATION_ENABLED;
  effective.PAID_SUBSCRIPTIONS_ENABLED = flags.PAID_SUBSCRIPTIONS_ENABLED && flags.SUBSCRIPTIONS && flags.MONETIZATION_ENABLED;
  effective.VIP_SELF_SERVICE_ENABLED = flags.VIP_SELF_SERVICE_ENABLED && flags.VIP_REQUESTS;
  effective.PROMOTION_SELF_SERVICE_ENABLED = flags.PROMOTION_SELF_SERVICE_ENABLED && flags.PROMOTION;
  return effective;
}

/** Audit üçün dəyişiklik siyahısı. */
export function diffFeatureFlags(before: FeatureFlags, after: FeatureFlags): { flag: FeatureFlag; from: boolean; to: boolean }[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlag[]).filter((flag) => before[flag] !== after[flag]).map((flag) => ({ flag, from: before[flag], to: after[flag] }));
}
