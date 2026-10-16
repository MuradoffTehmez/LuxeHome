import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AGENCY_EMPLOYEE_STATUSES, LOCATION_KINDS, PROPERTY_STATUSES, TRANSFER_STATUSES } from "@/lib/constants";
import {
  cancelTransferRequest,
  createTransferRequest,
  decideTransferAsAdmin,
  decideTransferAsSource,
  parseListingReference,
} from "@/lib/listing-transfers";
import { getAccountLeads } from "@/lib/accounts/listing-leads";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/revalidate-public", () => ({ revalidatePublicContent: vi.fn() }));

/** Agentliklər arası köçürmə (#212, PRD 6.4) real D1-də: A + admin təsdiqi və məxfilik. */
const DB = (env as unknown as { DB: D1Database }).DB;
const agentB = { id: "tr-b-agent", accountType: "AGENT" };
const ownerB = { id: "tr-b-owner", accountType: "AGENCY" };
const base = { reason: "Əmlak sahibi yeni agentliklə müqavilə bağlayıb.", ownerConsent: true, ownerConsentNote: "Müqavilə №12", targetUserId: null };

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const agency = DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const employee = DB.prepare(
    'INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "source", "invitedAt", "approvedAt") VALUES (?, ?, ?, \'AGENT\', ?, \'INVITE\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
  );
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
       "authorId", "agencyId", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'tr-type', 'tr-city', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  const lead = DB.prepare(
    `INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "propertyId", "handlerId", "agencyId", "createdAt", "updatedAt")
     VALUES (?, 'Müştəri', '+994501112233', 'Salam', 'PROPERTY', 'NEW', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("tr-type", "Mənzil", "menzil", "tr-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("tr-city", "Bakı", "baki", "tr-baki", LOCATION_KINDS.CITY),
    user.bind("tr-a-owner", "A sahibi", "tr-a-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    user.bind("tr-a-agent", "A agenti", "tr-a-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("tr-b-owner", "B sahibi", "tr-b-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    user.bind("tr-b-agent", "B agenti", "tr-b-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("tr-outsider", "Kənar", "tr-outsider@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("tr-admin", "Admin", "tr-admin@example.test", "disabled", "ADMIN", "STAFF"),
    agency.bind("tr-agency-a", "tr-a-owner", "Alfa", "tr-alfa"),
    agency.bind("tr-agency-b", "tr-b-owner", "Beta", "tr-beta"),
    employee.bind("tr-emp-a", "tr-agency-a", "tr-a-agent", AGENCY_EMPLOYEE_STATUSES.APPROVED),
    employee.bind("tr-emp-b", "tr-agency-b", "tr-b-agent", AGENCY_EMPLOYEE_STATUSES.APPROVED),
    property.bind("tr-p1", "A agentliyinin elanı", "tr-p1", PROPERTY_STATUSES.PUBLISHED, "tr-a-agent", "tr-agency-a"),
    property.bind("tr-p2", "İkinci elan", "tr-p2", PROPERTY_STATUSES.PUBLISHED, "tr-a-owner", "tr-agency-a"),
    property.bind("tr-p-personal", "Şəxsi elan", "tr-p-personal", PROPERTY_STATUSES.PUBLISHED, "tr-a-agent", null),
    property.bind("tr-p-b", "B-nin elanı", "tr-p-b", PROPERTY_STATUSES.PUBLISHED, "tr-b-owner", "tr-agency-b"),
    // Agentliyə bağlanmamış köhnə müraciət və agentliyə bağlı müraciət — köçürmədən sonra ikisi də A-da qalır.
    lead.bind("tr-l-old", "tr-p1", "tr-a-agent", null),
    lead.bind("tr-l-agency", "tr-p1", "tr-a-owner", "tr-agency-a"),
  ]);
});

describe("elan linkinin oxunması", () => {
  it("tam link, yol və slug eyni slug-a gəlir", () => {
    expect(parseListingReference("https://luxehomeestate.az/az/emlaklar/tr-p1?x=1")).toBe("tr-p1");
    expect(parseListingReference("/ru/emlaklar/tr-p1")).toBe("tr-p1");
    expect(parseListingReference(" tr-p1 ")).toBe("tr-p1");
    expect(parseListingReference("<script>")).toBeNull();
  });
});

describe("köçürmə sorğusu", () => {
  it("yalnız başqa agentliyin elanı üçün, razılıqla və bir açıq sorğu ilə yaranır", async () => {
    await expect(createTransferRequest({ ...base, requester: { id: "tr-outsider", accountType: "AGENT" }, listingReference: "tr-p1" })).resolves.toEqual({ result: "noAgency" });
    await expect(createTransferRequest({ ...base, requester: agentB, listingReference: "tr-p-b" })).resolves.toEqual({ result: "sameAgency" });
    await expect(createTransferRequest({ ...base, requester: agentB, listingReference: "tr-p-personal" })).resolves.toEqual({ result: "notAgencyListing" });
    await expect(createTransferRequest({ ...base, requester: agentB, listingReference: "yoxdur" })).resolves.toEqual({ result: "notFound" });
    await expect(createTransferRequest({ ...base, ownerConsent: false, requester: agentB, listingReference: "tr-p1" })).resolves.toEqual({ result: "noConsent" });
    await expect(createTransferRequest({ ...base, reason: "qısa", requester: agentB, listingReference: "tr-p1" })).resolves.toEqual({ result: "invalidReason" });
    await expect(createTransferRequest({ ...base, targetUserId: "tr-outsider", requester: ownerB, listingReference: "tr-p1" })).resolves.toEqual({ result: "invalidTarget" });

    // Agent başqasını təhvil alan seçə bilməz — sorğu həmişə özünə yazılır.
    const created = await createTransferRequest({ ...base, targetUserId: "tr-b-owner", requester: agentB, listingReference: "/az/emlaklar/tr-p1" });
    expect(created).toMatchObject({ result: "created", fromOwnerId: "tr-a-owner", toAgencyName: "Beta" });
    const row = await prisma.listingTransfer.findFirst({ where: { propertyId: "tr-p1" } });
    expect(row).toMatchObject({ targetUserId: "tr-b-agent", fromAgencyId: "tr-agency-a", toAgencyId: "tr-agency-b", status: TRANSFER_STATUSES.PENDING_SOURCE });

    await expect(createTransferRequest({ ...base, requester: ownerB, listingReference: "tr-p1" })).resolves.toEqual({ result: "duplicate" });
  });

  it("A sahibi, sonra admin təsdiqləyir; elan B-yə keçir, köhnə müraciətlər A-da qalır", async () => {
    const transfer = await prisma.listingTransfer.findFirstOrThrow({ where: { propertyId: "tr-p1" } });

    // Admin A-dan əvvəl qərar verə bilməz, kənar şəxs A adından təsdiqləyə bilməz.
    await expect(decideTransferAsAdmin({ transferId: transfer.id, adminId: "tr-admin", approve: true, note: null })).resolves.toEqual({ result: "stale" });
    await expect(decideTransferAsSource({ transferId: transfer.id, ownerUserId: "tr-b-owner", approve: true, note: null })).resolves.toEqual({ result: "notFound" });

    await expect(decideTransferAsSource({ transferId: transfer.id, ownerUserId: "tr-a-owner", approve: true, note: null })).resolves.toMatchObject({ result: "decided" });
    await expect(decideTransferAsSource({ transferId: transfer.id, ownerUserId: "tr-a-owner", approve: false, note: "x" })).resolves.toEqual({ result: "stale" });

    // B agenti əvvəl müraciətləri görmür; köçürmədən sonra da görməməlidir.
    expect((await getAccountLeads("tr-b-agent")).leads).toHaveLength(0);
    await expect(decideTransferAsAdmin({ transferId: transfer.id, adminId: "tr-admin", approve: true, note: null })).resolves.toMatchObject({ result: "completed" });

    const property = await prisma.property.findUniqueOrThrow({ where: { id: "tr-p1" }, select: { agencyId: true, authorId: true, assignedAgentId: true } });
    expect(property).toEqual({ agencyId: "tr-agency-b", authorId: "tr-b-agent", assignedAgentId: null });
    const leads = await prisma.lead.findMany({ where: { propertyId: "tr-p1" }, select: { agencyId: true } });
    expect(leads.every((lead) => lead.agencyId === "tr-agency-a")).toBe(true);
    expect((await getAccountLeads("tr-b-agent")).leads).toHaveLength(0);
    expect((await getAccountLeads("tr-a-owner")).leads.map((lead) => lead.id).sort()).toEqual(["tr-l-agency", "tr-l-old"]);
    await expect(prisma.listingTransfer.findUniqueOrThrow({ where: { id: transfer.id } })).resolves.toMatchObject({ status: TRANSFER_STATUSES.COMPLETED, adminDecidedById: "tr-admin" });
  });

  it("arada dəyişən elan köhnə sorğu ilə köçürülmür, geri çəkilən sorğu bağlanır", async () => {
    const created = await createTransferRequest({ ...base, requester: ownerB, listingReference: "tr-p2" });
    expect(created.result).toBe("created");
    const id = created.result === "created" ? created.id : "";
    await decideTransferAsSource({ transferId: id, ownerUserId: "tr-a-owner", approve: true, note: null });
    await prisma.property.update({ where: { id: "tr-p2" }, data: { deletedAt: new Date() } });
    await expect(decideTransferAsAdmin({ transferId: id, adminId: "tr-admin", approve: true, note: null })).resolves.toEqual({ result: "listingChanged" });
    await expect(prisma.listingTransfer.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject({ status: TRANSFER_STATUSES.CANCELLED });
    await expect(prisma.property.findUniqueOrThrow({ where: { id: "tr-p2" }, select: { agencyId: true } })).resolves.toEqual({ agencyId: "tr-agency-a" });

    await prisma.property.update({ where: { id: "tr-p2" }, data: { deletedAt: null } });
    const again = await createTransferRequest({ ...base, requester: agentB, listingReference: "tr-p2" });
    const againId = again.result === "created" ? again.id : "";
    await expect(cancelTransferRequest({ transferId: againId, userId: "tr-a-owner" })).resolves.toBe(false);
    await expect(cancelTransferRequest({ transferId: againId, userId: "tr-b-owner" })).resolves.toBe(true);
    await expect(cancelTransferRequest({ transferId: againId, userId: "tr-b-agent" })).resolves.toBe(false);
  });
});
