import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { AGENCY_EMPLOYEE_STATUSES, LEAD_ACTIVITY_TYPES, LEAD_SOURCES, LEAD_STAGES, LEAD_STATUSES, LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import {
  getLeadCard,
  getLeadEngagementSummary,
  isClosedLeadStage,
  leadIntentSource,
  leadStatusForStage,
  recordLeadActivity,
  stageData,
  stageForStatus,
} from "@/lib/accounts/lead-pipeline";
import { bakuDay } from "@/lib/listing-stats";
import { prisma } from "@/lib/prisma";

/** Müraciət mərhələləri və kartı (#222, PRD 8.2, 8.3, 8.6) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const lead = DB.prepare(
    `INSERT INTO "Lead" ("id", "name", "phone", "email", "message", "source", "status", "stage", "propertyId", "handlerId", "agencyId", "createdAt", "updatedAt")
     VALUES (?, ?, '+994501112233', 'musteri@example.test', 'Salam', ?, 'NEW', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("lp-type", "Mənzil", "menzil", "lp-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("lp-city", "Bakı", "baki", "lp-baki", LOCATION_KINDS.CITY),
    user.bind("lp-owner", "Sahib", "lp-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    user.bind("lp-agent", "Agent", "lp-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("lp-other", "Kənar", "lp-other@example.test", "disabled", "EDITOR", "AGENT"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("lp-agency", "lp-owner", "Alfa", "lp-alfa"),
    DB.prepare('INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "source", "invitedAt", "approvedAt") VALUES (?, ?, ?, \'AGENT\', ?, \'INVITE\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("lp-e1", "lp-agency", "lp-agent", AGENCY_EMPLOYEE_STATUSES.APPROVED),
    DB.prepare(
      `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "agencyId", "createdAt", "updatedAt")
       VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'lp-type', 'lp-city', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ).bind("lp-p1", "Yasamal mənzili", "lp-p1", PROPERTY_STATUSES.PUBLISHED, "lp-agent", "lp-agency"),
    lead.bind("lp-l1", "Aysel", LEAD_SOURCES.VIEWING, LEAD_STAGES.ASSIGNED, "lp-p1", "lp-agent", "lp-agency"),
    DB.prepare('INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views", "contactReveals", "whatsappClicks", "telegramClicks") VALUES (?, ?, 10, 4, 3, 1)').bind("lp-p1", bakuDay()),
  ]);
});

describe("mərhələ və status", () => {
  it("hər mərhələ ofisin qaba statusuna uyğun gəlir", () => {
    expect(leadStatusForStage(LEAD_STAGES.ASSIGNED)).toBe(LEAD_STATUSES.NEW);
    expect(leadStatusForStage(LEAD_STAGES.VIEWING_SCHEDULED)).toBe(LEAD_STATUSES.IN_PROGRESS);
    expect(leadStatusForStage(LEAD_STAGES.RENTED)).toBe(LEAD_STATUSES.COMPLETED);
    expect(leadStatusForStage(LEAD_STAGES.REJECTED)).toBe(LEAD_STATUSES.CLOSED);
    expect(stageData(LEAD_STAGES.CONTACTED)).toEqual({ stage: "CONTACTED", status: "CONTACTED" });
    expect(isClosedLeadStage(LEAD_STAGES.SOLD)).toBe(true);
    expect(isClosedLeadStage(LEAD_STAGES.NEGOTIATING)).toBe(false);
  });

  it("ofis panelinin statusu mərhələyə uyğunlaşdırılır, uyğun mərhələ saxlanılır", () => {
    expect(stageForStatus(LEAD_STATUSES.IN_PROGRESS, LEAD_STAGES.VIEWING_SCHEDULED)).toBe(LEAD_STAGES.VIEWING_SCHEDULED);
    expect(stageForStatus(LEAD_STATUSES.IN_PROGRESS, LEAD_STAGES.NEW)).toBe(LEAD_STAGES.NEGOTIATING);
    expect(stageForStatus(LEAD_STATUSES.COMPLETED, LEAD_STAGES.AGREED, "RENT")).toBe(LEAD_STAGES.RENTED);
    expect(stageForStatus(LEAD_STATUSES.COMPLETED, LEAD_STAGES.AGREED, null)).toBe(LEAD_STAGES.SOLD);
    expect(stageForStatus(LEAD_STATUSES.CLOSED, LEAD_STAGES.ASSIGNED)).toBe(LEAD_STAGES.CLOSED);
    expect(stageForStatus(LEAD_STATUSES.NEW, LEAD_STAGES.ASSIGNED)).toBe(LEAD_STAGES.ASSIGNED);
    expect(stageForStatus(LEAD_STATUSES.NEW, "yoxdur")).toBe(LEAD_STAGES.NEW);
  });

  it("formadakı məqsəd allowlist-dən keçir", () => {
    expect(leadIntentSource("VIEWING")).toBe(LEAD_SOURCES.VIEWING);
    expect(leadIntentSource("INFO")).toBe(LEAD_SOURCES.INFO);
    expect(leadIntentSource("OWNER")).toBe(LEAD_SOURCES.PROPERTY);
    expect(leadIntentSource(null)).toBe(LEAD_SOURCES.PROPERTY);
  });
});

describe("müraciət kartı", () => {
  it("məsul agent və agentlik sahibi açır, kənar şəxs yox; tarixçə ən yenisi əvvəldə", async () => {
    await recordLeadActivity({ leadId: "lp-l1", actor: null, type: LEAD_ACTIVITY_TYPES.CREATED, details: { source: LEAD_SOURCES.VIEWING } });
    await recordLeadActivity({ leadId: "lp-l1", actor: { id: "lp-agent", name: "Agent" }, type: LEAD_ACTIVITY_TYPES.NOTE, text: "Şənbə zəng ediləcək" });
    // Mövcud olmayan müraciətə tarixçə yazısı xəta atmır.
    await expect(recordLeadActivity({ leadId: "yoxdur", actor: null, type: LEAD_ACTIVITY_TYPES.NOTE, text: "x" })).resolves.toBeUndefined();

    const agentCard = await getLeadCard("lp-agent", "lp-l1");
    expect(agentCard).toMatchObject({ canManage: false, assignees: null, lead: { stage: "ASSIGNED", source: "VIEWING", email: "musteri@example.test" } });
    expect(agentCard?.activities.map((item) => item.type)).toEqual([LEAD_ACTIVITY_TYPES.NOTE, LEAD_ACTIVITY_TYPES.CREATED]);

    const ownerCard = await getLeadCard("lp-owner", "lp-l1");
    expect(ownerCard?.canManage).toBe(true);
    expect(ownerCard?.assignees?.map((item) => item.userId)).toEqual(["lp-owner", "lp-agent"]);

    await expect(getLeadCard("lp-other", "lp-l1")).resolves.toBeNull();
    await prisma.lead.update({ where: { id: "lp-l1" }, data: stageData(LEAD_STAGES.NEGOTIATING) });
    await expect(prisma.lead.findUniqueOrThrow({ where: { id: "lp-l1" }, select: { status: true } })).resolves.toEqual({ status: LEAD_STATUSES.IN_PROGRESS });
  });
});

describe("kliklər və təsdiqlənmiş müraciətlər", () => {
  it("ayrıca sayılır: agentlik üzrə və şəxsi hesab üzrə", async () => {
    await expect(getLeadEngagementSummary("lp-owner", "lp-agency")).resolves.toMatchObject({ phone: 4, whatsapp: 3, telegram: 1, leads: 1 });
    await expect(getLeadEngagementSummary("lp-agent", null)).resolves.toMatchObject({ phone: 4, leads: 1 });
    await expect(getLeadEngagementSummary("lp-other", null)).resolves.toMatchObject({ phone: 0, leads: 0 });
  });
});
