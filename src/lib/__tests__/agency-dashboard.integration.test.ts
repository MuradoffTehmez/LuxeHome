import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { AGENCY_EMPLOYEE_STATUSES, LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import { getAgencyDashboard } from "@/lib/accounts/agency-dashboard";
import { bakuDay } from "@/lib/listing-stats";

/** Agentlik paneli (#216, PRD 7.1) real D1-də: yalnız agentlik elanları sayılır. */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date();
const today = bakuDay(now);
const old = new Date(now.getTime() - 200 * 86_400_000).toISOString();

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "isActive", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
       "authorId", "agencyId", "closedAt", "listingExpiresAt", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'dash-type', 'dash-city', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)`,
  );
  const lead = DB.prepare(
    `INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "propertyId", "handlerId", "agencyId", "respondedAt", "createdAt", "updatedAt")
     VALUES (?, 'Müştəri', '+994501112233', 'Salam', 'PROPERTY', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const stat = DB.prepare('INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views", "contactReveals", "whatsappClicks", "telegramClicks") VALUES (?, ?, ?, ?, ?, ?)');
  const soon = new Date(now.getTime() + 3 * 86_400_000).toISOString();
  const nowIso = now.toISOString();
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("dash-type", "Mənzil", "menzil", "dash-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("dash-city", "Bakı", "baki", "dash-baki", LOCATION_KINDS.CITY),
    user.bind("dash-owner", "Sahib", "dash-owner@example.test", "disabled", "EDITOR", "AGENCY", 1),
    user.bind("dash-agent", "Agent", "dash-agent@example.test", "disabled", "EDITOR", "AGENT", 1),
    user.bind("dash-gone", "Deaktiv agent", "dash-gone@example.test", "disabled", "EDITOR", "AGENT", 0),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("dash-agency", "dash-owner", "Alfa", "dash-alfa"),
    DB.prepare('INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "source", "invitedAt", "approvedAt", "receivesLeads") VALUES (?, ?, ?, \'AGENT\', ?, \'INVITE\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)').bind("dash-e1", "dash-agency", "dash-agent", AGENCY_EMPLOYEE_STATUSES.APPROVED, 0),
    DB.prepare('INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "source", "invitedAt", "approvedAt", "receivesLeads") VALUES (?, ?, ?, \'AGENT\', ?, \'INVITE\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)').bind("dash-e2", "dash-agency", "dash-gone", AGENCY_EMPLOYEE_STATUSES.APPROVED, 1),
    property.bind("dash-p1", "Aktiv mənzil", "dash-p1", PROPERTY_STATUSES.PUBLISHED, "dash-agent", "dash-agency", null, soon, nowIso),
    property.bind("dash-p2", "Köhnə aktiv", "dash-p2", PROPERTY_STATUSES.RESERVED, "dash-owner", "dash-agency", null, null, old),
    property.bind("dash-p3", "Satılıb", "dash-p3", PROPERTY_STATUSES.SOLD, "dash-owner", "dash-agency", nowIso, null, old),
    property.bind("dash-p4", "Düzəliş", "dash-p4", PROPERTY_STATUSES.NEEDS_INFO, "dash-agent", "dash-agency", null, null, nowIso),
    // Agentin şəxsi elanı — paneldə heç nəyə təsir etmir.
    property.bind("dash-personal", "Şəxsi", "dash-personal", PROPERTY_STATUSES.PUBLISHED, "dash-agent", null, null, null, nowIso),
    lead.bind("dash-l1", "NEW", "dash-p1", "dash-agent", "dash-agency", null),
    lead.bind("dash-l2", "CONTACTED", "dash-p1", "dash-agent", "dash-agency", nowIso),
    lead.bind("dash-l3", "NEW", "dash-p2", "dash-owner", null, null),
    lead.bind("dash-l-personal", "NEW", "dash-personal", "dash-agent", null, null),
    stat.bind("dash-p1", today, 40, 3, 2, 1),
    stat.bind("dash-p2", today, 10, 1, 0, 0),
    stat.bind("dash-personal", today, 500, 50, 0, 0),
    DB.prepare('INSERT INTO "ListingReport" ("id", "propertyId", "reason", "reporterKey", "status", "createdAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)').bind("dash-r1", "dash-p1", "FAKE", "k1", "OPEN"),
  ]);
});

describe("agentlik paneli", () => {
  it("yalnız agentlik elanlarından göstəriciləri hesablayır", async () => {
    const data = await getAgencyDashboard({ agencyId: "dash-agency", ownerUserId: "dash-owner", period: 30, now });
    expect(data.listings).toEqual({ active: 2, new: 2, sold: 1, rented: 0 });
    expect(data.agents.active).toBe(1);
    expect(data.leads).toEqual({ new: 3, unanswered: 2 });
    expect(data.engagement).toMatchObject({ views: 50, contactClicks: 7, phoneReveals: 4, whatsappClicks: 2, telegramClicks: 1 });
    expect(data.topListings.map((item) => [item.id, item.views])).toEqual([["dash-p1", 40], ["dash-p2", 10]]);
    expect(data.moderation).toMatchObject({ needsInfo: 1, suspended: 0, rejected: 0, openReports: 1, expiringSoon: 1 });
  });

  it("agentlər üzrə aktivlik deaktiv agenti göstərmir", async () => {
    const data = await getAgencyDashboard({ agencyId: "dash-agency", ownerUserId: "dash-owner", period: 30, now });
    expect(data.team.map((member) => member.userId)).toEqual(["dash-owner", "dash-agent"]);
    expect(data.team.find((member) => member.userId === "dash-agent")).toMatchObject({ activeListings: 1, newLeads: 2, unansweredLeads: 1, receivesLeads: false });
    expect(data.team.find((member) => member.userId === "dash-owner")).toMatchObject({ isOwner: true, activeListings: 1, newLeads: 1, unansweredLeads: 1 });
  });
});
