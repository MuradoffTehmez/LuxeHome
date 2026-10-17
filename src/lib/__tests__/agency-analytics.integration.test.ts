import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { getAgencyAnalytics, median, parseAnalyticsRange, priceBucket } from "@/lib/accounts/agency-analytics";
import { bakuDay } from "@/lib/listing-stats";

/** Agentlik analitikası (#234, PRD 11.1, 11.2, 11.4) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date();
const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, \'disabled\', \'EDITOR\', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "districtId", "authorId", "createdById", "agencyId", "publishedAt", "closedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', ?, ?, ?, 'aa-type', 'aa-city', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
  );
  const lead = DB.prepare('INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "stage", "propertyId", "handlerId", "agencyId", "respondedAt", "createdAt", "updatedAt") VALUES (?, \'M\', \'0500000000\', \'Salam\', \'PROPERTY\', \'NEW\', \'NEW\', ?, ?, \'aa-agency\', ?, ?, CURRENT_TIMESTAMP)');
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (\'aa-type\', \'Mənzil\', \'menzil\', \'aa-menzil\')'),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (\'aa-city\', \'Bakı\', \'baki\', \'aa-baki\', ?, NULL, 0)').bind(LOCATION_KINDS.CITY),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (\'aa-yasamal\', \'Yasamal\', \'yasamal\', \'aa-yasamal\', ?, \'aa-city\', 0)').bind(LOCATION_KINDS.DISTRICT),
    user.bind("aa-owner", "Sahib", "aa-owner@example.test", "AGENCY"),
    user.bind("aa-agent", "Agent", "aa-agent@example.test", "AGENT"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (\'aa-agency\', \'aa-owner\', \'Alfa\', \'aa-alfa\', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    DB.prepare('INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "approvedAt") VALUES (\'aa-e1\', \'aa-agency\', \'aa-agent\', \'AGENT\', \'APPROVED\', CURRENT_TIMESTAMP)'),
    property.bind("aa-p1", "Aktiv", "aa-p1", "SALE", PROPERTY_STATUSES.PUBLISHED, 180000, "aa-yasamal", "aa-agent", "aa-agent", "aa-agency", ago(20), null, ago(5)),
    property.bind("aa-p2", "Satılıb", "aa-p2", "SALE", PROPERTY_STATUSES.SOLD, 400000, "aa-yasamal", "aa-agent", "aa-agent", "aa-agency", ago(40), ago(10), ago(45)),
    property.bind("aa-p3", "Kirayə", "aa-p3", "RENT", PROPERTY_STATUSES.PUBLISHED, 800, null, "aa-owner", "aa-owner", "aa-agency", ago(3), null, ago(3)),
    // Admin tərəfindən «satılıb» yazılmış, amma bağlanma tarixi olmayan elan — təsdiqlənmiş əməliyyat sayılmır.
    property.bind("aa-p4", "Bağlanmasız", "aa-p4", "SALE", PROPERTY_STATUSES.SOLD, 100000, null, "aa-agent", "aa-agent", "aa-agency", ago(30), null, ago(30)),
    lead.bind("aa-l1", "aa-p1", "aa-agent", ago(1), new Date(new Date(ago(1)).getTime() - 20 * 60_000).toISOString()),
    lead.bind("aa-l2", "aa-p1", "aa-agent", null, ago(2)),
    lead.bind("aa-l3", "aa-p3", "aa-owner", ago(0), new Date(now.getTime() - 40 * 60_000).toISOString()),
    DB.prepare('INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views", "contactReveals", "whatsappClicks", "telegramClicks") VALUES (\'aa-p1\', ?, 30, 3, 2, 1)').bind(bakuDay(now)),
    DB.prepare('INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views", "contactReveals", "whatsappClicks", "telegramClicks") VALUES (\'aa-p3\', ?, 10, 1, 0, 0)').bind(bakuDay(now)),
    DB.prepare('INSERT INTO "LeadActivity" ("id", "leadId", "actorId", "actorName", "type", "details") VALUES (\'aa-act\', \'aa-l1\', \'aa-agent\', \'Agent\', \'STAGE\', \'{"from":"CONTACTED","to":"VIEWING_SCHEDULED"}\')'),
    DB.prepare('INSERT INTO "CrmClient" ("id", "agencyId", "ownerId", "name", "searchText", "createdAt", "updatedAt") VALUES (\'aa-c1\', \'aa-agency\', \'aa-agent\', \'Müştəri\', \'musteri\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
  ]);
});

describe("köməkçilər", () => {
  it("interval: hazır dövr, ixtiyari aralıq, yanlış və çox uzun aralıq defolta düşür", () => {
    const fixed = new Date("2026-10-17T08:00:00Z");
    expect(parseAnalyticsRange({ dovr: "7" }, fixed)).toMatchObject({ fromDay: "2026-10-11", toDay: "2026-10-17", days: 7, preset: 7 });
    expect(parseAnalyticsRange({ dan: "2026-09-01", ad: "2026-09-30" }, fixed)).toMatchObject({ fromDay: "2026-09-01", toDay: "2026-09-30", days: 30, preset: null });
    expect(parseAnalyticsRange({ dan: "2026-09-30", ad: "2026-09-01" }, fixed).preset).toBe(30);
    expect(parseAnalyticsRange({ dan: "2024-01-01", ad: "2026-09-01" }, fixed).preset).toBe(30);
    expect(parseAnalyticsRange({ dan: "2026-02-31", ad: "2026-03-05" }, fixed).preset).toBe(30);
  });

  it("median və qiymət intervalı", () => {
    expect(median([])).toBeNull();
    expect(median([30, 10, 20])).toBe(20);
    expect(median([10, 20, 30, 40])).toBe(25);
    expect(priceBucket("SALE", 180_000)).toEqual({ listingType: "SALE", from: 100_000, to: 200_000 });
    expect(priceBucket("RENT", 4_000)).toEqual({ listingType: "RENT", from: 3_500, to: null });
  });
});

describe("agentlik analitikası", () => {
  it("ümumi göstəricilər, agent performansı və ərazilər", async () => {
    const data = await getAgencyAnalytics({ agencyId: "aa-agency", ownerUserId: "aa-owner", range: parseAnalyticsRange({ dovr: "30" }, now), now });
    expect(data.totals).toMatchObject({ totalListings: 4, activeListings: 2, sold: 1, rented: 0, views: 40, clicks: 7, leads: 3, newClients: 1, averageActiveDays: 30 });

    const agent = data.agents.find((row) => row.userId === "aa-agent");
    // aa-p4 «SOLD» olsa da `closedAt` yoxdur — təsdiqlənmiş əməliyyat deyil.
    expect(agent).toMatchObject({ placed: 1, active: 1, leads: 2, responded: 1, responseMinutes: 20, viewings: 1, deals: 1 });
    expect(data.agents.find((row) => row.userId === "aa-owner")).toMatchObject({ isOwner: true, leads: 1, responseMinutes: 40, deals: 0 });

    expect(data.areas[0]).toMatchObject({ name: "Yasamal", leads: 2, views: 30, listings: 1 });
    expect(data.leadTypes).toEqual([{ id: "aa-type", name: "Mənzil", leads: 3 }]);
    expect(data.priceInterest.map((item) => [item.listingType, item.from, item.leads])).toEqual([["RENT", 500, 1], ["SALE", 100000, 2]]);
    expect(data.series).toHaveLength(30);
    expect(data.series.at(-1)).toMatchObject({ views: 40, clicks: 7 });
  });
});
