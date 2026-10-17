import { prisma } from "@/lib/prisma";
import { PAYMENT_KINDS, PAYMENT_STATUSES, SUBSCRIPTION_SOURCES, SUBSCRIPTION_STATUSES, type PaymentStatus } from "@/lib/constants";
import { getFeatureFlags } from "@/lib/feature-flags";
import { isUniqueViolation } from "@/lib/media/upload-record";
import { getPaymentProvider, type PaymentProvider } from "@/lib/payments/provider";
import { isPlanCode, isPlanDuration, pricingMode } from "@/lib/subscriptions/plan-policy";
import {
  applyDiscount,
  canTransitionPayment,
  invoiceNumberFor,
  normalizeDiscountCode,
  subscriptionEndsAt,
} from "@/lib/subscriptions/subscription-policy";

/**
 * Abunə ödənişinin axını (#246, PRD 16.7) — arxitektura, real ödəniş yoxdur.
 *
 * 1. `startSubscriptionCheckout` bayraqları (ödənişli abunə + checkout) və provayderi yoxlayır;
 *    hər hansı biri yoxdursa heç bir yazı olmadan `disabled`/`unavailable` qaytarır.
 * 2. Əməliyyat `idempotencyKey` ilə yazılır — eyni açarla təkrar cəhd mövcud əməliyyatı qaytarır
 *    (iki dəfə ödəniş yaranmır).
 * 3. Provayder nəticəsi `recordPaymentResult` ilə yazılır: keçid şərti `updateMany` ilədir
 *    (D1-də tranzaksiya yoxdur), təkrar webhook statusu geri çəkmir. Uğurlu ödəniş faktura nömrəsi
 *    alır və abunəni aktivləşdirir; uğursuz ödəniş səbəbi saxlanılır; geri ödəniş abunəni ləğv edir.
 */

export type CheckoutResult =
  | { ok: true; transactionId: string; redirectUrl: string | null; reused: boolean }
  | { ok: false; reason: "disabled" | "unavailable" | "plan" | "discount" };

export async function startSubscriptionCheckout(
  input: { userId: string; planId: string; months: number; discountCode?: string | null; idempotencyKey: string; returnUrl: string },
  provider: PaymentProvider | null = getPaymentProvider(),
): Promise<CheckoutResult> {
  const mode = pricingMode(await getFeatureFlags());
  if (!mode.checkout) return { ok: false, reason: "disabled" };
  if (!provider) return { ok: false, reason: "unavailable" };

  const existing = await prisma.paymentTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, userId: true } });
  if (existing) return existing.userId === input.userId ? { ok: true, transactionId: existing.id, redirectUrl: null, reused: true } : { ok: false, reason: "plan" };

  if (!isPlanDuration(input.months)) return { ok: false, reason: "plan" };
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: input.planId, isActive: true },
    select: { id: true, code: true, prices: { where: { months: input.months, isActive: true }, select: { priceMinor: true, currency: true } } },
  });
  const price = plan?.prices[0];
  if (!plan || !isPlanCode(plan.code) || !price) return { ok: false, reason: "plan" };

  let amountMinor = price.priceMinor;
  let discountCode: string | null = null;
  if (input.discountCode) {
    discountCode = normalizeDiscountCode(input.discountCode);
    const rule = discountCode ? await prisma.discountCode.findUnique({ where: { code: discountCode } }) : null;
    const applied = rule ? applyDiscount(rule, { planCode: plan.code, priceMinor: amountMinor }) : null;
    if (!applied?.ok) return { ok: false, reason: "discount" };
    amountMinor = applied.priceMinor;
  }

  let transaction;
  try {
    transaction = await prisma.paymentTransaction.create({
      data: {
        userId: input.userId,
        provider: provider.id,
        idempotencyKey: input.idempotencyKey,
        kind: PAYMENT_KINDS.CHARGE,
        amountMinor,
        currency: price.currency,
        invoiceData: JSON.stringify({ planId: plan.id, planCode: plan.code, months: input.months, discountCode }),
      },
      select: { id: true },
    });
  } catch (error) {
    // Eyni açarla paralel sorğu — birinci yazılan qalır.
    if (!isUniqueViolation(error)) throw error;
    const raced = await prisma.paymentTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true } });
    return raced ? { ok: true, transactionId: raced.id, redirectUrl: null, reused: true } : { ok: false, reason: "unavailable" };
  }

  try {
    const session = await provider.createCheckout({
      transactionId: transaction.id,
      idempotencyKey: input.idempotencyKey,
      amountMinor,
      currency: price.currency,
      description: `${plan.code} · ${input.months}`,
      returnUrl: input.returnUrl,
    });
    await prisma.paymentTransaction.update({ where: { id: transaction.id }, data: { providerRef: session.providerRef } });
    return { ok: true, transactionId: transaction.id, redirectUrl: session.redirectUrl, reused: false };
  } catch (error) {
    await recordPaymentResult({ transactionId: transaction.id, status: PAYMENT_STATUSES.FAILED, failureReason: error instanceof Error ? error.message.slice(0, 200) : "provider" });
    return { ok: false, reason: "unavailable" };
  }
}

