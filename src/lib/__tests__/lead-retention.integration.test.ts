import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { leadRetentionCutoff, purgeExpiredLeads } from "@/lib/lead-retention";
import { LEAD_RETENTION_DAYS, RETENTION_POLICY } from "@/lib/security/retention-policy";

/** Müraciət saxlama müddəti (#287) real D1-də: köhnə qeydlər silinir, təzələri və FK-sız istinadlar qorunur. */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;
const now = new Date();
const iso = now.toISOString();
const old = new Date(now.getTime() - (LEAD_RETENTION_DAYS + 1) * DAY).toISOString();
const almost = new Date(now.getTime() - (LEAD_RETENTION_DAYS - 1) * DAY).toISOString();
/** Bir hissədən (80) çox — partiyalı silmə yoxlanır. */
const OLD_BULK = 170;

beforeAll(async () => {
  const lead = DB.prepare(`INSERT INTO "Lead" ("id", "name", "phone", "message", "createdAt", "updatedAt") VALUES (?, 'Ad', '+994500000000', 'Mesaj', ?, ?)`);
  await DB.batch([
    DB.prepare(`INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES ('lr-type', 'Mənzil', 'menzil', 'lr-menzil')`),
    DB.prepare(`INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES ('lr-city', 'Lr', 'lr', 'lr-city', 'CITY', NULL, 0)`),
    DB.prepare(`INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES ('lr-user', 'Sahib', 'lr@example.test', 'disabled', 'EDITOR', 'AGENCY', ?, ?)`).bind(iso, iso),
    DB.prepare(
      `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "createdAt", "updatedAt") VALUES ('lr-prop', 'Mənzil', 'lr-prop', 'Qısa', 'x', 'SALE', 'PUBLISHED', 1000, 'lr-type', 'lr-city', 'lr-user', ?, ?)`,
    ).bind(iso, iso),
    DB.prepare(`INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES ('lr-agency', 'lr-user', 'Alfa', 'lr-alfa', 1, ?, ?)`).bind(iso, iso),
    lead.bind("lr-old", old, iso),
    lead.bind("lr-almost", almost, almost),
    lead.bind("lr-new", iso, iso),
    DB.prepare(`INSERT INTO "LeadActivity" ("id", "leadId", "actorName", "type", "createdAt") VALUES ('lr-act', 'lr-old', 'Sahib', 'NOTE', ?)`).bind(old),
    DB.prepare(
      `INSERT INTO "AgencyTask" ("id", "agencyId", "title", "assigneeId", "leadId", "createdAt", "updatedAt") VALUES ('lr-task', 'lr-agency', 'Zəng et', 'lr-user', 'lr-old', ?, ?)`,
    ).bind(iso, iso),
    DB.prepare(`INSERT INTO "OpenHouse" ("id", "propertyId", "startsAt", "endsAt", "createdAt") VALUES ('lr-oh', 'lr-prop', ?, ?, ?)`).bind(iso, iso, iso),
    DB.prepare(`INSERT INTO "OpenHouseRegistration" ("id", "openHouseId", "name", "phone", "leadId", "createdAt") VALUES ('lr-reg-old', 'lr-oh', 'Ad', '+994500000001', NULL, ?)`).bind(old),
    DB.prepare(`INSERT INTO "OpenHouseRegistration" ("id", "openHouseId", "name", "phone", "leadId", "createdAt") VALUES ('lr-reg-new', 'lr-oh', 'Ad', '+994500000002', 'lr-old', ?)`).bind(iso),
    DB.prepare(
      `INSERT INTO "Reservation" ("id", "propertyId", "userId", "firstName", "lastName", "phone", "email", "requestedFor", "status", "termsAcceptedAt", "createdAt", "updatedAt") VALUES (?, 'lr-prop', 'lr-user', 'Ad', 'Soyad', '+994500000003', 'r@example.test', ?, 'COMPLETED', ?, ?, ?)`,
    ).bind("lr-res-old", old, old, old, old),
    DB.prepare(
      `INSERT INTO "Reservation" ("id", "propertyId", "userId", "firstName", "lastName", "phone", "email", "requestedFor", "status", "termsAcceptedAt", "createdAt", "updatedAt") VALUES (?, 'lr-prop', 'lr-user', 'Ad', 'Soyad', '+994500000003', 'r@example.test', ?, 'REQUESTED', ?, ?, ?)`,
    ).bind("lr-res-new", iso, iso, iso, iso),
    DB.prepare(`INSERT INTO "ReservationEvent" ("id", "reservationId", "status", "createdAt") VALUES ('lr-res-ev', 'lr-res-old', 'COMPLETED', ?)`).bind(old),
  ]);
  await DB.batch(Array.from({ length: OLD_BULK }, (_, index) => lead.bind(`lr-bulk-${index}`, old, old)));
});

