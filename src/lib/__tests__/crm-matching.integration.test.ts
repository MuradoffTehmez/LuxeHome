import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { getCrmContext } from "@/lib/accounts/crm";
import {
  crmMatchesHref,
  duplicateScore,
  findDuplicateClients,
  getCrmMatches,
  hasCrmNeeds,
  mergeCrmClientRecords,
  type CrmNeeds,
} from "@/lib/accounts/crm-matching";
import { prisma } from "@/lib/prisma";

/** Uyğun elanlar və təkrar müraciətlər (#228, PRD 9.3, 9.4) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;

const none: CrmNeeds = {
  listingType: null, typeSlug: null, citySlug: null, districtSlug: null,
  priceMin: null, priceMax: null, areaMin: null, areaMax: null, rooms: null, renovation: null,
};

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, \'disabled\', \'EDITOR\', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const client = DB.prepare('INSERT INTO "CrmClient" ("id", "agencyId", "ownerId", "name", "phone", "phoneKey", "email", "emailKey", "searchText", "priceMin", "rooms", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "rooms", "area", "typeId", "cityId", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', ?, ?, ?, ?, ?, 'cm-type', 'cm-baki', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    user.bind("cm-owner", "Sahib", "cm-owner@example.test", "AGENCY"),
    user.bind("cm-agent", "Agent", "cm-agent@example.test", "AGENT"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (\'cm-agency\', \'cm-owner\', \'Alfa\', \'cm-alfa\', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    DB.prepare('INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "approvedAt") VALUES (\'cm-e1\', \'cm-agency\', \'cm-agent\', \'AGENT\', \'APPROVED\', CURRENT_TIMESTAMP)'),
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (\'cm-type\', \'Mənzil\', \'menzil\', \'cm-menzil\')'),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (\'cm-baki\', \'Bakı\', \'baki\', \'cm-baki\', ?, NULL, 0)').bind(LOCATION_KINDS.CITY),
    client.bind("cm-a", "cm-agency", "cm-owner", "Aysel Məmmədova", "+994501112233", "501112233", null, null, "aysel memmedova 994501112233", null, 3),
    client.bind("cm-b", "cm-agency", "cm-agent", "Aysel Memmedova", "050 111 22 33", "501112233", "aysel@example.test", "aysel@example.test", "aysel memmedova 0501112233 aysel@example.test", 150000, null),
    client.bind("cm-c", "cm-agency", "cm-agent", "Aysel Məmmədova", "0559998877", "559998877", null, null, "aysel memmedova 0559998877", null, null),
    client.bind("cm-d", "cm-agency", "cm-agent", "Tamam başqa", "0703334455", "703334455", null, null, "tamam basqa 0703334455", null, null),
    property.bind("cm-p1", "Yasamalda 3 otaqlı", "cm-p1", "SALE", PROPERTY_STATUSES.PUBLISHED, 180000, 3, 95),
    property.bind("cm-p2", "Bahalı villa", "cm-p2", "SALE", PROPERTY_STATUSES.PUBLISHED, 900000, 3, 300),
    property.bind("cm-p3", "Qaralama", "cm-p3", "SALE", PROPERTY_STATUSES.DRAFT, 170000, 3, 90),
    property.bind("cm-p4", "Kirayə", "cm-p4", "RENT", PROPERTY_STATUSES.PUBLISHED, 1000, 3, 90),
  ]);
  await DB.prepare('INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "clientId", "createdAt", "updatedAt") VALUES (\'cm-lead\', \'Aysel\', \'0501112233\', \'Salam\', \'CONTACT\', \'NEW\', \'cm-b\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').run();
  await DB.prepare('INSERT INTO "CrmClientNote" ("id", "clientId", "authorName", "text") VALUES (\'cm-note\', \'cm-b\', \'Agent\', \'Qeyd\')').run();
});

describe("uyğunluq ehtimalı", () => {
  it("telefon güclü, ad tək başına zəif siqnaldır", () => {
    expect(duplicateScore({ phone: true, email: false, name: false })).toBe(90);
    expect(duplicateScore({ phone: false, email: false, name: true })).toBe(50);
    expect(duplicateScore({ phone: true, email: true, name: true })).toBe(99);
    expect(duplicateScore({ phone: false, email: false, name: false })).toBe(0);
  });

  it("baxanın gördüyü kartlar arasında telefon və diakritikasız adla tapır", async () => {
    const owner = await getCrmContext({ id: "cm-owner", accountType: "AGENCY" });
    const found = await findDuplicateClients(owner, { name: "Aysel Məmmədova", phone: "+994 50 111 22 33" }, "cm-a");
    expect(found.map((item) => [item.id, item.score])).toEqual([["cm-b", 95], ["cm-c", 50]]);
    // Agent yalnız özünə aid kartları görür — sahibin kartı ona təklif olunmur.
    const agent = await getCrmContext({ id: "cm-agent", accountType: "AGENT" });
    const forAgent = await findDuplicateClients(agent, { name: "Aysel Məmmədova", phone: "0501112233" });
    expect(forAgent.map((item) => item.id)).not.toContain("cm-a");
    await expect(findDuplicateClients(owner, { name: "Yo" })).resolves.toEqual([]);
  });
});

describe("uyğun elanlar", () => {
  it("yalnız ictimai elanlar, ehtiyacın bütün meyarları ilə", async () => {
    const needs: CrmNeeds = { ...none, listingType: "SALE", typeSlug: "cm-menzil", citySlug: "cm-baki", priceMax: 250000, rooms: 3 };
    const result = await getCrmMatches(needs);
    expect(result.items.map((item) => item.id)).toEqual(["cm-p1"]);
    expect(result.total).toBe(1);
    expect(hasCrmNeeds(none)).toBe(false);
    await expect(getCrmMatches(none)).resolves.toEqual({ total: 0, items: [] });
    expect(crmMatchesHref(needs)).toBe("/emlaklar?elan=SALE&tip=cm-menzil&seher=cm-baki&max=250000&otaq=3");
  });
});

describe("birləşdirmə", () => {
  it("mənbənin müraciət və qeydləri keçir, boş sahələr dolur, mənbə silinir", async () => {
    const [target, source] = await Promise.all([
      prisma.crmClient.findUniqueOrThrow({ where: { id: "cm-a" } }),
      prisma.crmClient.findUniqueOrThrow({ where: { id: "cm-b" } }),
    ]);
    await mergeCrmClientRecords(target, source);
    const merged = await prisma.crmClient.findUniqueOrThrow({ where: { id: "cm-a" } });
    expect(merged).toMatchObject({ phone: "+994501112233", email: "aysel@example.test", emailKey: "aysel@example.test", priceMin: 150000, rooms: 3 });
    await expect(prisma.crmClient.findUnique({ where: { id: "cm-b" } })).resolves.toBeNull();
    await expect(prisma.lead.findUniqueOrThrow({ where: { id: "cm-lead" }, select: { clientId: true } })).resolves.toEqual({ clientId: "cm-a" });
    await expect(prisma.crmClientNote.findUniqueOrThrow({ where: { id: "cm-note" }, select: { clientId: true } })).resolves.toEqual({ clientId: "cm-a" });
  });
});

describe("geniş ad uyğunluğu", () => {
  it("21 yeni adaş köhnə dəqiq telefon uyğunluğunu sıxışdırıb çıxarmır", async () => {
    const insert = DB.prepare('INSERT INTO "CrmClient" ("id", "agencyId", "ownerId", "name", "phone", "phoneKey", "searchText", "createdAt", "updatedAt") VALUES (?, \'cm-agency\', \'cm-owner\', ?, ?, ?, ?, ?, ?)');
    const old = new Date(Date.now() - 30 * 86_400_000).toISOString();
    await DB.batch([
      insert.bind("cm-old-phone", "Rəşad Quliyev", "0507776655", "507776655", "resad quliyev 0507776655", old, old),
      ...Array.from({ length: 21 }, (_, index) =>
        insert.bind(`cm-namesake-${index}`, "Nigar Səfərova", null, null, "nigar seferova", new Date().toISOString(), new Date().toISOString())),
    ]);
    const owner = await getCrmContext({ id: "cm-owner", accountType: "AGENCY" });
    const found = await findDuplicateClients(owner, { name: "Nigar Səfərova", phone: "+994 50 777 66 55" });
    expect(found[0]).toMatchObject({ id: "cm-old-phone", score: 90 });
  });
});
