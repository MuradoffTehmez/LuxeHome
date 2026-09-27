import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PACKAGE_ORDER_STATUSES, PAYMENT_METHODS, PROPERTY_STATUSES } from "@/lib/constants";
import { reserveOpenHouseSeat } from "@/lib/open-house";
import { getStaffCalendar } from "@/lib/calendar-events";
import { runListingExpiry } from "@/lib/listing-expiry";
import { activateOrder, markOrderPaid, refundOrder } from "@/lib/packages";

/**
 * PR #112 rəylərinin regressiya testləri real miniflare D1-də (#109):
 * açıq qapı tutumu paralel sorğuda aşılmır, 98-dən çox hadisəli təqvim ilişmir,
 * yenidən dərc olunmuş elan təkrar arxivlənmir, D1 xətasında paket işarəsi geri alınır.
 */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;
const now = new Date("2026-10-10T12:00:00.000Z");

const property = DB.prepare(
  `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
     "authorId", "listingExpiresAt", "expiredAt", "publishedAt", "createdAt", "updatedAt")
   VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'rv-type', 'rv-city', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
);

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("rv-type", "Mənzil", "menzil", "rv-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("rv-city", "Bakı", "baki", "rv-baki", LOCATION_KINDS.CITY),
    user.bind("rv-owner", "Sahib", "rv-owner@example.test", "disabled", "EDITOR", "OWNER"),
    user.bind("rv-staff", "Menecer", "rv-staff@example.test", "disabled", "ADMIN", "STAFF"),
    property.bind("rv-live", "Canlı elan", "rv-live", PROPERTY_STATUSES.PUBLISHED, "rv-owner", null, null, now.toISOString()),
  ]);
});

describe("açıq qapı tutumu", () => {
  it("eyni anda gələn qeydiyyatlar tutumu aşmır, təkrar telefon ikinci dəfə yazılmır", async () => {
    await DB.prepare('INSERT INTO "OpenHouse" ("id", "propertyId", "startsAt", "endsAt", "capacity") VALUES (?, ?, ?, ?, ?)')
      .bind("rv-slot", "rv-live", new Date(now.getTime() + DAY).toISOString(), new Date(now.getTime() + DAY + 3_600_000).toISOString(), 2).run();

    const results = await Promise.all(Array.from({ length: 6 }, (_, index) =>
      reserveOpenHouseSeat({ openHouseId: "rv-slot", name: `Qonaq ${index}`, phone: `+99450000000${index}`, email: null, now })));
    expect(results.filter((result) => result.status === "reserved")).toHaveLength(2);
    expect(results.filter((result) => result.status === "full")).toHaveLength(4);
    const count = await DB.prepare('SELECT COUNT(*) AS n FROM "OpenHouseRegistration" WHERE "openHouseId" = ?').bind("rv-slot").first<{ n: number }>();
    expect(count?.n).toBe(2);

    const reserved = results.findIndex((result) => result.status === "reserved");
    await expect(reserveOpenHouseSeat({ openHouseId: "rv-slot", name: "Təkrar", phone: `+99450000000${reserved}`, email: null, now }))
      .resolves.toEqual({ status: "duplicate" });
  });
});

describe("təqvim", () => {
  it("98-dən çox rezervasiya və slotla ilişmədən bütün hadisələri qaytarır", async () => {
    const statements = [];
    for (let index = 0; index < 130; index++) {
      const id = `rv-cal-${index}`;
      statements.push(property.bind(id, `Elan ${index}`, id, PROPERTY_STATUSES.PUBLISHED, "rv-owner", null, null, now.toISOString()));
      statements.push(DB.prepare(
        `INSERT INTO "Reservation" ("id", "propertyId", "userId", "firstName", "lastName", "phone", "email", "requestedFor", "status", "termsAcceptedAt", "updatedAt")
         VALUES (?, ?, 'rv-owner', 'Ad', 'Soyad', '+994500000000', 'a@example.test', ?, 'REQUESTED', ?, CURRENT_TIMESTAMP)`,
      ).bind(`rv-res-${index}`, id, new Date(now.getTime() + (index % 20) * 3_600_000).toISOString(), now.toISOString()));
      statements.push(DB.prepare('INSERT INTO "OpenHouse" ("id", "propertyId", "startsAt", "endsAt", "capacity") VALUES (?, ?, ?, ?, NULL)')
        .bind(`rv-oh-${index}`, id, new Date(now.getTime() + 2 * DAY).toISOString(), new Date(now.getTime() + 2 * DAY + 3_600_000).toISOString()));
    }
    await DB.batch(statements);

    const events = await getStaffCalendar({ userId: "rv-staff", all: true, from: now, to: new Date(now.getTime() + 7 * DAY) });
    expect(events.filter((event) => event.kind === "reservation" && event.summary.startsWith("Baxış: Elan"))).toHaveLength(130);
    expect(events.filter((event) => event.kind === "openHouse" && event.summary.startsWith("Açıq qapı: Elan"))).toHaveLength(130);
  });
});

describe("elan müddəti", () => {
  it("köhnə müddətlə yenidən dərc olunmuş elanı arxivləmir, təzə müddət verir; 98-dən çox bitəni arxivləyir", async () => {
    await property.bind("rv-republished", "Yenidən dərc", "rv-republished", PROPERTY_STATUSES.PUBLISHED, "rv-owner",
      new Date(now.getTime() - 3 * DAY).toISOString(), new Date(now.getTime() - 2 * DAY).toISOString(), now.toISOString()).run();
    const expiring = [];
    for (let index = 0; index < 110; index++) {
      const id = `rv-exp-${index}`;
      expiring.push(property.bind(id, `Bitən ${index}`, id, PROPERTY_STATUSES.PUBLISHED, "rv-owner", new Date(now.getTime() - DAY).toISOString(), null, now.toISOString()));
    }
    await DB.batch(expiring);

    const result = await runListingExpiry(now);
    expect(result.renewed).toBe(1);
    expect(result.expiredIds).not.toContain("rv-republished");
    const renewed = await DB.prepare('SELECT "status", "expiredAt", "listingExpiresAt" FROM "Property" WHERE "id" = ?').bind("rv-republished")
      .first<{ status: string; expiredAt: string | null; listingExpiresAt: string }>();
    expect(renewed?.status).toBe(PROPERTY_STATUSES.PUBLISHED);
    expect(renewed?.expiredAt).toBeNull();
    expect(new Date(renewed!.listingExpiresAt).getTime()).toBeGreaterThan(now.getTime() + 59 * DAY);

    const archived = await DB.prepare('SELECT COUNT(*) AS n FROM "Property" WHERE "id" LIKE ? AND "status" = ?').bind("rv-exp-%", PROPERTY_STATUSES.ARCHIVED).first<{ n: number }>();
    expect(archived?.n).toBe(110);
  });
});

describe("paket kompensasiyası", () => {
  it("elan yazılışı D1-də uğursuz olanda aktivləşdirmə və geri qaytarma işarəsi geri alınır", async () => {
    await DB.batch([
      DB.prepare('INSERT INTO "ListingPackage" ("id", "name", "durationDays", "priceMinor", "isActive", "updatedAt") VALUES (?, ?, 7, 990, 1, CURRENT_TIMESTAMP)').bind("rv-pkg", "Premium 7 gün"),
      DB.prepare(`INSERT INTO "PackageOrder" ("id", "packageId", "packageName", "durationDays", "amountMinor", "userId", "propertyId", "customerName", "status", "source", "updatedAt")
        VALUES ('rv-order', 'rv-pkg', 'Premium 7 gün', 7, 990, 'rv-owner', 'rv-live', 'Sahib', 'PENDING', 'CABINET', CURRENT_TIMESTAMP)`),
      // Keçici D1 xətasını imitasiya edir: bu elanın premium yazılışı rədd olunur.
      DB.prepare(`CREATE TRIGGER "rv_fail_premium" BEFORE UPDATE OF "featuredUntil" ON "Property"
        WHEN NEW."id" = 'rv-live' BEGIN SELECT RAISE(ABORT, 'imitasiya olunmuş D1 xətası'); END`),
    ]);

    // Ödəniş qeydə alınır, premium isə yazılmır — sifariş «tətbiq gözləyir»də qalır.
    await expect(markOrderPaid("rv-order", { method: PAYMENT_METHODS.CASH, reference: null }, "rv-staff", now)).resolves.toEqual({ ok: true, activated: false });
    const pending = await DB.prepare('SELECT "status", "activatedAt" FROM "PackageOrder" WHERE "id" = ?').bind("rv-order").first<{ status: string; activatedAt: string | null }>();
    expect(pending).toEqual({ status: PACKAGE_ORDER_STATUSES.PAID, activatedAt: null });

    // Xəta aradan qalxanda təkrar cəhd uğurludur.
    await DB.prepare('DROP TRIGGER "rv_fail_premium"').run();
    await expect(activateOrder("rv-order", now)).resolves.toEqual({ ok: true, propertySlug: "rv-live" });

    // Geri qaytarmada premium qısaldılmazsa sifariş «ödənilib»ə qaytarılır.
    await DB.prepare(`CREATE TRIGGER "rv_fail_refund" BEFORE UPDATE OF "featuredUntil" ON "Property"
      WHEN NEW."id" = 'rv-live' BEGIN SELECT RAISE(ABORT, 'imitasiya olunmuş D1 xətası'); END`).run();
    await expect(refundOrder("rv-order", "rv-staff", now)).rejects.toThrow();
    const afterFailedRefund = await DB.prepare('SELECT "status", "refundedAt" FROM "PackageOrder" WHERE "id" = ?').bind("rv-order").first<{ status: string; refundedAt: string | null }>();
    expect(afterFailedRefund).toEqual({ status: PACKAGE_ORDER_STATUSES.PAID, refundedAt: null });
    await DB.prepare('DROP TRIGGER "rv_fail_refund"').run();
    await expect(refundOrder("rv-order", "rv-staff", now)).resolves.toMatchObject({ ok: true });
  });
});
