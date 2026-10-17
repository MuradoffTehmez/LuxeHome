import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
  type PaymentStatus,
  type SubscriptionStatus,
} from "@/lib/constants";
import { isPlanCode, type PlanCode } from "@/lib/subscriptions/plan-policy";

/**
 * Abunə, endirim və ödəniş qaydaları (#246, PRD 16.3, 16.5, 16.7) — saf modul (Prisma yoxdur).
 * Real ödəniş yoxdur; bu qaydalar provayder adapteri qoşulanda da eyni qalır.
 */

const DAY = 86_400_000;

/** Müddət sonu: başlanğıcdan `months` təqvim ayı sonra (ayın günü qısa ayda sonuncu günə düşür). */
export function subscriptionEndsAt(startsAt: Date, months: number): Date {
  const end = new Date(startsAt);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return end;
}

export function trialEndsAt(startsAt: Date, trialDays: number): Date | null {
  return trialDays > 0 ? new Date(startsAt.getTime() + trialDays * DAY) : null;
}

/** Abunənin hazırkı statusu vaxta görə: müddəti bitmiş aktiv/sınaq abunəsi `EXPIRED` sayılır. */
export function effectiveSubscriptionStatus(input: { status: string; endsAt: Date; trialEndsAt?: Date | null }, now = new Date()): SubscriptionStatus {
  const status = input.status as SubscriptionStatus;
  if (status === SUBSCRIPTION_STATUSES.CANCELLED || status === SUBSCRIPTION_STATUSES.EXPIRED) return status;
  if (input.endsAt <= now) return SUBSCRIPTION_STATUSES.EXPIRED;
  if (status === SUBSCRIPTION_STATUSES.TRIALING && input.trialEndsAt && input.trialEndsAt <= now) return SUBSCRIPTION_STATUSES.PAST_DUE;
  return status;
}

export function isActiveSubscriptionStatus(status: string): boolean {
  return (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

/** İcazəli ödəniş keçidləri — təkrar webhook və ya iki dəfə təsdiq statusu geri çəkməsin. */
const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  PENDING: [PAYMENT_STATUSES.SUCCEEDED, PAYMENT_STATUSES.FAILED],
  SUCCEEDED: [PAYMENT_STATUSES.REFUNDED],
  FAILED: [],
  REFUNDED: [],
};
export function canTransitionPayment(from: string, to: PaymentStatus): boolean {
  return (PAYMENT_TRANSITIONS[from as PaymentStatus] ?? []).includes(to);
}

/** Endirim kodu: böyük hərf, rəqəm, `-`/`_`; 3–32 simvol. */
export const DISCOUNT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
export function normalizeDiscountCode(value: unknown): string | null {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return DISCOUNT_CODE_PATTERN.test(code) ? code : null;
}

export type DiscountRule = {
  code: string;
  percentOff: number | null;
  amountOffMinor: number | null;
  planCodes: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  maxRedemptions: number | null;
  redemptions: number;
  isActive: boolean;
};

export type DiscountCheck = { ok: true; priceMinor: number; discountMinor: number } | { ok: false; reason: "inactive" | "notStarted" | "expired" | "exhausted" | "plan" | "invalid" };

export function parsePlanCodeList(raw: string | null): PlanCode[] | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return null;
    const codes = value.filter(isPlanCode);
    return codes.length ? codes : null;
  } catch {
    return null;
  }
}

/** Endirimi qiymətə tətbiq edir; nəticə heç vaxt mənfi olmur. */
export function applyDiscount(rule: DiscountRule, input: { planCode: PlanCode; priceMinor: number }, now = new Date()): DiscountCheck {
  if (!rule.isActive) return { ok: false, reason: "inactive" };
  if (rule.validFrom && rule.validFrom > now) return { ok: false, reason: "notStarted" };
  if (rule.validUntil && rule.validUntil <= now) return { ok: false, reason: "expired" };
  if (rule.maxRedemptions != null && rule.redemptions >= rule.maxRedemptions) return { ok: false, reason: "exhausted" };
  const plans = parsePlanCodeList(rule.planCodes);
  if (plans && !plans.includes(input.planCode)) return { ok: false, reason: "plan" };
  let discount = 0;
  if (rule.percentOff != null && rule.percentOff > 0 && rule.percentOff <= 100) discount = Math.round((input.priceMinor * rule.percentOff) / 100);
  else if (rule.amountOffMinor != null && rule.amountOffMinor > 0) discount = rule.amountOffMinor;
  else return { ok: false, reason: "invalid" };
  discount = Math.min(discount, input.priceMinor);
  return { ok: true, priceMinor: input.priceMinor - discount, discountMinor: discount };
}

/** Faktura nömrəsi: `LHE-<il>-<əməliyyat id-sinin son 8 simvolu>` — əməliyyat başına sabit. */
export function invoiceNumberFor(transactionId: string, at: Date): string {
  return `LHE-${at.getUTCFullYear()}-${transactionId.slice(-8).toUpperCase()}`;
}

export type CampaignMessage = { az: string; en: string; ru: string };
export function parseCampaignMessage(raw: string): CampaignMessage | null {
  try {
    const value = JSON.parse(raw) as Partial<CampaignMessage>;
    if (typeof value?.az !== "string" || !value.az.trim()) return null;
    return { az: value.az, en: typeof value.en === "string" && value.en.trim() ? value.en : value.az, ru: typeof value.ru === "string" && value.ru.trim() ? value.ru : value.az };
  } catch {
    return null;
  }
}