describe("müraciət saxlama müddəti", () => {
  it("saxlama cədvəlində göstərilir və Məxfilik siyasəti ilə eynidir (3 il)", () => {
    expect(LEAD_RETENTION_DAYS).toBe(3 * 365);
    expect(RETENTION_POLICY).toContainEqual({ key: "leads", value: LEAD_RETENTION_DAYS, unit: "days" });
    expect(leadRetentionCutoff(now).getTime()).toBe(now.getTime() - LEAD_RETENTION_DAYS * DAY);
  });

  it("3 ildən köhnə müraciət, rezervasiya və qeydiyyatı partiyalarla silir, təzələrə toxunmur", async () => {
    const result = await purgeExpiredLeads(now);
    // Paylaşılan test bazasında başqa faylların köhnə qeydləri də ola bilər — say ən azı bizimkidir.
    expect(result.leads).toBeGreaterThanOrEqual(OLD_BULK + 1);
    expect(result.reservations).toBeGreaterThanOrEqual(1);
    expect(result.openHouseRegistrations).toBeGreaterThanOrEqual(1);

    const leads = await DB.prepare(`SELECT "id" FROM "Lead" WHERE "id" LIKE 'lr-%' ORDER BY "id"`).all<{ id: string }>();
    expect(leads.results.map((row) => row.id)).toEqual(["lr-almost", "lr-new"]);
    // Kaskad: fəaliyyət və rezervasiya hadisəsi də getdi.
    expect(await DB.prepare(`SELECT COUNT(*) AS n FROM "LeadActivity" WHERE "id" = 'lr-act'`).first("n")).toBe(0);
    expect(await DB.prepare(`SELECT COUNT(*) AS n FROM "ReservationEvent" WHERE "id" = 'lr-res-ev'`).first("n")).toBe(0);
    expect(await DB.prepare(`SELECT "id" FROM "Reservation" WHERE "id" LIKE 'lr-res-%'`).all()).toMatchObject({ results: [{ id: "lr-res-new" }] });
    expect(await DB.prepare(`SELECT "id" FROM "OpenHouseRegistration" WHERE "id" LIKE 'lr-reg-%'`).all()).toMatchObject({ results: [{ id: "lr-reg-new" }] });
    // FK-sız istinadlar boşaldılır, qeydin özü qalır.
    expect(await DB.prepare(`SELECT "leadId" FROM "AgencyTask" WHERE "id" = 'lr-task'`).first("leadId")).toBeNull();
    expect(await DB.prepare(`SELECT "leadId" FROM "OpenHouseRegistration" WHERE "id" = 'lr-reg-new'`).first("leadId")).toBeNull();
    // Silinmə faktı fərdi məlumatsız qeyd olunur.
    const event = await DB.prepare(`SELECT "payload" FROM "DomainEvent" WHERE "type" = 'lead.retention_purged'`).first<{ payload: string }>();
    expect(JSON.parse(event!.payload)).toEqual(result);
  });

  it("idempotentdir — təkrar çağırış heç nə silmir", async () => {
    expect(await purgeExpiredLeads(now)).toEqual({ leads: 0, reservations: 0, openHouseRegistrations: 0 });
  });
});
