import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { getSubscriptionPlans } from "@/lib/subscriptions/plans";
import {
  CAPABILITY_LEVELS,
  DEFAULT_PLAN_CAPABILITIES,
  PLAN_CAPABILITIES,
  PLAN_CODES,
  durationSavingsPercent,
  parseLimitInput,
  parsePlanDescription,
  parsePlanCapabilities,
  parsePlanLimits,
  parsePriceInput,
  pricingMode,
} from "@/lib/subscriptions/plan-policy";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/feature-flags-policy";
import az from "@/i18n/locales/az/phase3.json";
import en from "@/i18n/locales/en/phase3.json";
import ru from "@/i18n/locales/ru/phase3.json";

/** Abunə planları (#244, PRD 16.1–16.4): saf qaydalar və migration-un yaratdığı planlar real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;

describe("plan qaydaları", () => {
  it("PRD 16.2 cədvəli: imkanlar plan üzrə azalmır, hər səviyyənin tərcüməsi var", () => {
    for (const capability of PLAN_CAPABILITIES) {
      const ranks = PLAN_CODES.map((code) => CAPABILITY_LEVELS[DEFAULT_PLAN_CAPABILITIES[code][capability]]);
      expect([...ranks].sort((a, b) => a - b), capability).toEqual(ranks);
    }
    for (const catalog of [az, en, ru]) {
      for (const level of Object.keys(CAPABILITY_LEVELS)) expect((catalog.plans.levels as Record<string, string>)[level]).toBeTruthy();
      for (const capability of PLAN_CAPABILITIES) expect((catalog.plans.capabilities as Record<string, string>)[capability]).toBeTruthy();
    }
    expect(az.plans.promo).toBe("LuxeHomeEstate hazırda tanıtım mərhələsindədir. Aktiv xidmətlər müvəqqəti olaraq ödənişsiz təqdim edilir.");
  });

  it("pozulmuş JSON defolta, naməlum səviyyə və mənfi limit atılır", () => {
    expect(parsePlanCapabilities("{pozuq", "PRO")).toEqual(DEFAULT_PLAN_CAPABILITIES.PRO);
    expect(parsePlanCapabilities(JSON.stringify({ CRM: "FULL", EXPORT: "MEGA" }), "BASIC")).toMatchObject({ CRM: "FULL", EXPORT: "LIMITED" });
    expect(parsePlanLimits(JSON.stringify({ agents: 5, crmClients: -1, activeListings: 1.5 }))).toEqual({ activeListings: null, agents: 5, crmClients: null, exportsPerMonth: null });
  });

  it("forma sahələri: qiymət qəpiyə, boş — tarif yoxdur, səhv — xəta", () => {
    expect(parsePriceInput("12,5")).toBe(1250);
    expect(parsePriceInput("19.99")).toBe(1999);
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("abc")).toBeUndefined();
    expect(parsePriceInput("1.234")).toBeUndefined();
    expect(parseLimitInput(" 10 ")).toBe(10);
    expect(parseLimitInput("")).toBeNull();
    expect(parseLimitInput("-3")).toBeUndefined();
    expect(durationSavingsPercent(1000, 2700, 3)).toBe(10);
    expect(durationSavingsPercent(1000, 3000, 3)).toBeNull();
    expect(durationSavingsPercent(null, 2700, 3)).toBeNull();
  });

  it("plan təsviri dil üzrədir; köhnə düz mətn AZ sayılır, boş dil kataloq şüarına qalır", () => {
    expect(parsePlanDescription(JSON.stringify({ az: "Əsas", en: " ", ru: "Базовый" }))).toEqual({ az: "Əsas", ru: "Базовый" });
    expect(parsePlanDescription("Köhnə mətn")).toEqual({ az: "Köhnə mətn" });
    expect(parsePlanDescription(null)).toEqual({});
  });

  it("tanıtım mərhələsi: defolt bayraqlarda qiymət yox, ödəniş yox", () => {
    expect(pricingMode(DEFAULT_FEATURE_FLAGS)).toEqual({ promo: true, showPrices: false, checkout: false });
    expect(pricingMode({ ...DEFAULT_FEATURE_FLAGS, MONETIZATION_ENABLED: true })).toMatchObject({ promo: true });
    expect(pricingMode({ ...DEFAULT_FEATURE_FLAGS, MONETIZATION_ENABLED: true, PAID_SUBSCRIPTIONS_ENABLED: true })).toEqual({ promo: false, showPrices: true, checkout: false });
  });
});

describe("planların oxunması", () => {
  it("migration hər auditoriya üçün Basic/Pro/Premium yaradır; deaktiv plan və tarif ictimai siyahıya düşmür", async () => {
    const plans = await getSubscriptionPlans();
    expect(plans.map((plan) => `${plan.audience}:${plan.code}`)).toEqual([
      "AGENCY:BASIC", "AGENCY:PRO", "AGENCY:PREMIUM", "INDIVIDUAL:BASIC", "INDIVIDUAL:PRO", "INDIVIDUAL:PREMIUM",
    ]);
    expect(plans.every((plan) => plan.trialDays === 15 && plan.prices.length === 0)).toBe(true);
    expect(plans[1].capabilities).toEqual(DEFAULT_PLAN_CAPABILITIES.PRO);

    await DB.batch([
      DB.prepare('UPDATE "SubscriptionPlan" SET "isActive" = 0 WHERE "id" = \'plan_premium_agency\''),
      DB.prepare('INSERT INTO "SubscriptionPlanPrice" ("id", "planId", "months", "priceMinor", "updatedAt") VALUES (\'pp1\', \'plan_pro_agency\', 1, 2000, CURRENT_TIMESTAMP), (\'pp2\', \'plan_pro_agency\', 12, 20000, CURRENT_TIMESTAMP), (\'pp3\', \'plan_pro_agency\', 7, 1, CURRENT_TIMESTAMP)'),
      DB.prepare('INSERT INTO "SubscriptionPlanPrice" ("id", "planId", "months", "priceMinor", "isActive", "updatedAt") VALUES (\'pp4\', \'plan_pro_agency\', 3, 5000, 0, CURRENT_TIMESTAMP)'),
    ]);
    const agency = await getSubscriptionPlans({ audience: "AGENCY" });
    expect(agency.map((plan) => plan.code)).toEqual(["BASIC", "PRO"]);
    // Dəstəklənməyən müddət (7) və deaktiv tarif atılır.
    expect(agency[1].prices.map((price) => price.months)).toEqual([1, 12]);
    const all = await getSubscriptionPlans({ audience: "AGENCY", includeInactive: true });
    expect(all).toHaveLength(3);
    expect(all[1].prices.map((price) => price.months)).toEqual([1, 3, 12]);
  });
});
