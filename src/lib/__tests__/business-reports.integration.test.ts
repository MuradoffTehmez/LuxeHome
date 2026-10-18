import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { getBusinessIndicators, getGeographicReports, getPlatformAnalytics, REPORT_MONTHS } from "@/lib/admin/business-reports";
import { median, monthlyRecurringMinor, monthWindows, percent } from "@/lib/admin/business-reports-math";

/** Hesabatlar və biznes analitikası (#262, PRD Modul 20). */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date();
const iso = now.toISOString();
const today = iso.slice(0, 10);

describe("hesabat köməkçiləri", () => {
  it("ay sərhədləri Bakı vaxtı ilədir", () => {
    // 31 oktyabr 21:00 UTC Bakıda artıq 1 noyabrdır.
    const windows = monthWindows(2, new Date("2026-10-31T21:00:00Z"));
    expect(windows.map((window) => window.key)).toEqual(["2026-10", "2026-11"]);
    expect(windows[1].start.toISOString()).toBe("2026-10-31T20:00:00.000Z");
    expect(monthWindows(3, new Date("2026-01-10T10:00:00Z")).map((window) => window.key)).toEqual(["2025-11", "2025-12", "2026-01"]);
  });

  it("median, faiz və MRR", () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(percent(1, 0)).toBeNull();
    expect(percent(1, 3)).toBe(33.3);
    expect(monthlyRecurringMinor([{ amountMinor: 12_000, months: 12 }, { amountMinor: 3000, months: 1 }])).toBe(4000);
  });
});

beforeAll(async () => {
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "area", "typeId", "cityId", "createdAt", "updatedAt")
     VALUES (?, 'Elan', ?, 'Təsvir', 'x', ?, 'PUBLISHED', ?, 50, 'br-type', 'br-city', ?, ?)`,
  );
  await DB.batch([
    DB.prepare(`INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES ('br-type', 'Mənzil', 'menzil', 'br-menzil')`),
    DB.prepare(`INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES ('br-city', 'Hesabatabad', 'hesabatabad', 'br-city', 'CITY', NULL, 0)`),
    ...[1, 2, 3, 4, 5].map((n) => property.bind(`br-sale-${n}`, `br-sale-${n}`, "SALE", n * 50_000, iso, iso)),
    property.bind("br-rent-1", "br-rent-1", "RENT", 800, iso, iso),
    DB.prepare(`INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES ('br-user', 'Ziyarətçi', 'br@example.test', 'disabled', 'EDITOR', 'OWNER', ?, ?)`).bind(iso, iso),
    DB.prepare(`INSERT INTO "Session" ("id", "userId", "createdAt", "expiresAt", "lastSeenAt", "authKind") VALUES ('br-session', 'br-user', ?, ?, ?, 'PUBLIC')`).bind(iso, new Date(now.getTime() + 86_400_000).toISOString(), iso),
    DB.prepare(`INSERT INTO "SavedSearch" ("id", "userId", "name", "filters", "createdAt") VALUES ('br-search', 'br-user', 'Axtarış', '{"citySlug":"br-city"}', ?)`).bind(iso),
    DB.prepare(`INSERT INTO "SavedSearch" ("id", "userId", "name", "filters", "createdAt") VALUES ('br-search-bad', 'br-user', 'Pozuq', 'not-json', ?)`).bind(iso),
    DB.prepare(`INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views") VALUES ('br-sale-1', ?, 7)`).bind(today),
  ]);
});

describe("hesabatlar", () => {
  it("platforma analitikası aktiv istifadəçini və aylıq dinamikanı sayır", async () => {
    const data = await getPlatformAnalytics(now);
    expect(data.dau).toBeGreaterThanOrEqual(1);
    expect(data.mau).toBeGreaterThanOrEqual(data.dau);
    expect(data.monthly).toHaveLength(REPORT_MONTHS);
    const current = data.monthly[data.monthly.length - 1];
    expect(current.registrations).toBeGreaterThanOrEqual(1);
    expect(current.newListings).toBeGreaterThanOrEqual(6);
  });

  it("ödəniş söndürülüdürsə gəlir «aktiv deyil» və sıfırdır", async () => {
    const data = await getBusinessIndicators(now);
    expect(data.revenueActive).toBe(false);
    expect(data.mrrMinor).toBe(0);
    expect(data.arrMinor).toBe(0);
    expect(Object.keys(data.byPlan)).toEqual(["BASIC", "PRO", "PREMIUM"]);
  });

  it("coğrafi hesabat şəhər, axtarış, növ marağı və qiymət trendini verir", async () => {
    const data = await getGeographicReports(now);
    expect(data.cities.find((row) => row.id === "br-city")).toMatchObject({ name: "Hesabatabad", count: 6 });
    expect(data.searchedAreas.find((row) => row.slug === "br-city")).toMatchObject({ name: "Hesabatabad", count: 1 });
    expect(data.typeInterest.find((row) => row.id === "br-type")?.views).toBeGreaterThanOrEqual(7);
    expect(data.sale).toBeGreaterThanOrEqual(5);
    expect(data.rent).toBeGreaterThanOrEqual(1);
    // 5 satış elanı: 1000…5000 AZN/m² → median 3000.
    expect(data.priceTrend[data.priceTrend.length - 1].medianPerSqm).toBe(3000);
  });
});
