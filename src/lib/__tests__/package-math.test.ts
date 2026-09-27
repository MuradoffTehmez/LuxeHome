import { describe, expect, it } from "vitest";
import {
  MAX_PACKAGE_PRICE_MINOR,
  bakuMonthStart,
  extendPremium,
  formatMoneyMinor,
  minorToInput,
  parseMoneyToMinor,
  shrinkPremium,
} from "@/lib/package-math";

const DAY = 86_400_000;
const now = new Date("2026-10-10T12:00:00.000Z");

describe("paket məbləğləri", () => {
  it("vergül və nöqtəli yazılışı qəpiyə çevirir", () => {
    expect(parseMoneyToMinor("9,90")).toBe(990);
    expect(parseMoneyToMinor("9.9")).toBe(990);
    expect(parseMoneyToMinor(" 10 ")).toBe(1000);
    expect(parseMoneyToMinor("0.05")).toBe(5);
  });

  it("mənfi, çox onluqlu, boş və həddən böyük dəyəri rədd edir", () => {
    expect(parseMoneyToMinor("-5")).toBeNull();
    expect(parseMoneyToMinor("9.999")).toBeNull();
    expect(parseMoneyToMinor("")).toBeNull();
    expect(parseMoneyToMinor("abc")).toBeNull();
    expect(parseMoneyToMinor(String(MAX_PACKAGE_PRICE_MINOR / 100 + 1))).toBeNull();
  });

  it("qəpiyi oxunaqlı göstərir və formaya qaytarır", () => {
    expect(formatMoneyMinor(1000)).toBe("10 ₼");
    expect(formatMoneyMinor(990)).toMatch(/^9[.,]90 ₼$/);
    expect(minorToInput(990)).toBe("9.90");
    expect(minorToInput(1000)).toBe("10");
  });
});

describe("premium müddəti", () => {
  it("aktiv premium yoxdursa bu andan sayır", () => {
    const next = extendPremium({ isFeatured: false, featuredUntil: null }, 7, now);
    expect(next).toEqual({ isFeatured: true, featuredUntil: new Date(now.getTime() + 7 * DAY) });
  });

  it("aktiv premiumun üstünə gəlir, bitmiş premiumu isə yenidən başladır", () => {
    const active = new Date(now.getTime() + 3 * DAY);
    expect(extendPremium({ isFeatured: true, featuredUntil: active }, 7, now).featuredUntil).toEqual(new Date(active.getTime() + 7 * DAY));
    const expired = new Date(now.getTime() - DAY);
    expect(extendPremium({ isFeatured: true, featuredUntil: expired }, 7, now).featuredUntil).toEqual(new Date(now.getTime() + 7 * DAY));
  });

  it("müddətsiz premiuma toxunmur", () => {
    const unlimited = { isFeatured: true, featuredUntil: null };
    expect(extendPremium(unlimited, 7, now)).toBe(unlimited);
    expect(shrinkPremium(unlimited, 7, now)).toBe(unlimited);
  });

  it("geri qaytarmada günləri çıxır, qalıq bitibsə premiumu söndürür", () => {
    const until = new Date(now.getTime() + 10 * DAY);
    expect(shrinkPremium({ isFeatured: true, featuredUntil: until }, 7, now)).toEqual({ isFeatured: true, featuredUntil: new Date(now.getTime() + 3 * DAY) });
    expect(shrinkPremium({ isFeatured: true, featuredUntil: until }, 14, now)).toEqual({ isFeatured: false, featuredUntil: null });
  });

  it("ay başlanğıcını Bakı vaxtı ilə hesablayır", () => {
    expect(bakuMonthStart(new Date("2026-09-30T21:00:00.000Z")).toISOString()).toBe("2026-09-30T20:00:00.000Z");
    expect(bakuMonthStart(now).toISOString()).toBe("2026-09-30T20:00:00.000Z");
  });
});
