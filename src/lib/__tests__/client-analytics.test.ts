import { describe, expect, it } from "vitest";
import {
  analyticsRuntimeEnabled,
  sanitizeAnalyticsPayload,
} from "@/lib/client-analytics";

describe("privacy-safe analytics", () => {
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
});
