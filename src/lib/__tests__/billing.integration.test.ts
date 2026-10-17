import { env } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { PAYMENT_STATUSES, SUBSCRIPTION_STATUSES } from "@/lib/constants";
import { SETTING_KEYS } from "@/lib/settings";
import { recordPaymentResult, startSubscriptionCheckout } from "@/lib/payments/checkout";
import { getPaymentProvider, type PaymentProvider } from "@/lib/payments/provider";
import {
  applyDiscount,
  canTransitionPayment,
  effectiveSubscriptionStatus,
  invoiceNumberFor,
  normalizeDiscountCode,
  parseCampaignMessage,
  subscriptionEndsAt,
  trialEndsAt,
} from "@/lib/subscriptions/subscription-policy";
import { getActivePromoCampaign, getSubscriptionReport, grantSubscription } from "@/lib/subscriptions/subscriptions";

/** Abunə, ödəniş arxitekturası, endirim və kampaniya (#246, PRD 16.5, 16.7) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date("2026-10-18T10:00:00Z");

const rule = (patch: Partial<Parameters<typeof applyDiscount>[0]> = {}) => ({
  code: "YAY10", percentOff: 10, amountOffMinor: null, planCodes: null, validFrom: null, validUntil: null, maxRedemptions: null, redemptions: 0, isActive: true, ...patch,
});

describe("abunə qaydaları", () => {
  it("müddət təqvim ayı ilə; qısa ayda son günə düşür; sınaq günləri", () => {
    expect(subscriptionEndsAt(new Date("2026-01-31T00:00:00Z"), 1).toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(subscriptionEndsAt(new Date("2026-03-15T00:00:00Z"), 12).toISOString()).toBe("2027-03-15T00:00:00.000Z");
    expect(trialEndsAt(now, 15)?.toISOString()).toBe("2026-11-02T10:00:00.000Z");
    expect(trialEndsAt(now, 0)).toBeNull();
  });

  it("effektiv status vaxta görə: bitmiş — EXPIRED, sınağı bitmiş — PAST_DUE, ləğv toxunulmaz", () => {
    const later = new Date(now.getTime() + 86_400_000);
    expect(effectiveSubscriptionStatus({ status: "ACTIVE", endsAt: now }, later)).toBe("EXPIRED");
    expect(effectiveSubscriptionStatus({ status: "TRIALING", endsAt: new Date("2027-01-01"), trialEndsAt: now }, later)).toBe("PAST_DUE");
    expect(effectiveSubscriptionStatus({ status: "CANCELLED", endsAt: new Date("2027-01-01") }, later)).toBe("CANCELLED");
  });

  it("ödəniş keçidləri geri çəkilmir; faktura nömrəsi sabitdir", () => {
    expect(canTransitionPayment("PENDING", "SUCCEEDED")).toBe(true);
    expect(canTransitionPayment("SUCCEEDED", "FAILED")).toBe(false);
    expect(canTransitionPayment("FAILED", "SUCCEEDED")).toBe(false);
    expect(canTransitionPayment("SUCCEEDED", "REFUNDED")).toBe(true);
    expect(invoiceNumberFor("cmabcdefgh12345678", now)).toBe("LHE-2026-12345678");
  });

  it("endirim: format, müddət, limit, plan, məbləğ mənfi olmur", () => {
    expect(normalizeDiscountCode(" yay-10 ")).toBe("YAY-10");
    expect(normalizeDiscountCode("a")).toBeNull();
    expect(applyDiscount(rule(), { planCode: "PRO", priceMinor: 5000 }, now)).toEqual({ ok: true, priceMinor: 4500, discountMinor: 500 });
    expect(applyDiscount(rule({ percentOff: null, amountOffMinor: 9000 }), { planCode: "PRO", priceMinor: 5000 }, now)).toEqual({ ok: true, priceMinor: 0, discountMinor: 5000 });
    expect(applyDiscount(rule({ isActive: false }), { planCode: "PRO", priceMinor: 5000 }, now)).toMatchObject({ reason: "inactive" });
    expect(applyDiscount(rule({ validUntil: now }), { planCode: "PRO", priceMinor: 5000 }, now)).toMatchObject({ reason: "expired" });
    expect(applyDiscount(rule({ maxRedemptions: 1, redemptions: 1 }), { planCode: "PRO", priceMinor: 5000 }, now)).toMatchObject({ reason: "exhausted" });
    expect(applyDiscount(rule({ planCodes: JSON.stringify(["PREMIUM"]) }), { planCode: "PRO", priceMinor: 5000 }, now)).toMatchObject({ reason: "plan" });
    expect(parseCampaignMessage(JSON.stringify({ az: "Salam", en: "" }))).toEqual({ az: "Salam", en: "Salam", ru: "Salam" });
    expect(parseCampaignMessage("{}")).toBeNull();
  });
});

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, \'disabled\', \'EDITOR\', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  await DB.batch([
    user.bind("bl-owner", "Sahib", "owner@bl.test", "OWNER"),
    user.bind("bl-agency", "Agentlik", "agency@bl.test", "AGENCY"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "createdAt", "updatedAt") VALUES (\'bl-ag\', \'bl-agency\', \'Agentlik\', \'bl-agentlik\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    DB.prepare('INSERT INTO "SubscriptionPlanPrice" ("id", "planId", "months", "priceMinor", "updatedAt") VALUES (\'bl-price\', \'plan_pro_individual\', 1, 5000, CURRENT_TIMESTAMP)'),
    DB.prepare('INSERT INTO "DiscountCode" ("id", "code", "percentOff", "updatedAt") VALUES (\'bl-dc\', \'YAY10\', 10, CURRENT_TIMESTAMP)'),
  ]);
});

async function setFlags(flags: Record<string, boolean> | null) {
  await DB.prepare('DELETE FROM "Setting" WHERE "key" = ?').bind(SETTING_KEYS.FEATURE_FLAGS).run();
  if (flags) await DB.prepare('INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES (?, ?, CURRENT_TIMESTAMP)').bind(SETTING_KEYS.FEATURE_FLAGS, JSON.stringify(flags)).run();
}
afterEach(() => setFlags(null));

const fakeProvider = (fail = false): PaymentProvider => ({
  id: "fake",
  createCheckout: async (request) => {
    if (fail) throw new Error("provider down");
    return { providerRef: `ref-${request.transactionId}`, redirectUrl: `https://pay.example.test/${request.transactionId}` };
  },
  refund: async () => ({ ok: true }),
});
const paidFlags = { MONETIZATION_ENABLED: true, PAID_SUBSCRIPTIONS_ENABLED: true, SUBSCRIPTIONS: true, PAYMENTS: true, PAYMENT_CHECKOUT_ENABLED: true };
const checkoutInput = { userId: "bl-owner", planId: "plan_pro_individual", months: 1, returnUrl: "https://example.test/paketler" };

describe("ödəniş axını", () => {
  it("defolt (tanıtım) və provayder yoxdursa ödəniş yaranmır", async () => {
    expect(getPaymentProvider()).toBeNull();
    await expect(startSubscriptionCheckout({ ...checkoutInput, idempotencyKey: "k0" }, fakeProvider())).resolves.toEqual({ ok: false, reason: "disabled" });
    await setFlags(paidFlags);
    await expect(startSubscriptionCheckout({ ...checkoutInput, idempotencyKey: "k0" }, null)).resolves.toEqual({ ok: false, reason: "unavailable" });
    await expect(prisma.paymentTransaction.count()).resolves.toBe(0);
  });

  it("idempotent checkout, endirim, uğurlu ödəniş → faktura + abunə, təkrar webhook heç nə etmir, geri ödəniş abunəni ləğv edir", async () => {
    await setFlags(paidFlags);
    const first = await startSubscriptionCheckout({ ...checkoutInput, idempotencyKey: "k1", discountCode: "yay10" }, fakeProvider());
    expect(first).toMatchObject({ ok: true, reused: false });
    const again = await startSubscriptionCheckout({ ...checkoutInput, idempotencyKey: "k1", discountCode: "yay10" }, fakeProvider());
    expect(again).toMatchObject({ ok: true, reused: true });
    expect(await prisma.paymentTransaction.count({ where: { idempotencyKey: "k1" } })).toBe(1);
    const transactionId = first.ok ? first.transactionId : "";
    const tx = await prisma.paymentTransaction.findUniqueOrThrow({ where: { id: transactionId } });
    expect(tx).toMatchObject({ amountMinor: 4500, status: "PENDING", providerRef: `ref-${transactionId}` });

    await expect(recordPaymentResult({ transactionId, status: PAYMENT_STATUSES.SUCCEEDED, now })).resolves.toBe(true);
    await expect(recordPaymentResult({ transactionId, status: PAYMENT_STATUSES.SUCCEEDED, now })).resolves.toBe(false);
    await expect(recordPaymentResult({ transactionId, status: PAYMENT_STATUSES.FAILED, now })).resolves.toBe(false);
    const paid = await prisma.paymentTransaction.findUniqueOrThrow({ where: { id: transactionId }, include: { subscription: true } });
    expect(paid.invoiceNumber).toBe(invoiceNumberFor(transactionId, now));
    expect(paid.subscription).toMatchObject({ status: "ACTIVE", source: "PAYMENT", planCode: "PRO", months: 1, discountCode: "YAY10" });
    expect((await prisma.discountCode.findUniqueOrThrow({ where: { code: "YAY10" } })).redemptions).toBe(1);

    await expect(recordPaymentResult({ transactionId, status: PAYMENT_STATUSES.REFUNDED, now })).resolves.toBe(true);
    expect((await prisma.subscription.findUniqueOrThrow({ where: { id: paid.subscriptionId! } })).status).toBe(SUBSCRIPTION_STATUSES.CANCELLED);
  });

  it("provayder xətası uğursuz ödəniş kimi səbəblə yazılır; səhv endirim kodu ödəniş yaratmır", async () => {
    await setFlags(paidFlags);
    await expect(startSubscriptionCheckout({ ...checkoutInput, idempotencyKey: "k2" }, fakeProvider(true))).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(await prisma.paymentTransaction.findUniqueOrThrow({ where: { idempotencyKey: "k2" } })).toMatchObject({ status: "FAILED", failureReason: "provider down" });
    await expect(startSubscriptionCheckout({ ...checkoutInput, idempotencyKey: "k3", discountCode: "YOXDUR" }, fakeProvider())).resolves.toEqual({ ok: false, reason: "discount" });
    await expect(startSubscriptionCheckout({ ...checkoutInput, months: 6, idempotencyKey: "k4" }, fakeProvider())).resolves.toEqual({ ok: false, reason: "plan" });
  });
});

describe("panel təyini, hesabat və kampaniya", () => {
  it("təyin köhnə aktiv abunəni ləğv edir; agentlik planı yalnız agentliyə; hesabat statusları sayır", async () => {
    const first = await grantSubscription({ actorId: "staff", email: "OWNER@bl.test", planId: "plan_basic_individual", months: 3, withTrial: true, now });
    expect(first.ok).toBe(true);
    const second = await grantSubscription({ actorId: "staff", email: "owner@bl.test", planId: "plan_premium_individual", months: 12, withTrial: false, now });
    expect(second.ok).toBe(true);
    const rows = await prisma.subscription.findMany({ where: { userId: "bl-owner", source: "ADMIN" }, orderBy: { createdAt: "asc" } });
    expect(rows.map((row) => row.status)).toEqual(["CANCELLED", "ACTIVE"]);
    expect(rows[0].trialEndsAt).not.toBeNull();

    await expect(grantSubscription({ actorId: "staff", email: "owner@bl.test", planId: "plan_pro_agency", months: 1, withTrial: false, now })).resolves.toEqual({ ok: false, reason: "audience" });
    await expect(grantSubscription({ actorId: "staff", email: "agency@bl.test", planId: "plan_pro_agency", months: 1, withTrial: false, now })).resolves.toMatchObject({ ok: true });
    expect((await prisma.subscription.findFirstOrThrow({ where: { userId: "bl-agency" } })).agencyId).toBe("bl-ag");
    await expect(grantSubscription({ actorId: "staff", email: "yox@bl.test", planId: "plan_pro_agency", months: 1, withTrial: false, now })).resolves.toEqual({ ok: false, reason: "user" });

    const report = await getSubscriptionReport(now);
    expect(report.byStatus.ACTIVE).toBeGreaterThanOrEqual(2);
    expect(report.byPlan.find((row) => row.key === "INDIVIDUAL:PREMIUM")?.count).toBe(1);
    expect(report.recent[0].user?.email).toBeTruthy();
  });

  it("aktiv kampaniya: müddət daxilində və aktiv olanı qaytarır", async () => {
    const insert = DB.prepare('INSERT INTO "PromoCampaign" ("id", "name", "message", "startsAt", "endsAt", "isActive", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
    await DB.batch([
      insert.bind("pc-old", "Köhnə", JSON.stringify({ az: "Köhnə" }), "2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z", 1),
      insert.bind("pc-off", "Söndürülmüş", JSON.stringify({ az: "Söndürülmüş" }), "2026-10-01T00:00:00Z", "2026-12-01T00:00:00Z", 0),
      insert.bind("pc-live", "Payız", JSON.stringify({ az: "Payız", en: "Autumn" }), "2026-10-10T00:00:00Z", "2026-11-10T00:00:00Z", 1),
    ]);
    await expect(getActivePromoCampaign(now)).resolves.toEqual({ id: "pc-live", message: { az: "Payız", en: "Autumn", ru: "Payız" } });
    await expect(getActivePromoCampaign(new Date("2026-12-15T00:00:00Z"))).resolves.toBeNull();
  });
});