/** Provayder nəticəsi (webhook/qayıdış). `false` — keçid icazəli deyil və ya əməliyyat artıq dəyişib. */
export async function recordPaymentResult(input: { transactionId: string; status: PaymentStatus; failureReason?: string | null; now?: Date }): Promise<boolean> {
  const now = input.now ?? new Date();
  const current = await prisma.paymentTransaction.findUnique({
    where: { id: input.transactionId },
    select: { id: true, status: true, userId: true, subscriptionId: true, invoiceData: true },
  });
  if (!current || !canTransitionPayment(current.status, input.status)) return false;

  const data =
    input.status === PAYMENT_STATUSES.SUCCEEDED ? { status: input.status, invoiceNumber: invoiceNumberFor(current.id, now) }
      : input.status === PAYMENT_STATUSES.FAILED ? { status: input.status, failureReason: input.failureReason ?? null }
        : { status: input.status, refundedAt: now };
  const claimed = await prisma.paymentTransaction.updateMany({ where: { id: current.id, status: current.status }, data });
  if (claimed.count === 0) return false;

  if (input.status === PAYMENT_STATUSES.SUCCEEDED) {
    const order = JSON.parse(current.invoiceData ?? "{}") as { planId?: string; planCode?: string; months?: number; discountCode?: string | null };
    const plan = order.planId ? await prisma.subscriptionPlan.findUnique({ where: { id: order.planId }, select: { id: true, code: true, audience: true } }) : null;
    if (plan && order.months) {
      const subscription = await prisma.subscription.create({
        data: {
          userId: current.userId, planId: plan.id, planCode: plan.code, audience: plan.audience, months: order.months,
          status: SUBSCRIPTION_STATUSES.ACTIVE, source: SUBSCRIPTION_SOURCES.PAYMENT, startsAt: now, endsAt: subscriptionEndsAt(now, order.months),
          discountCode: order.discountCode ?? null,
        },
        select: { id: true },
      });
      await prisma.paymentTransaction.update({ where: { id: current.id }, data: { subscriptionId: subscription.id } });
      if (order.discountCode) await prisma.discountCode.updateMany({ where: { code: order.discountCode }, data: { redemptions: { increment: 1 } } });
    }
  }
  if (input.status === PAYMENT_STATUSES.REFUNDED && current.subscriptionId) {
    await prisma.subscription.updateMany({
      where: { id: current.subscriptionId, status: { not: SUBSCRIPTION_STATUSES.CANCELLED } },
      data: { status: SUBSCRIPTION_STATUSES.CANCELLED, cancelledAt: now },
    });
  }
  return true;
}
