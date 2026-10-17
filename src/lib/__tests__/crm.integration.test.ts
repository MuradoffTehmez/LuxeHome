import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { LOCATION_KINDS } from "@/lib/constants";
import {
  crmClientData,
  crmPhoneKey,
  getCrmClient,
  getCrmClients,
  getCrmContext,
  parseCrmClientForm,
  releaseAgentClients,
  resolveCrmTaxonomy,
} from "@/lib/accounts/crm";
import { finalizeAccountDeletion } from "@/lib/account-deletion";
import { prisma } from "@/lib/prisma";

/** Mini CRM (#226, PRD 9.1, 9.2) real D1-də: görünmə qaydası, forma, taksonomiya, axtarış, təhvil. */
const DB = (env as unknown as { DB: D1Database }).DB;

const owner = { id: "crm-owner", accountType: "AGENCY" };
const manager = { id: "crm-manager", accountType: "AGENT" };
const agent = { id: "crm-agent", accountType: "AGENT" };
const paused = { id: "crm-paused", accountType: "AGENT" };
const solo = { id: "crm-solo", accountType: "OWNER" };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, \'disabled\', \'EDITOR\', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const employee = DB.prepare('INSERT INTO "AgencyEmployee" ("id", "agencyId", "userId", "role", "status", "approvedAt", "suspendedAt") VALUES (?, \'crm-agency\', ?, ?, \'APPROVED\', CURRENT_TIMESTAMP, ?)');
  const location = DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, ?, 0)');
  const client = DB.prepare('INSERT INTO "CrmClient" ("id", "agencyId", "ownerId", "name", "phone", "phoneKey", "searchText", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  await DB.batch([
    user.bind("crm-owner", "Sahib", "crm-owner@example.test", "AGENCY"),
    user.bind("crm-manager", "Menecer", "crm-manager@example.test", "AGENT"),
    user.bind("crm-agent", "Agent", "crm-agent@example.test", "AGENT"),
    user.bind("crm-paused", "Dayandırılmış", "crm-paused@example.test", "AGENT"),
    user.bind("crm-solo", "Sahibkar", "crm-solo@example.test", "OWNER"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (\'crm-agency\', \'crm-owner\', \'Alfa\', \'crm-alfa\', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    employee.bind("crm-e1", "crm-manager", "MANAGER", null),
    employee.bind("crm-e2", "crm-agent", "AGENT", null),
    employee.bind("crm-e3", "crm-paused", "AGENT", "2026-10-01T00:00:00.000Z"),
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (\'crm-type\', \'Mənzil\', \'menzil\', \'crm-menzil\')'),
    location.bind("crm-baki", "Bakı", "baki", "crm-baki", LOCATION_KINDS.CITY, null),
    location.bind("crm-quba", "Quba", "quba", "crm-quba", LOCATION_KINDS.CITY, null),
    location.bind("crm-sabuncu", "Sabunçu", "sabuncu", "crm-sabuncu", LOCATION_KINDS.DISTRICT, "crm-baki"),
    location.bind("crm-mastaga", "Maştağa", "mastaga", "crm-mastaga", LOCATION_KINDS.SETTLEMENT, "crm-sabuncu"),
    client.bind("crm-c-agent", "crm-agency", "crm-agent", "Aysel Məmmədova", "+994501112233", "501112233", "aysel memmedova 994501112233"),
    client.bind("crm-c-manager", "crm-agency", "crm-manager", "Elnur Həsənov", "0552223344", "552223344", "elnur hesenov 0552223344"),
    client.bind("crm-c-paused", "crm-agency", "crm-paused", "Leyla Əliyeva", null, null, "leyla eliyeva"),
    client.bind("crm-c-agent-own", null, "crm-agent", "Şəxsi müştəri", "0703334455", "703334455", "sexsi musteri 0703334455"),
    client.bind("crm-c-solo", null, "crm-solo", "Sahibkarın müştərisi", "0501112233", "501112233", "sahibkarin musterisi"),
  ]);
});

