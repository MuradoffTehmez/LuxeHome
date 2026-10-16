import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { LEAD_ROUTING_MODES, LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";

const notices = vi.hoisted(() => ({ escalation: vi.fn() }));
vi.mock("@/lib/accounts/account-notices", () => ({ noticeLeadEscalation: notices.escalation }));

import { releaseAgentLeads, routeAgencyLead, routePropertyLead } from "@/lib/accounts/lead-routing";
import { findManageableLead, getAccountLeads } from "@/lib/accounts/listing-leads";
import { escalateStaleLeads, refreshResponseStats } from "@/lib/accounts/lead-jobs";
import { incrementListingStat } from "@/lib/listing-stats";
import { getListingAnalytics } from "@/lib/accounts/listing-analytics";

/** Müraciət bölgüsü, eskalasiya, cavab göstəriciləri və elan analitikası real D1-də (#161). */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

async function setRouting(mode: string) {
  await DB.prepare('UPDATE "Agency" SET "leadRouting" = ? WHERE "id" = ?').bind(mode, "rt-agency").run();
}

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "districtId",
       "authorId", "agencyId", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'rt-type', 'rt-city', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const employee = DB.prepare('INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "status", "approvedAt", "receivesLeads") VALUES (?, ?, ?, ?, ?, ?)');
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("rt-type", "Mənzil", "menzil", "rt-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("rt-city", "Bakı", "baki", "rt-baki", LOCATION_KINDS.CITY),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, ?, 0)').bind("rt-district", "Yasamal", "yasamal", "rt-yasamal", LOCATION_KINDS.DISTRICT, "rt-city"),
    user.bind("rt-owner", "Agentlik", "rt-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    user.bind("rt-agent1", "Birinci agent", "rt-agent1@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("rt-agent2", "İkinci agent", "rt-agent2@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("rt-agent3", "Növbədən kənar", "rt-agent3@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("rt-solo", "Sahib", "rt-solo@example.test", "disabled", "EDITOR", "OWNER"),
    user.bind("rt-unverified", "Təsdiqsiz", "rt-unverified@example.test", "disabled", "EDITOR", "AGENCY"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "leadRouting", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
      .bind("rt-agency", "rt-owner", "Alfa", "rt-alfa", 1, LEAD_ROUTING_MODES.ROUND_ROBIN),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
      .bind("rt-agency2", "rt-unverified", "Beta", "rt-beta", 0),
    employee.bind("rt-e1", "rt-agency", "rt-agent1", "APPROVED", "2026-01-01T00:00:00.000Z", 1),
    employee.bind("rt-e2", "rt-agency", "rt-agent2", "APPROVED", "2026-02-01T00:00:00.000Z", 1),
    employee.bind("rt-e3", "rt-agency", "rt-agent3", "APPROVED", "2025-12-01T00:00:00.000Z", 0),
    DB.prepare('INSERT INTO "AgentProfile" ("id", "userId", "agencyId", "slug", "name", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)')
      .bind("rt-ap1", "rt-agent1", "rt-agency", "rt-birinci", "Birinci agent"),
    property.bind("rt-p-owner", "Agentliyin elanı", "rt-p-owner", PROPERTY_STATUSES.PUBLISHED, "rt-district", "rt-owner", "rt-agency"),
    property.bind("rt-p-agent1", "Agentin elanı", "rt-p-agent1", PROPERTY_STATUSES.PUBLISHED, "rt-district", "rt-agent1", "rt-agency"),
    // Agentin şəxsi elanı (#210) — sahibin analitikasına düşmür.
    property.bind("rt-p-agent1-own", "Agentin şəxsi elanı", "rt-p-agent1-own", PROPERTY_STATUSES.PUBLISHED, null, "rt-agent1", null),
    property.bind("rt-p-solo", "Sahibin elanı", "rt-p-solo", PROPERTY_STATUSES.PUBLISHED, null, "rt-solo", null),
  ]);
});

describe("müraciət bölgüsü", () => {
  it("növbə ilə agentlər arasında fırlanır, növbədən kənar agentə düşmür", async () => {
    await setRouting(LEAD_ROUTING_MODES.ROUND_ROBIN);
    const area = { listerId: "rt-owner", districtId: "rt-district", cityId: "rt-city" };
    const first = await routePropertyLead(area, new Date(now.getTime() - 3000));
    const second = await routePropertyLead(area, new Date(now.getTime() - 2000));
    const third = await routePropertyLead(area, new Date(now.getTime() - 1000));
    expect([first.handlerId, second.handlerId, third.handlerId]).toEqual(["rt-agent1", "rt-agent2", "rt-agent1"]);
    expect(first).toMatchObject({ agencyId: "rt-agency", agencyName: "Alfa", routed: true });
  });

  it("ərazi üzrə rejimdə rayonda elanı olan agent seçilir", async () => {
    await setRouting(LEAD_ROUTING_MODES.AREA);
    const route = await routePropertyLead({ listerId: "rt-owner", districtId: "rt-district", cityId: "rt-city" });
    expect(route.handlerId).toBe("rt-agent1");
  });

  it("söndürülü bölgüdə müraciət sahibə qalır", async () => {
    await setRouting(LEAD_ROUTING_MODES.OFF);
    await expect(routePropertyLead({ listerId: "rt-owner" })).resolves.toMatchObject({ handlerId: "rt-owner", agencyId: "rt-agency", routed: false });
    await setRouting(LEAD_ROUTING_MODES.ROUND_ROBIN);
  });

  it("agentin öz elanı agentə gedir, amma agentliyə bağlanır; adi sahibdə agentlik yoxdur", async () => {
    await expect(routePropertyLead({ listerId: "rt-agent2" })).resolves.toMatchObject({ handlerId: "rt-agent2", agencyId: "rt-agency", routed: false });
    await expect(routePropertyLead({ listerId: "rt-solo" })).resolves.toMatchObject({ handlerId: "rt-solo", agencyId: null });
    await expect(routePropertyLead({ listerId: null })).resolves.toMatchObject({ handlerId: null, agencyId: null });
  });

  it("profil forması yalnız təsdiqlənmiş agentliyə gedir", async () => {
    await expect(routeAgencyLead("rt-alfa")).resolves.toMatchObject({ agencyId: "rt-agency", routed: true });
    await expect(routeAgencyLead("rt-beta")).resolves.toBeNull();
    await expect(routeAgencyLead("yoxdur")).resolves.toBeNull();
  });
});

describe("müraciət işləri", () => {
  beforeAll(async () => {
    const lead = DB.prepare(
      `INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "handlerId", "agencyId", "respondedAt", "createdAt", "updatedAt")
       VALUES (?, ?, '+994501234567', 'Salam', 'PROPERTY', 'NEW', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    );
    await DB.batch([
      lead.bind("rt-l-stale", "Gecikən", "rt-agent1", "rt-agency", null, ago(40)),
      lead.bind("rt-l-owner", "Sahibdə", "rt-owner", "rt-agency", null, ago(40)),
      lead.bind("rt-l-fresh", "Təzə", "rt-agent1", "rt-agency", null, ago(10)),
      lead.bind("rt-l-r1", "Cavab 1", "rt-agent1", "rt-agency", ago(590), ago(600)),
      lead.bind("rt-l-r2", "Cavab 2", "rt-agent1", "rt-agency", ago(470), ago(500)),
      lead.bind("rt-l-r3", "Cavab 3", "rt-agent1", "rt-agency", ago(380), ago(400)),
    ]);
  });

  it("bildiriş yazılmasa eskalasiya markeri geri qaytarılır və növbəti cəhddə təkrarlanır", async () => {
    notices.escalation.mockResolvedValueOnce(false);
    await expect(escalateStaleLeads(now)).resolves.toEqual({ escalated: 0 });
    const lead = await DB.prepare('SELECT "escalatedAt" FROM "Lead" WHERE "id" = ?').bind("rt-l-stale").first<{ escalatedAt: string | null }>();
    expect(lead?.escalatedAt).toBeNull();
    notices.escalation.mockClear();
  });

  it("30 dəqiqə cavabsız agent müraciətini sahibə bir dəfə eskalasiya edir", async () => {
    notices.escalation.mockResolvedValue(true);
    await expect(escalateStaleLeads(now)).resolves.toEqual({ escalated: 1 });
    expect(notices.escalation).toHaveBeenCalledOnce();
    expect(notices.escalation).toHaveBeenCalledWith(expect.objectContaining({ userId: "rt-owner", leadId: "rt-l-stale", handlerName: "Birinci agent" }));
    await expect(escalateStaleLeads(now)).resolves.toEqual({ escalated: 0 });
  });

  it("agent və agentlik üzrə cavab göstəricilərini yazır", async () => {
    await refreshResponseStats(now);
    const agent = await DB.prepare('SELECT "measuredResponseMinutes", "responseSample", "responseRate" FROM "AgentProfile" WHERE "id" = ?')
      .bind("rt-ap1").first<{ measuredResponseMinutes: number; responseSample: number; responseRate: number }>();
    // 3 cavab (10, 30, 20 dəq) + 1 gecikən cavabsız; təzə müraciət hələ sayılmır.
    expect(agent).toEqual({ measuredResponseMinutes: 20, responseSample: 4, responseRate: 75 });
    const agency = await DB.prepare('SELECT "responseSample" FROM "Agency" WHERE "id" = ?').bind("rt-agency").first<{ responseSample: number }>();
    expect(agency?.responseSample).toBe(5);
  });
});

describe("komandadan çıxmış agent", () => {
  it("agentlik müraciətini artıq görmür, açıq müraciətlər sahibə qaytarılır", async () => {
    await DB.batch([
      DB.prepare(`INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "handlerId", "agencyId", "createdAt", "updatedAt")
        VALUES ('rt-l-left', 'Profil müraciəti', '+994501234567', 'Salam', 'AGENCY', 'NEW', 'rt-agent2', 'rt-agency', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`),
      // Agent komandadan çıxır (üzvlük silinir), müraciət hələ onun adındadır.
      DB.prepare('DELETE FROM "AgencyEmployee" WHERE "id" = ?').bind("rt-e2"),
    ]);
    expect((await getAccountLeads("rt-agent2")).leads.map((lead) => lead.id)).not.toContain("rt-l-left");
    await expect(findManageableLead("rt-agent2", "rt-l-left")).resolves.toBeNull();

    await expect(releaseAgentLeads({ agencyId: "rt-agency", userId: "rt-agent2", ownerUserId: "rt-owner" })).resolves.toBe(1);
    const lead = await DB.prepare('SELECT "handlerId" FROM "Lead" WHERE "id" = ?').bind("rt-l-left").first<{ handlerId: string }>();
    expect(lead?.handlerId).toBe("rt-owner");
    await expect(findManageableLead("rt-owner", "rt-l-left")).resolves.toMatchObject({ isOwner: true });
  });
});

describe("elan analitikası", () => {
  it("gündəlik sayğacı atomik artırır və agentlik sahibinə komandanın elanlarını göstərir", async () => {
    await incrementListingStat("rt-p-agent1", "views", now);
    await incrementListingStat("rt-p-agent1", "views", now);
    await incrementListingStat("rt-p-agent1", "contactReveals", now);
    await incrementListingStat("rt-p-owner", "views", now);

    const data = await getListingAnalytics({ userId: "rt-owner", userName: "Agentlik", period: 7, now });
    expect(data.isAgency).toBe(true);
    expect(data.totals).toMatchObject({ views: 3, contactReveals: 1, whatsappClicks: 0 });
    expect(data.rows.map((row) => row.id)).toEqual(["rt-p-agent1", "rt-p-owner"]);
    expect(data.rows[0].marketViews).toBeGreaterThan(0);
    expect(data.series).toHaveLength(7);

    const agentOnly = await getListingAnalytics({ userId: "rt-owner", userName: "Agentlik", period: 7, agentUserId: "rt-agent1", now });
    expect(agentOnly.rows.map((row) => row.id)).toEqual(["rt-p-agent1"]);
    const foreign = await getListingAnalytics({ userId: "rt-owner", userName: "Agentlik", period: 7, agentUserId: "rt-solo", now });
    expect(foreign.rows).toHaveLength(2);
  });
});
