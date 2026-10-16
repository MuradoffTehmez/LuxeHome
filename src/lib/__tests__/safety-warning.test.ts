import { describe, expect, it } from "vitest";
import {
  SAFETY_WARNING_MAX,
  normalizeSafetyWarning,
  parseSafetyWarnings,
  serializeSafetyWarnings,
} from "@/lib/safety-warning";
import az from "@/i18n/locales/az/property.json";
import en from "@/i18n/locales/en/property.json";
import ru from "@/i18n/locales/ru/property.json";

/** Əlaqə panelinin beh xəbərdarlığı (#199). */
describe("beh xəbərdarlığı", () => {
  const valid = "Əmlakı görmədən beh və ya depozit ödəməyin.";

  it("boşluqları sıxır, idarə simvollarını atır, hədlərdən kənar mətni rədd edir", () => {
    expect(normalizeSafetyWarning(`  ${valid}\n\t `)).toBe(valid);
    expect(normalizeSafetyWarning("Əmlakı\u0000 görmədən beh və ya depozit ödəməyin.")).toBe(valid);
    expect(normalizeSafetyWarning("qısa")).toBeNull();
    expect(normalizeSafetyWarning("a".repeat(SAFETY_WARNING_MAX + 1))).toBeNull();
    expect(normalizeSafetyWarning(42)).toBeNull();
  });

  it("pozulmuş və ya naməlum dəyər defolt mətnə qayıdır (boş obyekt)", () => {
    expect(parseSafetyWarnings(null)).toEqual({});
    expect(parseSafetyWarnings("{pozuq")).toEqual({});
    expect(parseSafetyWarnings("[]")).toEqual({});
    expect(parseSafetyWarnings(JSON.stringify({ az: valid, en: "qısa", de: valid }))).toEqual({ az: valid });
  });

  it("serializasiya yalnız etibarlı dilləri saxlayır və geri oxunur", () => {
    const json = serializeSafetyWarnings({ az: valid, ru: "   " });
    expect(JSON.parse(json)).toEqual({ az: valid });
    expect(parseSafetyWarnings(json)).toEqual({ az: valid });
  });

  it("defolt kataloq mətni hər dildə var və öz hədlərindən keçir", () => {
    for (const catalog of [az, en, ru]) {
      expect(normalizeSafetyWarning(catalog.safety.contactWarning)).toBe(catalog.safety.contactWarning);
    }
  });
});
