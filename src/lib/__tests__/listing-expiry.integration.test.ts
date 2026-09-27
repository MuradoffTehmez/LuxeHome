import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { runListingExpiry } from "@/lib/listing-expiry";

/** Gündəlik elan müddəti işi real D1-də (#109): yalnız sahib elanları, idempotent. */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;
const now = new Date("2026-09-27T12:00:00Z");

async function row(id: string) {
  return DB.prepare('SELECT "status", "listingExpiresAt", "expiryReminderSentAt", "expiredAt" FROM "Property" WHERE "id" = ?').bind(id)
    .first<{ status: string; listingExpiresAt: string | null; expiryReminderSentAt: string | null; expiredAt: string | null }>();
}

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
       "authorId", "listingExpiresAt", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'exp-type', 'exp-city', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("exp-type", "Mənzil", "menzil", "exp-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("exp-city", "Bakı", "baki", "exp-baki", LOCATION_KINDS.CITY),
    user.bind("owner-1", "Sahib", "owner@example.test", "disabled", "EDITOR", "OWNER"),
    user.bind("staff-1", "Əməkdaş", "staff@example.test", "disabled", "ADMIN", "STAFF"),
    property.bind("exp-new", "Təzə", "exp-new", PROPERTY_STATUSES.PUBLISHED, "owner-1", null, new Date(now.getTime() - 5 * DAY).toISOString()),
    property.bind("exp-soon", "Bitmək üzrə", "exp-soon", PROPERTY_STATUSES.PUBLISHED, "owner-1", new Date(now.getTime() + 3 * DAY).toISOString(), now.toISOString()),
    property.bind("exp-over", "Bitib", "exp-over", PROPERTY_STATUSES.PUBLISHED, "owner-1", new Date(now.getTime() - DAY).toISOString(), now.toISOString()),
    property.bind("exp-staff", "Şirkət", "exp-staff", PROPERTY_STATUSES.PUBLISHED, "staff-1", null, now.toISOString()),
  ]);
});

describe("gündəlik elan müddəti işi", () => {
  it("müddət yazır, xatırladır, bitəni arxivləyir; şirkət elanına toxunmur", async () => {
    const result = await runListingExpiry(now);
    expect(result).toMatchObject({ backfilled: 1, reminded: 1, expired: 1, expiredIds: ["exp-over"] });

    expect((await row("exp-new"))?.listingExpiresAt).not.toBeNull();
    expect((await row("exp-soon"))?.expiryReminderSentAt).not.toBeNull();
    expect(await row("exp-over")).toMatchObject({ status: PROPERTY_STATUSES.ARCHIVED });
    expect((await row("exp-over"))?.expiredAt).not.toBeNull();
    expect(await row("exp-staff")).toMatchObject({ status: PROPERTY_STATUSES.PUBLISHED, listingExpiresAt: null });

    // İkinci işə salma heç nəyi təkrarlamır.
    await expect(runListingExpiry(now)).resolves.toMatchObject({ backfilled: 0, reminded: 0, expired: 0 });
  });
});
