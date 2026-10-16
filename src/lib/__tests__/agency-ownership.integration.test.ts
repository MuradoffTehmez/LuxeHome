import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AGENCY_EMPLOYEE_STATUSES, LISTING_HANDOVER, LISTING_OWNERSHIP, LOCATION_KINDS, MEMBERSHIP_END_REASONS, PROPERTY_STATUSES } from "@/lib/constants";
import { countOwnListings, handOverListings, resolveHandoverTarget } from "@/lib/accounts/agency-listings";
import {
  closeMembershipPeriod,
  getAgencyMembershipHistory,
  getUserMembershipHistory,
  openMembershipPeriod,
  resolveNewListingAgencyId,
} from "@/lib/accounts/agency-ownership";
import { countAgencyOffers } from "@/lib/agency-profile";
import { requestAccountDeletion } from "@/lib/account-deletion";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/revalidate-public", () => ({ revalidatePublicContent: vi.fn() }));

/** Agentlik elan sahibliyi, ayrılmada təhvil və üzvlük tarixçəsi (#210, PRD Modul 04) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
       "authorId", "agencyId", "assignedAgentId", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'own-type', 'own-city', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const employee = DB.prepare(
    'INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "source", "invitedAt", "approvedAt") VALUES (?, ?, ?, \'AGENT\', ?, \'INVITE\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("own-type", "Mənzil", "menzil", "own-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("own-city", "Bakı", "baki", "own-baki", LOCATION_KINDS.CITY),
    user.bind("own-owner", "Sahib", "own-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    user.bind("own-agent", "Agent", "own-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("own-agent2", "Agent 2", "own-agent2@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("own-solo", "Müstəqil", "own-solo@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("own-leaver", "Silinən agent", "own-leaver@example.test", "disabled", "EDITOR", "AGENT"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("own-agency", "own-owner", "Ev Agentliyi", "own-ev"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("own-other", "own-solo", "Başqa", "own-basqa"),
    employee.bind("own-emp", "own-agency", "own-agent", AGENCY_EMPLOYEE_STATUSES.APPROVED),
    employee.bind("own-emp2", "own-agency", "own-agent2", AGENCY_EMPLOYEE_STATUSES.APPROVED),
    employee.bind("own-emp3", "own-agency", "own-leaver", AGENCY_EMPLOYEE_STATUSES.APPROVED),
    DB.prepare('INSERT INTO "AgentProfile" ("id", "userId", "slug", "name", "agencyId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("own-profile", "own-agent", "own-agent", "Agent", "own-agency"),
    property.bind("own-p-agency", "Agentlik elanı", "own-p-agency", PROPERTY_STATUSES.PUBLISHED, "own-agent", "own-agency", null),
    property.bind("own-p-draft", "Agentlik qaralaması", "own-p-draft", PROPERTY_STATUSES.DRAFT, "own-agent", "own-agency", null),
    property.bind("own-p-personal", "Şəxsi elan", "own-p-personal", PROPERTY_STATUSES.PUBLISHED, "own-agent", null, null),
    property.bind("own-p-leaver-agency", "Silinənin agentlik elanı", "own-p-leaver-agency", PROPERTY_STATUSES.PUBLISHED, "own-leaver", "own-agency", null),
    property.bind("own-p-leaver-own", "Silinənin şəxsi elanı", "own-p-leaver-own", PROPERTY_STATUSES.PUBLISHED, "own-leaver", null, null),
    property.bind("own-p-assigned", "Sahibin elanı", "own-p-assigned", PROPERTY_STATUSES.PUBLISHED, "own-owner", "own-agency", "own-profile"),
  ]);
});

describe("yeni elanın sahibliyi", () => {
  it("sahibin elanı həmişə agentlikdir, agent «şəxsi» seçə bilər, üzv olmayanın agentliyi yoxdur", async () => {
    const owner = { id: "own-owner", accountType: "AGENCY" };
    const agent = { id: "own-agent", accountType: "AGENT" };
    await expect(resolveNewListingAgencyId(owner, LISTING_OWNERSHIP.PERSONAL)).resolves.toBe("own-agency");
    await expect(resolveNewListingAgencyId(agent, null)).resolves.toBe("own-agency");
    await expect(resolveNewListingAgencyId(agent, "bilinməyən")).resolves.toBe("own-agency");
    await expect(resolveNewListingAgencyId(agent, LISTING_OWNERSHIP.PERSONAL)).resolves.toBeNull();
    await expect(resolveNewListingAgencyId({ id: "own-nobody", accountType: "AGENT" }, null)).resolves.toBeNull();
  });
});

describe("agentlik təklifləri", () => {
  it("yalnız agentliyin mühitinə aid aktiv elanları sayır, agentin şəxsi elanını yox", async () => {
    const stats = await countAgencyOffers([{ id: "own-agency", userId: "own-owner" }]);
    expect(stats.get("own-agency")).toEqual({ total: 3, sale: 3, rent: 0 });
  });
});

describe("agent ayrılanda elan təhvili", () => {
  it("köhnə KEEP sahibə təhvil sayılır, kənar agent hədəf ola bilməz", async () => {
    const base = { agencyId: "own-agency", ownerUserId: "own-owner", fromUserId: "own-agent" };
    await expect(resolveHandoverTarget({ ...base, handover: LISTING_HANDOVER.KEEP })).resolves.toEqual({ ok: true, userId: "own-owner" });
    await expect(resolveHandoverTarget({ ...base, handover: LISTING_HANDOVER.AGENT, targetUserId: "own-solo" })).resolves.toEqual({ ok: false });
    await expect(resolveHandoverTarget({ ...base, handover: LISTING_HANDOVER.AGENT, targetUserId: "own-agent2" })).resolves.toEqual({ ok: true, userId: "own-agent2" });
  });

  it("yalnız agentlik elanları keçir, şəxsi elan agentdə qalır, təyinat götürülür", async () => {
    const before = await countOwnListings(["own-agent"], "own-agency");
    expect(before.get("own-agent")).toBe(2);

    await expect(handOverListings("own-agent", "own-agent2", "own-agency")).resolves.toBe(2);

    const rows = await prisma.property.findMany({
      where: { id: { in: ["own-p-agency", "own-p-draft", "own-p-personal", "own-p-assigned"] } },
      select: { id: true, authorId: true, agencyId: true, assignedAgentId: true },
      orderBy: { id: "asc" },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    expect(byId.get("own-p-agency")).toMatchObject({ authorId: "own-agent2", agencyId: "own-agency" });
    expect(byId.get("own-p-draft")).toMatchObject({ authorId: "own-agent2" });
    expect(byId.get("own-p-personal")).toMatchObject({ authorId: "own-agent", agencyId: null });
    expect(byId.get("own-p-assigned")).toMatchObject({ authorId: "own-owner", assignedAgentId: null });
  });
});

describe("üzvlük tarixçəsi", () => {
  it("dövr idempotent açılır, ayrılmada bağlanır və yalnız səlahiyyətli tərəfə görünür", async () => {
    await openMembershipPeriod({ userId: "own-agent", agencyId: "own-agency" });
    await openMembershipPeriod({ userId: "own-agent", agencyId: "own-agency" });
    expect(await getUserMembershipHistory("own-agent")).toHaveLength(1);

    await closeMembershipPeriod({ userId: "own-agent", agencyId: "own-agency", reason: MEMBERSHIP_END_REASONS.LEFT, handedOver: 2 });
    const [period] = await getUserMembershipHistory("own-agent");
    expect(period).toMatchObject({ agencyName: "Ev Agentliyi", role: "AGENT", endReason: "LEFT", handedOver: 2 });
    expect(period.leftAt).toBeInstanceOf(Date);

    // Açıq dövr olmadan ayrılma (miqrasiyadan əvvəlki üzvlük) faktı itmir.
    await closeMembershipPeriod({ userId: "own-agent2", agencyId: "own-agency", reason: MEMBERSHIP_END_REASONS.REMOVED, handedOver: 0 });
    const agencyHistory = await getAgencyMembershipHistory("own-agency");
    expect(agencyHistory.map((item) => item.user.id).sort()).toEqual(["own-agent", "own-agent2"]);
    expect(await getAgencyMembershipHistory("own-other")).toEqual([]);
  });
});

describe("agentin hesabı silinəndə", () => {
  it("agentlik elanı sahibə keçir, yalnız şəxsi elan arxivlənir", async () => {
    await expect(requestAccountDeletion("own-leaver")).resolves.toEqual({ finalized: true });
    const rows = await prisma.property.findMany({
      where: { id: { in: ["own-p-leaver-agency", "own-p-leaver-own"] } },
      select: { id: true, authorId: true, deletedAt: true, status: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    expect(byId.get("own-p-leaver-agency")).toMatchObject({ authorId: "own-owner", deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED });
    expect(byId.get("own-p-leaver-own")?.deletedAt).toBeInstanceOf(Date);
    expect(byId.get("own-p-leaver-own")?.status).toBe(PROPERTY_STATUSES.ARCHIVED);
    await expect(prisma.user.findUnique({ where: { id: "own-leaver" } })).resolves.toBeNull();
  });
});
