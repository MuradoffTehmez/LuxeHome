import { describe, expect, it } from "vitest";

import {
  NOTIFICATION_PREFERENCE_DEFAULTS,
  isWithinQuietHours,
  normalizeQuietHour,
  resolveNotificationPreferences,
} from "../notification-preferences";

/** Bakı UTC+4-dədir — testdəki UTC saatı yerli saatdan 4 saat geridədir. */
function bakuTime(hours: number, minutes = 0): Date {
  return new Date(Date.UTC(2026, 7, 30, hours - 4, minutes));
}

describe("bildiriş seçimləri", () => {
  it("sətir olmadıqda sxem defoltlarını qaytarır", () => {
    expect(resolveNotificationPreferences(null)).toEqual(NOTIFICATION_PREFERENCE_DEFAULTS);
  });

  it("yalnız verilmiş açarları üstələyir", () => {
    const values = resolveNotificationPreferences({ savedSearchEmail: false, priceDropPush: true });

    expect(values.savedSearchEmail).toBe(false);
    expect(values.priceDropPush).toBe(true);
    expect(values.savedSearchWeb).toBe(true);
  });

  it("etibarsız vaxt dəyərini null-a çevirir", () => {
    expect(normalizeQuietHour("22:00")).toBe("22:00");
    expect(normalizeQuietHour("24:00")).toBeNull();
    expect(normalizeQuietHour("9:00")).toBeNull();
    expect(normalizeQuietHour("")).toBeNull();
    expect(normalizeQuietHour(undefined)).toBeNull();
  });
});

describe("sakit saatlar", () => {
  it("aralıq verilməyibsə heç vaxt susdurmur", () => {
    expect(isWithinQuietHours(null, null, bakuTime(3))).toBe(false);
    expect(isWithinQuietHours("22:00", null, bakuTime(3))).toBe(false);
  });

  it("gecə yarısını keçən aralığı düzgün hesablayır", () => {
    expect(isWithinQuietHours("22:00", "08:00", bakuTime(23))).toBe(true);
    expect(isWithinQuietHours("22:00", "08:00", bakuTime(3))).toBe(true);
    expect(isWithinQuietHours("22:00", "08:00", bakuTime(22))).toBe(true);
    expect(isWithinQuietHours("22:00", "08:00", bakuTime(8))).toBe(false);
    expect(isWithinQuietHours("22:00", "08:00", bakuTime(12))).toBe(false);
  });

  it("eyni gün ərzindəki aralığı düzgün hesablayır", () => {
    expect(isWithinQuietHours("13:00", "15:00", bakuTime(14))).toBe(true);
    expect(isWithinQuietHours("13:00", "15:00", bakuTime(15))).toBe(false);
    expect(isWithinQuietHours("13:00", "15:00", bakuTime(9))).toBe(false);
  });

  it("başlanğıc və son eynidirsə bütün günü susdurmur", () => {
    expect(isWithinQuietHours("09:00", "09:00", bakuTime(9))).toBe(false);
    expect(isWithinQuietHours("09:00", "09:00", bakuTime(20))).toBe(false);
  });
});
