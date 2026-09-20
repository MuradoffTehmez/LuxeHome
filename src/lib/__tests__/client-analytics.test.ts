import { afterEach, describe, expect, it, vi } from "vitest";
import {
  analyticsRuntimeEnabled,
  sanitizeAnalyticsPageLocation,
  sanitizeAnalyticsPayload,
  trackEvent,
} from "@/lib/client-analytics";

describe("privacy-safe analytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("yalnız production, env identifikatoru və explicit consent ilə aktivləşir", () => {
    expect(analyticsRuntimeEnabled({ production: true, measurementId: "G-TEST", consent: true })).toBe(true);
    expect(analyticsRuntimeEnabled({ production: false, measurementId: "G-TEST", consent: true })).toBe(false);
    expect(analyticsRuntimeEnabled({ production: true, measurementId: "", consent: true })).toBe(false);
    expect(analyticsRuntimeEnabled({ production: true, measurementId: "G-TEST", consent: false })).toBe(false);
  });

  it("PII açarı və event allowlist-dən kənar payload-u rədd edir", () => {
    expect(sanitizeAnalyticsPayload("phone_click", { property_id: "p1", placement: "toolbar" })).toEqual({
      property_id: "p1",
      placement: "toolbar",
    });
    expect(sanitizeAnalyticsPayload("phone_click", { phone: "+994501112233" })).toBeNull();
    expect(sanitizeAnalyticsPayload("contact_submit", { email: "x@example.com" })).toBeNull();
    expect(sanitizeAnalyticsPayload("made_up_event", {})).toBeNull();
  });

  it("GA4 page location-dan query və hash hissələrini çıxarır", () => {
    expect(sanitizeAnalyticsPageLocation("https://luxehomeestate.az/az/ai-axtaris?q=telefon%2050#netice")).toBe(
      "https://luxehomeestate.az/az/ai-axtaris",
    );
    expect(sanitizeAnalyticsPageLocation("/az/emlaklar?axtaris=villa#filtr")).toBe("/az/emlaklar");
  });

  it("birbaşa GA4 konfiqurasiyasında təmizlənmiş event-i gtag-ə ötürür", () => {
    const gtag = vi.fn();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");
    vi.stubGlobal("document", { cookie: "analytics_consent=granted" });
    vi.stubGlobal("window", { gtag });

    trackEvent("phone_click", { property_id: "p1", placement: "toolbar" });

    expect(gtag).toHaveBeenCalledWith("event", "phone_click", {
      property_id: "p1",
      placement: "toolbar",
    });
  });
});
