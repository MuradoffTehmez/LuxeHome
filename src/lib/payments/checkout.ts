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
  const [plan, buyer] = await Promise.all([
    prisma.subscriptionPlan.findFirst({
      where: { id: input.planId, isActive: true },
      select: { id: true, code: true, audience: true, prices: { where: { months: input.months, isActive: true }, select: { priceMinor: true, currency: true } } },
    }),
    prisma.user.findUnique({ where: { id: input.userId }, select: { agency: { select: { id: true } } } }),
  ]);
  const price = plan?.prices[0];
  if (!plan || !isPlanCode(plan.code) || !price) return { ok: false, reason: "plan" };
  // Agentlik planı yalnız agentlik hesabına — panel təyini ilə eyni qayda.
  if (plan.audience === "AGENCY" && !buyer?.agency) return { ok: false, reason: "plan" };

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
  if (!current) return false;
  // Uğurlu ödənişin icrası (abunə) yarımçıq qalıbsa eyni nəticənin təkrarı yalnız icranı tamamlayır.
  if (current.status === PAYMENT_STATUSES.SUCCEEDED && input.status === PAYMENT_STATUSES.SUCCEEDED && !current.subscriptionId) {
    await fulfillPayment(current, now);
    return true;
  }
  if (!canTransitionPayment(current.status, input.status)) return false;

  const data =
    input.status === PAYMENT_STATUSES.SUCCEEDED ? { status: input.status, invoiceNumber: invoiceNumberFor(current.id, now) }
      : input.status === PAYMENT_STATUSES.FAILED ? { status: input.status, failureReason: input.failureReason ?? null }
        : { status: input.status, refundedAt: now };
  const claimed = await prisma.paymentTransaction.updateMany({ where: { id: current.id, status: current.status }, data });
  if (claimed.count === 0) return false;

  if (input.status === PAYMENT_STATUSES.SUCCEEDED) await fulfillPayment(current, now);
  if (input.status === PAYMENT_STATUSES.REFUNDED && current.subscriptionId) {
    await prisma.subscription.updateMany({
      where: { id: current.subscriptionId, status: { not: SUBSCRIPTION_STATUSES.CANCELLED } },
      data: { status: SUBSCRIPTION_STATUSES.CANCELLED, cancelledAt: now },
    });
  }
  return true;
}

/**
 * Uğurlu ödənişin icrası — idempotent: abunə id-si əməliyyatdan törəyir (`sub_<transactionId>`), ona görə təkrar
 * cəhd ikinci abunə yaratmır, yalnız qalan addımları (əlaqə, endirim istifadəsi) tamamlayır. Atmır deyil —
 * xəta webhook-a qayıdır və provayder təkrar göndərir.
 */
async function fulfillPayment(current: { id: string; userId: string; invoiceData: string | null }, now: Date): Promise<void> {
  const order = JSON.parse(current.invoiceData ?? "{}") as { planId?: string; months?: number; discountCode?: string | null };
  const plan = order.planId ? await prisma.subscriptionPlan.findUnique({ where: { id: order.planId }, select: { id: true, code: true, audience: true } }) : null;
  if (!plan || !order.months) return;
  const subscriptionId = `sub_${current.id}`;
  const existing = await prisma.subscription.findUnique({ where: { id: subscriptionId }, select: { id: true } });
  if (!existing) {
    const buyer = plan.audience === "AGENCY" ? await prisma.user.findUnique({ where: { id: current.userId }, select: { agency: { select: { id: true } } } }) : null;
    await prisma.subscription.create({
      data: {
        id: subscriptionId, userId: current.userId, agencyId: buyer?.agency?.id ?? null, planId: plan.id, planCode: plan.code, audience: plan.audience, months: order.months,
        status: SUBSCRIPTION_STATUSES.ACTIVE, source: SUBSCRIPTION_SOURCES.PAYMENT, startsAt: now, endsAt: subscriptionEndsAt(now, order.months),
        discountCode: order.discountCode ?? null,
      },
    }).catch((error: unknown) => {
      if (!isUniqueViolation(error)) throw error;
    });
  }
  // Endirim istifadəsi yalnız əlaqə ilk dəfə yazılanda artır — təkrar icra sayğacı şişirtmir.
  const linked = await prisma.paymentTransaction.updateMany({ where: { id: current.id, subscriptionId: null }, data: { subscriptionId } });
  if (linked.count > 0 && order.discountCode) {
    await prisma.discountCode.updateMany({ where: { code: order.discountCode }, data: { redemptions: { increment: 1 } } });
  }
}
