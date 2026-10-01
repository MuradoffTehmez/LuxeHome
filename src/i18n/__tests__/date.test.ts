import { describe, expect, it } from "vitest";

import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedRelative,
  formatLocalizedTime,
  localizedMonthName,
  localizedWeekdayShort,
} from "@/i18n/date";

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
    expect(formatLocalizedDate(null, "az")).toBeNull();
    expect(formatLocalizedDate("", "az")).toBeNull();
  });

  it("qısa, rəqəmli, ay-il və həftə günü üslublarını qurur", () => {
    const value = new Date("2026-09-29T08:30:00.000Z");
    expect(formatLocalizedDate(value, "az", "short")).toBe("29 sen 2026");
    expect(formatLocalizedDate(value, "az", "numeric")).toBe("29.09.2026");
    expect(formatLocalizedDate(value, "az", "monthYear")).toBe("sentyabr 2026");
    expect(formatLocalizedDate(value, "az", "weekday")).toBe("çərşənbə axşamı, 29 sentyabr");
    expect(formatLocalizedDate(value, "ru", "monthYear")).toBe("сентябрь 2026");
    expect(formatLocalizedDate(value, "en", "weekday")).toBe("Tuesday, 29 September");
  });

  it("heç bir dildə «M09» kimi ICU ehtiyat mətni qaytarmır", () => {
    const value = new Date("2026-09-29T08:30:00.000Z");
    for (const locale of ["az", "en", "ru"] as const) {
      for (const style of ["long", "short", "numeric", "monthYear", "weekday"] as const) {
        expect(formatLocalizedDate(value, locale, style)).not.toMatch(/M\d{2}/);
      }
    }
  });

  it("naməlum locale səhifəni sındırmır, Azərbaycan dilinə düşür", () => {
    expect(formatLocalizedDate(new Date("2026-09-29T08:00:00.000Z"), "de" as never)).toBe("29 sentyabr 2026");
    expect(localizedWeekdayShort("de" as never, 1)).toBe("B.e.");
  });

  it("Bakı vaxtı ilə hesablayır: UTC 21:00 artıq növbəti gündür", () => {
    expect(formatLocalizedDate(new Date("2026-09-29T21:00:00.000Z"), "az")).toBe("30 sentyabr 2026");
  });
});

describe("formatLocalizedTime / formatLocalizedDateTime", () => {
  it("vaxtı Bakı saatı ilə 24 saatlıq göstərir", () => {
    expect(formatLocalizedTime(new Date("2026-09-29T10:05:00.000Z"))).toBe("14:05");
    expect(formatLocalizedTime(new Date("2026-09-29T20:00:00.000Z"))).toBe("00:00");
  });

  it("tarix və vaxtı birlikdə qaytarır", () => {
    expect(formatLocalizedDateTime(new Date("2026-09-29T10:05:00.000Z"), "az")).toBe("29 sentyabr 2026, 14:05");
    expect(formatLocalizedDateTime(new Date("2026-09-29T10:05:00.000Z"), "az", "numeric")).toBe("29.09.2026, 14:05");
    expect(formatLocalizedDateTime("pozuq", "az")).toBeNull();
  });
});

describe("formatLocalizedRelative", () => {
  const now = new Date("2026-09-29T12:00:00.000Z");

  it("qısa müddəti nisbi göstərir", () => {
    expect(formatLocalizedRelative(new Date("2026-09-29T11:59:30.000Z"), "az", now)).toBe("indicə");
    expect(formatLocalizedRelative(new Date("2026-09-29T11:15:00.000Z"), "az", now)).toBe("45 dəqiqə əvvəl");
    expect(formatLocalizedRelative(new Date("2026-09-29T09:00:00.000Z"), "az", now)).toBe("3 saat əvvəl");
    expect(formatLocalizedRelative(new Date("2026-09-28T09:00:00.000Z"), "az", now)).toBe("dünən");
    expect(formatLocalizedRelative(new Date("2026-09-24T12:00:00.000Z"), "en", now)).toBe("5 days ago");
  });

  it("30 gündən sonra tam tarixə keçir", () => {
    expect(formatLocalizedRelative(new Date("2026-07-01T12:00:00.000Z"), "az", now)).toBe("1 iyul 2026");
  });
});

describe("təqvim köməkçiləri", () => {
  it("ay və həftə günü adlarını verir", () => {
    expect(localizedMonthName("az", 9)).toBe("sentyabr");
    expect(localizedMonthName("ru", 9)).toBe("сентябрь");
    expect(localizedWeekdayShort("az", 1)).toBe("B.e.");
    expect(localizedWeekdayShort("en", 7)).toBe("Sun");
  });
});