describe("görünmə qaydası", () => {
  it("sahib və LEADS_MANAGE menecer agentliyin bütün kartlarını, agent yalnız özününkünü görür", async () => {
    const ids = async (user: { id: string; accountType: string }) =>
      (await getCrmClients(await getCrmContext(user), {})).clients.map((item) => item.id).sort();
    await expect(ids(owner)).resolves.toEqual(["crm-c-agent", "crm-c-manager", "crm-c-paused"]);
    await expect(ids(manager)).resolves.toEqual(["crm-c-agent", "crm-c-manager", "crm-c-paused"]);
    await expect(ids(agent)).resolves.toEqual(["crm-c-agent", "crm-c-agent-own"]);
    // Dayandırılmış üzv agentlik kartlarını (öz kartını da) görmür.
    await expect(ids(paused)).resolves.toEqual([]);
    await expect(ids(solo)).resolves.toEqual(["crm-c-solo"]);
  });

  it("kart başqasına 404-dür; idarəçi məsul seçimini alır", async () => {
    await expect(getCrmClient(await getCrmContext(agent), "crm-c-manager")).resolves.toBeNull();
    await expect(getCrmClient(await getCrmContext(solo), "crm-c-agent")).resolves.toBeNull();
    const card = await getCrmClient(await getCrmContext(owner), "crm-c-agent");
    expect(card?.canManage).toBe(true);
    expect(card?.assignees?.map((item) => item.userId)).toEqual(expect.arrayContaining(["crm-owner", "crm-manager", "crm-agent"]));
    expect((await getCrmClient(await getCrmContext(agent), "crm-c-agent"))?.canManage).toBe(false);
  });

  it("axtarış diakritikasızdır və telefon rəqəmləri ilə işləyir", async () => {
    const context = await getCrmContext(owner);
    await expect(getCrmClients(context, { q: "Əliyeva" })).resolves.toMatchObject({ total: 1, clients: [{ id: "crm-c-paused" }] });
    await expect(getCrmClients(context, { q: "222 33" })).resolves.toMatchObject({ total: 1, clients: [{ id: "crm-c-manager" }] });
    await expect(getCrmClients(context, { owner: "crm-agent" })).resolves.toMatchObject({ total: 1 });
  });
});

describe("forma və ehtiyaclar", () => {
  it("ad, əlaqə və intervallar yoxlanılır", () => {
    expect(parseCrmClientForm(form({ name: "A" })).success).toBe(false);
    const noContact = parseCrmClientForm(form({ name: "Aysel" }));
    expect(noContact.success ? null : noContact.error.issues[0].message).toBe("contact");
    const range = parseCrmClientForm(form({ name: "Aysel", phone: "0501112233", priceMin: "200000", priceMax: "100000" }));
    expect(range.success ? null : range.error.issues[0].message).toBe("range");
    expect(parseCrmClientForm(form({ name: "Aysel", email: "aysel@example.test", listingType: "RENT", rooms: "3" })).success).toBe(true);
    expect(crmPhoneKey("+994 (50) 111-22-33")).toBe(crmPhoneKey("050 111 22 33"));
  });

  it("rayon seçilmiş şəhərin ağacında olmalıdır (qəsəbə rayonun uşağıdır)", async () => {
    await expect(resolveCrmTaxonomy({ typeSlug: "crm-menzil", citySlug: "crm-baki", districtSlug: "crm-mastaga" }))
      .resolves.toEqual({ typeId: "crm-type", cityId: "crm-baki", districtId: "crm-mastaga" });
    await expect(resolveCrmTaxonomy({ citySlug: "crm-quba", districtSlug: "crm-sabuncu" }))
      .resolves.toEqual({ typeId: null, cityId: "crm-quba", districtId: null });
    const parsed = parseCrmClientForm(form({ name: "Aysel Məmmədova", phone: "+994 50 111 22 33", city: "crm-baki", district: "crm-sabuncu" }));
    if (!parsed.success) throw new Error("form");
    await expect(crmClientData(parsed.data)).resolves.toMatchObject({ phoneKey: "501112233", cityId: "crm-baki", districtId: "crm-sabuncu", searchText: expect.stringContaining("memmedova") });
  });
});

