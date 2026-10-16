import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ACTIVE_OFFER_STATUSES,
  LOCATION_KINDS,
  MODERATION_HOLD_STATUSES,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_SOURCES,
  PUBLIC_PROPERTY_STATUSES,
} from "@/lib/constants";
import { resolveLeadProperty } from "@/lib/accounts/listing-leads";
import { runListingExpiry } from "@/lib/listing-expiry";
import { getPropertyHistory, recordPropertyStatusChange } from "@/lib/property-status-history";
import { expiryState } from "@/lib/listing-expiry-policy";
import { publicPropertyWhere } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

/** Elanın həyat dövrü statusları (#202, PRD v2 Modul 03) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;

beforeAll(async () => {
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
       "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'lc-type', 'lc-city', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("lc-type", "Mənzil", "menzil", "lc-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("lc-city", "Bakı", "baki", "lc-baki", LOCATION_KINDS.CITY),
    ...Object.values(PROPERTY_STATUSES).map((status) => property.bind(`lc-${status}`, status, `lc-${status.toLowerCase()}`, status)),
  ]);
});

describe("elan statusları", () => {
  it("yeni statuslar ictimai deyil — saytda yalnız əvvəlki dörd status görünür", async () => {
    const visible = await prisma.property.findMany({
      where: { ...(await publicPropertyWhere()), id: { startsWith: "lc-" } },
      select: { status: true },
    });
    expect(visible.map((row) => row.status).sort()).toEqual([...PUBLIC_PROPERTY_STATUSES].sort());
    for (const status of MODERATION_HOLD_STATUSES) expect(PUBLIC_PROPERTY_STATUSES).not.toContain(status);
    expect(PUBLIC_PROPERTY_STATUSES).not.toContain(PROPERTY_STATUSES.EXPIRED);
  });

  it("satılmış və kirayəyə verilmiş elan müraciət qəbul etmir, aktiv təklif edir (PRD 5.3)", async () => {
    for (const status of PUBLIC_PROPERTY_STATUSES) {
      const lead = await resolveLeadProperty(`lc-${status}`);
      expect(lead?.closed).toBe(!ACTIVE_OFFER_STATUSES.includes(status));
    }
    // Gizli statuslu elana müraciət ümumiyyətlə bağlanmır.
    await expect(resolveLeadProperty(`lc-${PROPERTY_STATUSES.SUSPENDED}`)).resolves.toBeNull();
  });

  it("status tarixçəsi keçidləri yazır, eyni statusu atlayır, qiymətlə bir xətdə qaytarır (#204)", async () => {
    const id = `lc-${PROPERTY_STATUSES.DRAFT}`;
    await recordPropertyStatusChange({ propertyId: id, from: null, to: PROPERTY_STATUSES.DRAFT, source: PROPERTY_STATUS_SOURCES.ADMIN });
    await recordPropertyStatusChange({ propertyId: id, from: PROPERTY_STATUSES.DRAFT, to: PROPERTY_STATUSES.DRAFT, source: PROPERTY_STATUS_SOURCES.ADMIN });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await recordPropertyStatusChange({
      propertyId: id, from: PROPERTY_STATUSES.PENDING, to: PROPERTY_STATUSES.NEEDS_INFO, source: PROPERTY_STATUS_SOURCES.MODERATION, note: "Şəkilləri yeniləyin",
    });
    await prisma.propertyPriceHistory.create({ data: { propertyId: id, oldPrice: 1000, newPrice: 900, source: "OWNER" } });
    // Mövcud olmayan elan atmır — tarixçə əməliyyatı sındırmamalıdır.
    await expect(recordPropertyStatusChange({ propertyId: "yoxdur", from: null, to: "DRAFT", source: PROPERTY_STATUS_SOURCES.SYSTEM }))
      .resolves.toBeUndefined();

    const history = await getPropertyHistory(id);
    expect(history.map((entry) => entry.kind)).toEqual(["price", "status", "status"]);
    expect(history[1]).toMatchObject({ kind: "status", from: "PENDING", to: "NEEDS_INFO", source: "MODERATION", note: "Şəkilləri yeniləyin" });
    expect(history[2]).toMatchObject({ kind: "status", from: null, to: "DRAFT" });
  });

  it("gündəlik iş paneldəki xatırlatma intervalını işlədir və bitəni tarixçəyə yazır (#204)", async () => {
    const now = new Date();
    const day = 86_400_000;
    await DB.batch([
      DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
        .bind("lc-owner", "Sahib", "lc-owner@example.test", "disabled", "EDITOR", "OWNER"),
      DB.prepare(
        `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
           "authorId", "listingExpiresAt", "publishedAt", "createdAt", "updatedAt")
         VALUES (?, ?, ?, 'T', 'x', 'SALE', 'PUBLISHED', 1000, 'lc-type', 'lc-city', 'lc-owner', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      ).bind("lc-ten", "On gün", "lc-ten", new Date(now.getTime() + 10 * day).toISOString()),
      DB.prepare(
        `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
           "authorId", "listingExpiresAt", "publishedAt", "createdAt", "updatedAt")
         VALUES (?, ?, ?, 'T', 'x', 'SALE', 'PUBLISHED', 1000, 'lc-type', 'lc-city', 'lc-owner', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      ).bind("lc-gone", "Bitib", "lc-gone", new Date(now.getTime() - day).toISOString()),
      DB.prepare('INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES (?, ?, CURRENT_TIMESTAMP)')
        .bind("listing.expiry_config", JSON.stringify({ lifetimeDays: 90, reminderDays: 14 })),
    ]);

    const result = await runListingExpiry(now);
    // Defolt 7 gündə «10 gün qalıb» xatırlatma almazdı; paneldəki 14 gündə alır.
    expect(result.reminded).toBeGreaterThanOrEqual(1);
    const ten = await prisma.property.findUnique({ where: { id: "lc-ten" }, select: { expiryReminderSentAt: true } });
    expect(ten?.expiryReminderSentAt).not.toBeNull();
    expect(result.expiredIds).toContain("lc-gone");
    const [entry] = await getPropertyHistory("lc-gone");
    expect(entry).toMatchObject({ kind: "status", from: "PUBLISHED", to: "EXPIRED", source: "SYSTEM" });
  });

  it("müddəti bitmiş elan `EXPIRED` statusu ilə tanınır", () => {
    const now = new Date();
    expect(expiryState({ status: PROPERTY_STATUSES.EXPIRED, listingExpiresAt: now, expiredAt: now }, now.getTime()))
      .toEqual({ state: "expired", daysLeft: 0 });
    // Köhnə forma (`ARCHIVED` + `expiredAt`) miqrasiya 0062 ilə köçürülür, artıq «müddəti bitib» sayılmır.
    expect(expiryState({ status: PROPERTY_STATUSES.ARCHIVED, listingExpiresAt: now, expiredAt: now }, now.getTime())).toBeNull();
  });
});
