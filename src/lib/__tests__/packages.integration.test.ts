import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PACKAGE_ORDER_STATUSES, PAYMENT_METHODS, PROPERTY_STATUSES } from "@/lib/constants";
import { activateOrder, cancelOrder, createCabinetOrder, markOrderPaid, refundOrder } from "@/lib/packages";

/**
 * Premium paket axını real D1-də (#109): tranzaksiya olmadığı üçün status keçidləri
 * şərti `updateMany` ilə qorunur — ikinci təsdiq premiumu təkrar uzatmamalıdır.
 */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;
const now = new Date("2026-10-10T12:00:00.000Z");
const owner = { id: "pkg-owner", name: "Sahib", phone: "+994500000000" };

async function premium(id: string) {
  const row = await DB.prepare('SELECT "isFeatured", "featuredUntil" FROM "Property" WHERE "id" = ?').bind(id)
    .first<{ isFeatured: number; featuredUntil: string | null }>();
  return { isFeatured: row?.isFeatured === 1, featuredUntil: row?.featuredUntil ? new Date(row.featuredUntil).getTime() : null };
}

async function orderStatus(id: string) {
  return (await DB.prepare('SELECT "status" FROM "PackageOrder" WHERE "id" = ?').bind(id).first<{ status: string }>())?.status;
}

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
       "authorId", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'pkg-type', 'pkg-city', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const pkg = DB.prepare('INSERT INTO "ListingPackage" ("id", "name", "durationDays", "priceMinor", "isActive", "updatedAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("pkg-type", "Mənzil", "menzil", "pkg-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("pkg-city", "Bakı", "baki", "pkg-baki", LOCATION_KINDS.CITY),
    user.bind(owner.id, owner.name, "pkg-owner@example.test", "disabled", "EDITOR", "OWNER"),
    user.bind("pkg-other", "Başqası", "pkg-other@example.test", "disabled", "EDITOR", "OWNER"),
    user.bind("pkg-staff", "Menecer", "pkg-staff@example.test", "disabled", "ADMIN", "STAFF"),
    property.bind("pkg-live", "Dərc olunub", "pkg-live", PROPERTY_STATUSES.PUBLISHED, owner.id),
    property.bind("pkg-draft", "Qaralama", "pkg-draft", PROPERTY_STATUSES.PENDING, owner.id),
    property.bind("pkg-foreign", "Başqasının", "pkg-foreign", PROPERTY_STATUSES.PUBLISHED, "pkg-other"),
    pkg.bind("pkg-7", "Premium 7 gün", 7, 990, 1),
    pkg.bind("pkg-off", "Köhnə", 3, 500, 0),
  ]);
});

describe("premium paket sifarişi", () => {
  it("yalnız öz dərc olunmuş elanına və satışdakı paketə sifariş qəbul edir", async () => {
    await expect(createCabinetOrder({ user: owner, propertyId: "pkg-foreign", packageId: "pkg-7" })).resolves.toEqual({ ok: false, reason: "property-unavailable" });
    await expect(createCabinetOrder({ user: owner, propertyId: "pkg-draft", packageId: "pkg-7" })).resolves.toEqual({ ok: false, reason: "property-unavailable" });
    await expect(createCabinetOrder({ user: owner, propertyId: "pkg-live", packageId: "pkg-off" })).resolves.toEqual({ ok: false, reason: "package-inactive" });
  });

  it("ödənişdə premiumu bir dəfə tətbiq edir, geri qaytarmada müddəti çıxır", async () => {
    const created = await createCabinetOrder({ user: owner, propertyId: "pkg-live", packageId: "pkg-7" });
    if (!created.ok) throw new Error(created.reason);
    expect(created.amountMinor).toBe(990);
    // Eyni elan + paket üçün ikinci gözləyən sifariş qəbul olunmur.
    await expect(createCabinetOrder({ user: owner, propertyId: "pkg-live", packageId: "pkg-7" })).resolves.toEqual({ ok: false, reason: "duplicate-pending" });

    const payment = { method: PAYMENT_METHODS.CASH, reference: "Q-1" };
    await expect(markOrderPaid(created.orderId, payment, "pkg-staff", now)).resolves.toEqual({ ok: true, activated: true });
    expect(await premium("pkg-live")).toEqual({ isFeatured: true, featuredUntil: now.getTime() + 7 * DAY });

    // Təkrar təsdiq və təkrar aktivləşdirmə premiumu ikinci dəfə uzatmır.
    await expect(markOrderPaid(created.orderId, payment, "pkg-staff", now)).resolves.toEqual({ ok: false, reason: "invalid-status" });
    await expect(activateOrder(created.orderId, now)).resolves.toEqual({ ok: false, reason: "invalid-status" });
    expect((await premium("pkg-live")).featuredUntil).toBe(now.getTime() + 7 * DAY);

    await expect(refundOrder(created.orderId, "pkg-staff", now)).resolves.toMatchObject({ ok: true, propertySlug: "pkg-live" });
    expect(await orderStatus(created.orderId)).toBe(PACKAGE_ORDER_STATUSES.REFUNDED);
    expect(await premium("pkg-live")).toEqual({ isFeatured: false, featuredUntil: null });
  });

  it("dərc olunmamış elanın ödənişi aktivləşməni gözlədir, sahib yalnız öz gözləyən sifarişini ləğv edir", async () => {
    await DB.prepare('UPDATE "Property" SET "status" = ? WHERE "id" = ?').bind(PROPERTY_STATUSES.PUBLISHED, "pkg-draft").run();
    const created = await createCabinetOrder({ user: owner, propertyId: "pkg-draft", packageId: "pkg-7" });
    if (!created.ok) throw new Error(created.reason);
    await DB.prepare('UPDATE "Property" SET "status" = ? WHERE "id" = ?').bind(PROPERTY_STATUSES.PENDING, "pkg-draft").run();

    await expect(markOrderPaid(created.orderId, { method: PAYMENT_METHODS.BANK_TRANSFER, reference: null }, "pkg-staff", now)).resolves.toEqual({ ok: true, activated: false });
    expect((await premium("pkg-draft")).isFeatured).toBe(false);

    await DB.prepare('UPDATE "Property" SET "status" = ? WHERE "id" = ?').bind(PROPERTY_STATUSES.PUBLISHED, "pkg-draft").run();
    await expect(activateOrder(created.orderId, now)).resolves.toEqual({ ok: true, propertySlug: "pkg-draft" });
    expect((await premium("pkg-draft")).isFeatured).toBe(true);

    const second = await createCabinetOrder({ user: owner, propertyId: "pkg-live", packageId: "pkg-7" });
    if (!second.ok) throw new Error(second.reason);
    await expect(cancelOrder(second.orderId, "pkg-other", now)).resolves.toEqual({ ok: false, reason: "invalid-status" });
    await expect(cancelOrder(second.orderId, owner.id, now)).resolves.toEqual({ ok: true });
    expect(await orderStatus(second.orderId)).toBe(PACKAGE_ORDER_STATUSES.CANCELLED);
  });
});