describe("komandadan çıxma və hesab silinməsi", () => {
  it("agentlik kartları sahibə keçir, şəxsi kartlar agentdə qalır", async () => {
    await expect(releaseAgentClients({ agencyId: "crm-agency", userId: "crm-agent", ownerUserId: "crm-owner" })).resolves.toBe(1);
    const rows = await DB.prepare(`SELECT "id", "ownerId" FROM "CrmClient" WHERE "id" IN ('crm-c-agent', 'crm-c-agent-own') ORDER BY "id"`).all();
    expect(rows.results).toEqual([{ id: "crm-c-agent", ownerId: "crm-owner" }, { id: "crm-c-agent-own", ownerId: "crm-agent" }]);
  });

  it("hesab silinəndə agentlik kartı sahibə keçir, şəxsi kart silinir", async () => {
    await prisma.user.update({ where: { id: "crm-manager" }, data: { isActive: false, deletionRequestedAt: new Date() } });
    await DB.prepare('INSERT INTO "CrmClient" ("id", "agencyId", "ownerId", "name", "searchText", "createdAt", "updatedAt") VALUES (\'crm-c-manager-own\', NULL, \'crm-manager\', \'Şəxsi\', \'sexsi\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').run();
    await DB.prepare('INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "clientId", "createdAt", "updatedAt") VALUES (\'crm-l-own\', \'Şəxsi\', \'0500000000\', \'Salam\', \'CONTACT\', \'NEW\', \'crm-c-manager-own\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)').run();
    await finalizeAccountDeletion("crm-manager");
    // Silinən karta bağlı müraciətin bağlantısı boşaldılır.
    await expect(prisma.lead.findUniqueOrThrow({ where: { id: "crm-l-own" }, select: { clientId: true } })).resolves.toEqual({ clientId: null });
    await expect(prisma.crmClient.findUnique({ where: { id: "crm-c-manager" }, select: { ownerId: true } })).resolves.toEqual({ ownerId: "crm-owner" });
    await expect(prisma.crmClient.findUnique({ where: { id: "crm-c-manager-own" } })).resolves.toBeNull();
  });
});

describe("müraciət tarixçəsinin məxfiliyi", () => {
  it("kartda yalnız baxanın görə bildiyi müraciətlər göstərilir", async () => {
    await DB.batch([
      DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (\'crm-agency2\', \'crm-solo\', \'Beta\', \'crm-beta\', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
      DB.prepare('INSERT INTO "CrmClient" ("id", "agencyId", "ownerId", "name", "searchText", "createdAt", "updatedAt") VALUES (\'crm-c-private\', NULL, \'crm-agent\', \'Keçmiş müştəri\', \'kecmis musteri\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
      // Başqa agentliyin müraciəti agentin şəxsi kartına bağlanıb — agent onu görməməlidir.
      DB.prepare('INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "agencyId", "clientId", "createdAt", "updatedAt") VALUES (\'crm-l-foreign\', \'X\', \'0500000001\', \'Məxfi mesaj\', \'AGENCY\', \'NEW\', \'crm-agency2\', \'crm-c-private\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
      DB.prepare('INSERT INTO "Lead" ("id", "name", "phone", "message", "source", "status", "handlerId", "clientId", "createdAt", "updatedAt") VALUES (\'crm-l-own2\', \'Y\', \'0500000002\', \'Öz müraciəti\', \'PROPERTY\', \'NEW\', \'crm-agent\', \'crm-c-private\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    ]);
    const card = await getCrmClient(await getCrmContext(agent), "crm-c-private");
    expect(card?.leads.map((lead) => lead.id)).toEqual(["crm-l-own2"]);
  });
});
