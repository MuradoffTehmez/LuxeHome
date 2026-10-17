import { env } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { PROPERTY_STATUSES } from "@/lib/constants";
import { SETTING_KEYS } from "@/lib/settings";
import { approveVip, expireVipGrants, extendVip, getOwnerVipState, getVipDashboard, grantVip, rejectVip, requestVip, revokeVip } from "@/lib/vip";

/** VIP elanlar (#248, PRD Modul 12) real D1-də: sorğu → təsdiq/rədd → uzatma/ləğv → avtomatik bitmə. */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;
const now = new Date("2026-10-18T10:00:00Z");

beforeAll(async () => {
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', 'SALE', ?, 1000, 'vip-type', 'vip-city', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (\'vip-type\', \'Mənzil\', \'menzil\', \'vip-menzil\')'),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (\'vip-city\', \'Bakı\', \'baki\', \'vip-baki\', \'CITY\', NULL, 0)'),
    DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (\'vip-owner\', \'Sahib\', \'vip@example.test\', \'disabled\', \'EDITOR\', \'OWNER\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP), (\'vip-admin\', \'Admin\', \'admin@example.test\', \'disabled\', \'ADMIN\', \'STAFF\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    property.bind("vip-p1", "Birinci", "vip-p1", PROPERTY_STATUSES.PUBLISHED, "vip-owner"),
    property.bind("vip-p2", "İkinci", "vip-p2", PROPERTY_STATUSES.PUBLISHED, "vip-owner"),
    property.bind("vip-p3", "Qaralama", "vip-p3", PROPERTY_STATUSES.DRAFT, "vip-owner"),
    property.bind("vip-p4", "Dördüncü", "vip-p4", PROPERTY_STATUSES.PUBLISHED, "vip-owner"),
    DB.prepare('INSERT INTO "PropertyDailyStat" ("propertyId", "day", "views", "uniqueViews", "contactReveals") VALUES (\'vip-p1\', \'2026-10-19\', 40, 25, 3), (\'vip-p1\', \'2026-10-01\', 999, 999, 999)'),
  ]);
});

async function setFlags(flags: Record<string, boolean> | null) {
  await DB.prepare('DELETE FROM "Setting" WHERE "key" = ?').bind(SETTING_KEYS.FEATURE_FLAGS).run();
  if (flags) await DB.prepare('INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES (?, ?, CURRENT_TIMESTAMP)').bind(SETTING_KEYS.FEATURE_FLAGS, JSON.stringify(flags)).run();
}
afterEach(() => setFlags(null));

const featured = (id: string) => prisma.property.findUniqueOrThrow({ where: { id }, select: { isFeatured: true, featuredUntil: true } });

