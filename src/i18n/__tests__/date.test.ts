import { describe, expect, it } from "vitest";

import { formatLocalizedDate } from "@/i18n/date";

describe("formatLocalizedDate", () => {
  const date = new Date("2026-08-24T00:00:00.000Z");

  it("Azərbaycan dilində ay adını M08 əvəzinə sözlə göstərir", () => {
    expect(formatLocalizedDate(date, "az")).toBe("24 avqust 2026");
  });

  it("digər dillərdə uyğun lokal tarix qaytarır", () => {
    expect(formatLocalizedDate(date, "en")).toBe("24 August 2026");
    expect(formatLocalizedDate(date, "ru")).toBe("24 августа 2026");
  });

  it("etibarsız tarixi susqun buraxır", () => {
    expect(formatLocalizedDate("yanlış tarix", "az")).toBeNull();
  });
});
