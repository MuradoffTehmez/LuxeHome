import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ACTIVE_OFFER_STATUSES,
  LOCATION_KINDS,
  MODERATION_HOLD_STATUSES,
  PROPERTY_STATUSES,
  PUBLIC_PROPERTY_STATUSES,
} from "@/lib/constants";
import { resolveLeadProperty } from "@/lib/accounts/listing-leads";
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

  it("müddəti bitmiş elan `EXPIRED` statusu ilə tanınır", () => {
    const now = new Date();
    expect(expiryState({ status: PROPERTY_STATUSES.EXPIRED, listingExpiresAt: now, expiredAt: now }, now.getTime()))
      .toEqual({ state: "expired", daysLeft: 0 });
    // Köhnə forma (`ARCHIVED` + `expiredAt`) miqrasiya 0062 ilə köçürülür, artıq «müddəti bitib» sayılmır.
    expect(expiryState({ status: PROPERTY_STATUSES.ARCHIVED, listingExpiresAt: now, expiredAt: now }, now.getTime())).toBeNull();
  });
});