describe("VIP sorğusu", () => {
  it("modul söndürülübsə, qaralama və ya səhv müddətdə sorğu yaranmır", async () => {
    await setFlags({ VIP_REQUESTS: false });
    await expect(requestVip({ userId: "vip-owner", propertyId: "vip-p1", days: 30, now })).resolves.toEqual({ ok: false, reason: "disabled" });
    await setFlags(null);
    await expect(requestVip({ userId: "vip-owner", propertyId: "vip-p3", days: 30, now })).resolves.toEqual({ ok: false, reason: "listing" });
    await expect(requestVip({ userId: "vip-owner", propertyId: "vip-p1", days: 5, now })).resolves.toEqual({ ok: false, reason: "duration" });
    await expect(requestVip({ userId: "başqası", propertyId: "vip-p1", days: 30, now })).resolves.toEqual({ ok: false, reason: "listing" });
  });

  it("defolt: admin təsdiqi lazımdır; ikinci sorğu rədd olunur; təsdiq elanı VIP edir və dövr yazır", async () => {
    const sent = await requestVip({ userId: "vip-owner", propertyId: "vip-p1", days: 30, message: " Zəhmət olmasa ", now });
    expect(sent).toMatchObject({ ok: true, approved: false });
    await expect(requestVip({ userId: "vip-owner", propertyId: "vip-p1", days: 7, now })).resolves.toEqual({ ok: false, reason: "pending" });
    expect((await featured("vip-p1")).isFeatured).toBe(false);

    const requestId = sent.ok ? sent.requestId : "";
    await expect(approveVip({ actorId: "vip-admin", requestId, days: 14, note: "Keyfiyyətli elan", now })).resolves.toMatchObject({ ok: true });
    await expect(approveVip({ actorId: "vip-admin", requestId, days: 14, note: null, now })).resolves.toEqual({ ok: false, reason: "notFound" });
    const row = await prisma.vipRequest.findUniqueOrThrow({ where: { id: requestId } });
    expect(row).toMatchObject({ status: "APPROVED", decidedById: "vip-admin", requestedDays: 14, message: "Zəhmət olmasa" });
    expect(row.endsAt?.getTime()).toBe(now.getTime() + 14 * DAY);
    expect(await featured("vip-p1")).toEqual({ isFeatured: true, featuredUntil: row.endsAt });
    expect(await prisma.notification.count({ where: { userId: "vip-owner", type: "VIP" } })).toBe(1);
    await expect(requestVip({ userId: "vip-owner", propertyId: "vip-p1", days: 30, now })).resolves.toEqual({ ok: false, reason: "active" });

    // Uzatma və performans.
    const extended = await extendVip({ actorId: "vip-admin", requestId, days: 7, now });
    expect(extended.ok && extended.endsAt?.getTime()).toBe(now.getTime() + 21 * DAY);
    expect((await featured("vip-p1")).featuredUntil?.getTime()).toBe(now.getTime() + 21 * DAY);
    const dashboard = await getVipDashboard(new Date(now.getTime() + 3 * DAY));
    const active = dashboard.active.find((item) => item.id === requestId);
    expect(active?.performance).toEqual({ views: 40, uniqueViews: 25, contactReveals: 3, leads: 0 });
    expect(active?.decidedBy?.name).toBe("Admin");
  });

  it("rədd səbəb tələb edir və sahibə bildirilir; kabinet vəziyyəti son sorğunu göstərir", async () => {
    const sent = await requestVip({ userId: "vip-owner", propertyId: "vip-p2", days: 30, now });
    const requestId = sent.ok ? sent.requestId : "";
    await expect(rejectVip({ actorId: "vip-admin", requestId, note: "yox" })).resolves.toEqual({ ok: false, reason: "note" });
    await expect(rejectVip({ actorId: "vip-admin", requestId, note: "Foto keyfiyyəti aşağıdır", now })).resolves.toMatchObject({ ok: true });
    expect((await featured("vip-p2")).isFeatured).toBe(false);
    const state = await getOwnerVipState(["vip-p1", "vip-p2"], now);
    expect(state.get("vip-p2")).toMatchObject({ status: "REJECTED", note: "Foto keyfiyyəti aşağıdır" });
    expect(state.get("vip-p1")?.status).toBe("APPROVED");
  });

  it("özünəxidmət açıq və təsdiq bayrağı bağlıdırsa sorğu dərhal təsdiqlənir", async () => {
    await setFlags({ VIP_SELF_SERVICE_ENABLED: true, ADMIN_APPROVAL_FOR_VIP: false });
    const sent = await requestVip({ userId: "vip-owner", propertyId: "vip-p2", days: 7, now });
    expect(sent).toMatchObject({ ok: true, approved: true });
    const row = await prisma.vipRequest.findUniqueOrThrow({ where: { id: sent.ok ? sent.requestId : "" } });
    expect(row).toMatchObject({ status: "APPROVED", source: "SELF_SERVICE", decidedById: null });
  });

  it("birbaşa verilmə, ləğv elanı söndürür, bitmiş dövr EXPIRED olur", async () => {
    const granted = await grantVip({ actorId: "vip-admin", propertyId: "vip-p4", days: 7, note: null, now });
    expect(granted.ok).toBe(true);
    expect((await featured("vip-p4")).isFeatured).toBe(true);
    await expect(revokeVip({ actorId: "vip-admin", requestId: granted.requestId!, note: "Qaydalara zidd məzmun", now })).resolves.toMatchObject({ ok: true });
    expect(await featured("vip-p4")).toEqual({ isFeatured: false, featuredUntil: null });
    expect((await prisma.vipRequest.findUniqueOrThrow({ where: { id: granted.requestId! } })).status).toBe("REVOKED");

    const expired = await expireVipGrants(new Date(now.getTime() + 60 * DAY));
    expect(expired).toBeGreaterThanOrEqual(2);
    expect(await prisma.vipRequest.count({ where: { status: "APPROVED" } })).toBe(0);
  });
});
