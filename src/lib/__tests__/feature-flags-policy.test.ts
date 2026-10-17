import { describe, expect, it } from "vitest";
import {
  CRITICAL_FLAGS,
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAGS,
  MODULE_FLAGS,
  MONETIZATION_FLAGS,
  diffFeatureFlags,
  effectiveFeatureFlags,
  parseFeatureFlags,
} from "@/lib/feature-flags-policy";
import { getCabinetItems } from "@/lib/accounts/cabinet-navigation";
import az from "@/i18n/locales/az/admin.json";
import en from "@/i18n/locales/en/admin.json";
import ru from "@/i18n/locales/ru/admin.json";

describe("funksiya bayraqları (#242)", () => {
  it("hər açar tam bir qrupdadır və kataloqda etiketi var", () => {
    const all = Object.values(FEATURE_FLAGS);
    expect([...MODULE_FLAGS, ...MONETIZATION_FLAGS].sort()).toEqual([...all].sort());
    for (const catalog of [az, en, ru]) {
      for (const flag of all) {
        const entry = (catalog.pages.featureFlags.flags as Record<string, { label: string; hint: string }>)[flag];
        expect(entry?.label, flag).toBeTruthy();
        expect(entry?.hint, flag).toBeTruthy();
      }
    }
    for (const flag of CRITICAL_FLAGS) expect(all).toContain(flag);
  });

  it("defoltlar ilkin mərhələyə uyğundur: ödəniş və monetizasiya bağlı, VIP təsdiqi açıq", () => {
    expect(DEFAULT_FEATURE_FLAGS.PAYMENTS).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.MONETIZATION_ENABLED).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.PAYMENT_CHECKOUT_ENABLED).toBe(false);
    expect(DEFAULT_FEATURE_FLAGS.ADMIN_APPROVAL_FOR_VIP).toBe(true);
    expect(DEFAULT_FEATURE_FLAGS.CRM).toBe(true);
  });

  it("pozulmuş JSON, naməlum açar və qeyri-boolean dəyər defolta qayıdır", () => {
    expect(parseFeatureFlags(null)).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(parseFeatureFlags("{pozuq")).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(parseFeatureFlags("[true]")).toEqual(DEFAULT_FEATURE_FLAGS);
    const parsed = parseFeatureFlags(JSON.stringify({ CRM: false, UNKNOWN: true, RATINGS: "no", __proto__: { PAYMENTS: true } }));
    expect(parsed.CRM).toBe(false);
    expect(parsed.RATINGS).toBe(true);
    expect(parsed.PAYMENTS).toBe(false);
    expect(parsed).not.toHaveProperty("UNKNOWN");
  });

  it("asılı açar öz modulu və monetizasiya olmadan işləmir", () => {
    const flags = { ...DEFAULT_FEATURE_FLAGS, PAYMENT_CHECKOUT_ENABLED: true, PAID_SUBSCRIPTIONS_ENABLED: true, VIP_SELF_SERVICE_ENABLED: true, PROMOTION_SELF_SERVICE_ENABLED: true };
    const off = effectiveFeatureFlags({ ...flags, VIP_REQUESTS: false, PROMOTION: false });
    expect(off.PAYMENT_CHECKOUT_ENABLED).toBe(false);
    expect(off.PAID_SUBSCRIPTIONS_ENABLED).toBe(false);
    expect(off.VIP_SELF_SERVICE_ENABLED).toBe(false);
    expect(off.PROMOTION_SELF_SERVICE_ENABLED).toBe(false);

    const on = effectiveFeatureFlags({ ...flags, PAYMENTS: true, MONETIZATION_ENABLED: true });
    expect(on.PAYMENT_CHECKOUT_ENABLED).toBe(true);
    expect(on.PAID_SUBSCRIPTIONS_ENABLED).toBe(true);
    expect(on.VIP_SELF_SERVICE_ENABLED).toBe(true);
  });

  it("diff yalnız dəyişən açarları qaytarır", () => {
    const after = { ...DEFAULT_FEATURE_FLAGS, CRM: false, PAYMENTS: true };
    expect(diffFeatureFlags(DEFAULT_FEATURE_FLAGS, after)).toEqual([
      { flag: "CRM", from: true, to: false },
      { flag: "PAYMENTS", from: false, to: true },
    ]);
    expect(diffFeatureFlags(DEFAULT_FEATURE_FLAGS, DEFAULT_FEATURE_FLAGS)).toEqual([]);
  });

  it("söndürülmüş modulun kabinet menyusu bəndi gizlənir", () => {
    const ids = getCabinetItems(true, true, true, true, false, ["clients", "agency-analytics", "reviews"]).map((item) => item.id);
    expect(ids).not.toContain("clients");
    expect(ids).not.toContain("agency-analytics");
    expect(ids).not.toContain("reviews");
    expect(ids).toContain("leads");
  });
});
