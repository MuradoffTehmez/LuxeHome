import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES, REPORT_REASONS, REPORT_STATUSES } from "@/lib/constants";
import { getReportGroups, submitListingReport } from "@/lib/listing-reports";
import { countOwnListings, handOverListings } from "@/lib/accounts/agency-listings";
import { activeOfferWhere, getClosedDeals } from "@/lib/agency-profile";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/revalidate-public", () => ({ revalidatePublicContent: vi.fn() }));

/** Şikayət, elan təhvili və bağlanmış sövdələşmələr real D1-də (#159). */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
       "authorId", "closedAt", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', ?, ?, 1000, 'rep-type', 'rep-city', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
  );
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 400 * DAY).toISOString();
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("rep-type", "Mənzil", "menzil", "rep-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("rep-city", "Bakı", "baki", "rep-baki", LOCATION_KINDS.CITY),
    user.bind("rep-agent", "Agent", "rep-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("rep-owner", "Agentlik", "rep-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    property.bind("rep-live", "Aktiv", "rep-live", "SALE", PROPERTY_STATUSES.PUBLISHED, "rep-agent", null, now),
    property.bind("rep-draft", "Qaralama", "rep-draft", "SALE", PROPERTY_STATUSES.DRAFT, "rep-agent", null, now),
    property.bind("rep-sold", "Satılıb", "rep-sold", "SALE", PROPERTY_STATUSES.SOLD, "rep-agent", now, now),
    property.bind("rep-rented", "İcarədə", "rep-rented", "RENT", PROPERTY_STATUSES.RENTED, "rep-agent", null, now),
    // 12 aydan köhnə bağlanmış elan statistikaya düşmür.
    property.bind("rep-sold-old", "Köhnə satış", "rep-sold-old", "SALE", PROPERTY_STATUSES.SOLD, "rep-agent", old, old),
  ]);
});

describe("elan şikayəti", () => {
  it("ictimai elana şikayət yazır, eyni IP-dən 24 saat ərzində təkrarı süzür", async () => {
    const base = { propertyId: "rep-live", reason: REPORT_REASONS.FRAUD, message: "Beh istədilər", userId: null };
    await expect(submitListingReport({ ...base, ip: "203.0.113.1" })).resolves.toBe("created");
    await expect(submitListingReport({ ...base, ip: "203.0.113.1" })).resolves.toBe("duplicate");
    await expect(submitListingReport({ ...base, reason: REPORT_REASONS.SOLD, message: null, ip: "203.0.113.2" })).resolves.toBe("created");

    const stored = await DB.prepare('SELECT "reporterKey" FROM "ListingReport" WHERE "propertyId" = ?').bind("rep-live").all<{ reporterKey: string }>();
    // Xam IP saxlanmır — yalnız heş.
    expect(stored.results.every((row) => /^[0-9a-f]{64}$/.test(row.reporterKey))).toBe(true);
  });

  it("qaralama və ya mövcud olmayan elana şikayət qəbul olunmur", async () => {
    const input = { reason: REPORT_REASONS.FAKE, message: null, ip: "203.0.113.3", userId: null };
    await expect(submitListingReport({ ...input, propertyId: "rep-draft" })).resolves.toBe("notFound");
    await expect(submitListingReport({ ...input, propertyId: "yoxdur" })).resolves.toBe("notFound");
  });

  it("admin növbəsi şikayətləri elan üzrə qruplaşdırır", async () => {
    const groups = await getReportGroups(REPORT_STATUSES.OPEN);
    const group = groups.find((item) => item.property.id === "rep-live");
    expect(group?.count).toBe(2);
    await expect(getReportGroups(REPORT_STATUSES.RESOLVED)).resolves.toEqual([]);
  });
});

describe("bağlanmış sövdələşmələr və aktiv təkliflər", () => {
  it("son 12 ayın satış/icarəsini sayır, aktiv təklif yalnız dərcdə olanlardır", async () => {
    const deals = await getClosedDeals({ authorId: "rep-agent" });
    expect(deals.stats).toEqual({ total: 2, sold: 1, rented: 1 });
    expect(deals.recent.map((item) => item.id).sort()).toEqual(["rep-rented", "rep-sold"]);

    const active = await prisma.property.findMany({ where: { ...(await activeOfferWhere()), authorId: "rep-agent" }, select: { id: true } });
    expect(active.map((item) => item.id)).toEqual(["rep-live"]);
  });
});

describe("agent komandadan çıxanda elan təhvili", () => {
  it("silinməmiş bütün elanları yeni müəllifə keçirir", async () => {
    const before = await countOwnListings(["rep-agent", "rep-owner"]);
    expect(before.get("rep-agent")).toBe(5);
    expect(before.get("rep-owner")).toBeUndefined();

    await expect(handOverListings("rep-agent", "rep-owner")).resolves.toBe(5);
    const after = await countOwnListings(["rep-agent", "rep-owner"]);
    expect(after.get("rep-agent")).toBeUndefined();
    expect(after.get("rep-owner")).toBe(5);
  });
});
