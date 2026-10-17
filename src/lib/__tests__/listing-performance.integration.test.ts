import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { bakuDay, pruneUniqueViews, recordUniqueView } from "@/lib/listing-stats";
import { getListingAnalytics, getListingPerformance } from "@/lib/accounts/listing-analytics";
import { prisma } from "@/lib/prisma";

/** Elan performansı: unikal baxış, qiymət dəyişikliyi və elan dinamikası (#236, PRD 11.3) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date();

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, \'disabled\', \'EDITOR\', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (\'lpf-type\', \'Mənzil\', \'menzil\', \'lpf-menzil\')'),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (\'lpf-city\', \'Bakı\', \'baki\', \'lpf-baki\', ?, NULL, 0)').bind(LOCATION_KINDS.CITY),
    user.bind("lpf-owner", "Sahib", "lpf-owner@example.test", "OWNER"),
    user.bind("lpf-other", "Başqa", "lpf-other@example.test", "OWNER"),
    DB.prepare(
      `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "createdAt", "updatedAt")
       VALUES ('lpf-p1', 'Elan', 'lpf-p1', 'Təsvir', 'x', 'SALE', ?, 150000, 'lpf-type', 'lpf-city', 'lpf-owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ).bind(PROPERTY_STATUSES.PUBLISHED),
    DB.prepare('INSERT INTO "PropertyPriceHistory" ("id", "propertyId", "oldPrice", "newPrice") VALUES (\'lpf-ph\', \'lpf-p1\', 160000, 150000)'),
    DB.prepare('INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views", "contactReveals") VALUES (\'lpf-p1\', ?, 5, 2)').bind(bakuDay(now)),
  ]);
});

describe("unikal baxış", () => {
  it("eyni ziyarətçi gündə bir dəfə sayılır, başqa ziyarətçi ayrıca", async () => {
    await expect(recordUniqueView({ propertyId: "lpf-p1", ip: "10.0.0.1", userAgent: "Mozilla/5.0", now })).resolves.toBe(true);
    await expect(recordUniqueView({ propertyId: "lpf-p1", ip: "10.0.0.1", userAgent: "Mozilla/5.0", now })).resolves.toBe(false);
    await expect(recordUniqueView({ propertyId: "lpf-p1", ip: "10.0.0.2", userAgent: "Mozilla/5.0", now })).resolves.toBe(true);
    const stat = await prisma.propertyDailyStat.findUniqueOrThrow({ where: { propertyId_day: { propertyId: "lpf-p1", day: bakuDay(now) } }, select: { uniqueViews: true, views: true } });
    expect(stat).toEqual({ uniqueViews: 2, views: 5 });
    // Açarda xam IP yoxdur.
    const keys = await prisma.propertyUniqueView.findMany({ where: { propertyId: "lpf-p1" }, select: { visitorKey: true } });
    expect(keys.every((key) => !key.visitorKey.includes("10.0.0") && key.visitorKey.length === 32)).toBe(true);
  });

  it("köhnə açarlar təmizlənir, sayğac qalır", async () => {
    await DB.prepare('INSERT INTO "PropertyUniqueView" ("propertyId", "day", "visitorKey") VALUES (\'lpf-p1\', \'2020-01-01\', \'old\')').run();
    // Srağagünkü açar da gedir — yalnız bu gün və dünən saxlanılır.
    const insert = DB.prepare('INSERT INTO "PropertyUniqueView" ("propertyId", "day", "visitorKey") VALUES (?, ?, ?)');
    await insert.bind("lpf-p1", bakuDay(new Date(now.getTime() - 2 * 86_400_000)), "two-days").run();
    await insert.bind("lpf-p1", bakuDay(new Date(now.getTime() - 86_400_000)), "yesterday").run();
    await expect(pruneUniqueViews(now)).resolves.toBe(2);
    await expect(prisma.propertyUniqueView.count({ where: { propertyId: "lpf-p1" } })).resolves.toBe(3);
  });
});

describe("elan performansı", () => {
  it("siyahıda unikal baxış və qiymət dəyişikliyi; ayrıca səhifə yalnız sahibə", async () => {
    const list = await getListingAnalytics({ userId: "lpf-owner", userName: "Sahib", period: 7, now });
    expect(list.totals).toMatchObject({ views: 5, uniqueViews: 2, priceChanges: 1 });
    expect(list.rows[0]).toMatchObject({ id: "lpf-p1", uniqueViews: 2, priceChanges: 1 });

    const detail = await getListingPerformance({ userId: "lpf-owner", propertyId: "lpf-p1", period: 7, now });
    expect(detail?.totals).toMatchObject({ views: 5, uniqueViews: 2, contactReveals: 2, priceChanges: 1 });
    expect(detail?.series).toHaveLength(7);
    expect(detail?.prices[0]).toMatchObject({ oldPrice: 160000, newPrice: 150000 });
    await expect(getListingPerformance({ userId: "lpf-other", propertyId: "lpf-p1", period: 7, now })).resolves.toBeNull();
  });
});
