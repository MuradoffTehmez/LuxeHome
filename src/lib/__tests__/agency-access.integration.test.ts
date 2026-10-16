import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { AGENCY_EMPLOYEE_STATUSES, AGENCY_MEMBER_PERMISSIONS, LOCATION_KINDS, PROPERTY_STATUSES } from "@/lib/constants";
import {
  effectivePermissions,
  getAgencyAccess,
  hasAgencyPermission,
  notSuspendedAgencyListing,
  parseMemberPermissions,
  serializeMemberPermissions,
} from "@/lib/accounts/agency-access";
import { listingAgencyFor } from "@/lib/accounts/agency-ownership";
import { findManageableLead, getAccountLeads } from "@/lib/accounts/listing-leads";
import { prisma } from "@/lib/prisma";

/** Agentlərin idarə edilməsi (#218, PRD 7.2): rol, səlahiyyət və girişin dayandırılması real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const employee = DB.prepare(
    `INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "source", "invitedAt", "approvedAt", "permissions", "suspendedAt")
     VALUES (?, 'acc-agency', ?, ?, ?, 'INVITE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)`,
  );
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "agencyId", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'acc-type', 'acc-city', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const lead = DB.prepare(
    `INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "propertyId", "handlerId", "agencyId", "createdAt", "updatedAt")
     VALUES (?, 'Müştəri', '+994501112233', 'Salam', 'PROPERTY', 'NEW', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("acc-type", "Mənzil", "menzil", "acc-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("acc-city", "Bakı", "baki", "acc-baki", LOCATION_KINDS.CITY),
    user.bind("acc-owner", "Sahib", "acc-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    user.bind("acc-manager", "Menecer", "acc-manager@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("acc-agent", "Agent", "acc-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("acc-suspended", "Dayandırılmış", "acc-suspended@example.test", "disabled", "EDITOR", "AGENT"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').bind("acc-agency", "acc-owner", "Alfa", "acc-alfa"),
    employee.bind("acc-e-manager", "acc-manager", "MANAGER", AGENCY_EMPLOYEE_STATUSES.APPROVED, null, null),
    // Agent rolunda, amma sahib ona müraciət səlahiyyəti verib.
    employee.bind("acc-e-agent", "acc-agent", "AGENT", AGENCY_EMPLOYEE_STATUSES.APPROVED, '["LISTINGS_ASSIGN"]', null),
    employee.bind("acc-e-suspended", "acc-suspended", "MANAGER", AGENCY_EMPLOYEE_STATUSES.APPROVED, null, new Date().toISOString()),
    property.bind("acc-p-agency", "Agentlik elanı", "acc-p-agency", PROPERTY_STATUSES.PUBLISHED, "acc-suspended", "acc-agency"),
    property.bind("acc-p-personal", "Şəxsi elan", "acc-p-personal", PROPERTY_STATUSES.PUBLISHED, "acc-suspended", null),
    property.bind("acc-p-owner", "Sahibin elanı", "acc-p-owner", PROPERTY_STATUSES.PUBLISHED, "acc-owner", "acc-agency"),
    lead.bind("acc-l-owner", "acc-p-owner", "acc-owner", "acc-agency"),
    lead.bind("acc-l-suspended", "acc-p-agency", "acc-suspended", "acc-agency"),
  ]);
});

describe("rol və səlahiyyətlər", () => {
  it("defolt rol üzrə, saxlanmış siyahı isə onu əvəz edir; defoltla eyni siyahı null saxlanılır", () => {
    expect([...effectivePermissions("MANAGER", null)].sort()).toEqual(["LEADS_MANAGE", "LISTINGS_ASSIGN", "TASKS_MANAGE"]);
    expect([...effectivePermissions("AGENT", null)]).toEqual([]);
    expect([...effectivePermissions("AGENT", '["LEADS_MANAGE","yoxdur"]')]).toEqual(["LEADS_MANAGE"]);
    expect([...effectivePermissions("MANAGER", "pozulmuş")].length).toBe(3);
    expect(parseMemberPermissions('{"a":1}')).toBeNull();
    expect(serializeMemberPermissions("MANAGER", ["TASKS_MANAGE", "LEADS_MANAGE", "LISTINGS_ASSIGN"])).toBeNull();
    expect(serializeMemberPermissions("MANAGER", ["LEADS_MANAGE"])).toBe('["LEADS_MANAGE"]');
    expect(serializeMemberPermissions("AGENT", [])).toBeNull();
  });

  it("giriş: sahib hamısına, menecer defolta, agent öz siyahısına, dayandırılmış heç nəyə malikdir", async () => {
    const owner = await getAgencyAccess({ id: "acc-owner", accountType: "AGENCY" });
    const manager = await getAgencyAccess({ id: "acc-manager", accountType: "AGENT" });
    const agent = await getAgencyAccess({ id: "acc-agent", accountType: "AGENT" });
    const suspended = await getAgencyAccess({ id: "acc-suspended", accountType: "AGENT" });
    expect(hasAgencyPermission(owner, AGENCY_MEMBER_PERMISSIONS.TASKS_MANAGE)).toBe(true);
    expect(hasAgencyPermission(manager, AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE)).toBe(true);
    expect(hasAgencyPermission(agent, AGENCY_MEMBER_PERMISSIONS.LISTINGS_ASSIGN)).toBe(true);
    expect(hasAgencyPermission(agent, AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE)).toBe(false);
    expect(suspended).toMatchObject({ suspended: true, role: "MANAGER" });
    expect(hasAgencyPermission(suspended, AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE)).toBe(false);
  });
});

describe("müraciətlərin idarəsi (LEADS_MANAGE)", () => {
  it("menecer agentliyin bütün müraciətlərini görür və idarə edir, səlahiyyətsiz agent yox", async () => {
    expect((await getAccountLeads("acc-manager")).leads.map((lead) => lead.id).sort()).toEqual(["acc-l-owner", "acc-l-suspended"]);
    await expect(findManageableLead("acc-manager", "acc-l-owner")).resolves.toMatchObject({ canManage: true, isOwner: false });
    expect((await getAccountLeads("acc-agent")).leads).toEqual([]);
    await expect(findManageableLead("acc-agent", "acc-l-owner")).resolves.toBeNull();
  });
});

describe("girişin dayandırılması", () => {
  it("agentlik adından elan, agentlik müraciətləri və agentlik elanının redaktəsi bağlanır, şəxsi elan qalır", async () => {
    await expect(listingAgencyFor({ id: "acc-suspended", accountType: "AGENT" })).resolves.toBeNull();
    // Müraciət hələ onun adındadır, amma agentliyə bağlı olduğu üçün görünmür.
    expect((await getAccountLeads("acc-suspended")).leads).toEqual([]);
    const editable = await prisma.property.findMany({
      where: { authorId: "acc-suspended", deletedAt: null, ...notSuspendedAgencyListing("acc-suspended") },
      select: { id: true },
    });
    expect(editable.map((item) => item.id)).toEqual(["acc-p-personal"]);
    // Başqa üzv üçün şərt agentlik elanını gizlətmir.
    const ownerVisible = await prisma.property.findMany({ where: { authorId: "acc-owner", ...notSuspendedAgencyListing("acc-owner") }, select: { id: true } });
    expect(ownerVisible.map((item) => item.id)).toEqual(["acc-p-owner"]);
  });
});
