import { env } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { PROMOTION_COOLDOWN_DAYS, PROPERTY_STATUSES } from "@/lib/constants";
import { SETTING_KEYS } from "@/lib/settings";
import { getProperties } from "@/lib/queries";
import {
  approvePromotion,
  expirePromotions,
  getOwnerPromotionState,
  getPromotionDashboard,
  grantPromotion,
  rejectPromotion,
  requestPromotion,
  revokePromotion,
} from "@/lib/promotion";

/** Elanı irəli çəkmə (#250, PRD Modul 13) real D1-də: sorğu, təsdiq, sıralama, fasilə, bitmə. */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;
const now = new Date();

beforeAll(async () => {
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'pr-axtaris', 'SALE', ?, 1000, 'pr-type', 'pr-city', 'pr-owner', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (\'pr-type\', \'Mənzil\', \'menzil\', \'pr-menzil\')'),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (\'pr-city\', \'Prcity\', \'prcity\', \'pr-prcity\', \'CITY\', NULL, 0)'),
    DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (\'pr-owner\', \'Sahib\', \'pr@example.test\', \'disabled\', \'EDITOR\', \'OWNER\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    // pr-old ən köhnə dərc tarixlidir — irəli çəkiləndə siyahının əvvəlinə keçməlidir.
    property.bind("pr-old", "Köhnə", "pr-old", PROPERTY_STATUSES.PUBLISHED, new Date(now.getTime() - 30 * DAY).toISOString()),
    property.bind("pr-mid", "Orta", "pr-mid", PROPERTY_STATUSES.PUBLISHED, new Date(now.getTime() - 10 * DAY).toISOString()),
    property.bind("pr-new", "Təzə", "pr-new", PROPERTY_STATUSES.PUBLISHED, new Date(now.getTime() - DAY).toISOString()),
    property.bind("pr-draft", "Qaralama", "pr-draft", PROPERTY_STATUSES.DRAFT, null),
  ]);
});

async function setFlags(flags: Record<string, boolean> | null) {
  await DB.prepare('DELETE FROM "Setting" WHERE "key" = ?').bind(SETTING_KEYS.FEATURE_FLAGS).run();
  if (flags) await DB.prepare('INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES (?, ?, CURRENT_TIMESTAMP)').bind(SETTING_KEYS.FEATURE_FLAGS, JSON.stringify(flags)).run();
}
afterEach(() => setFlags(null));

const order = async () => (await getProperties({ citySlug: "pr-prcity" })).items.map((item) => item.id);

describe("irəli çəkmə", () => {
  it("modul bağlı, qaralama və səhv müddət rədd olunur", async () => {
    await setFlags({ PROMOTION: false });
    await expect(requestPromotion({ userId: "pr-owner", propertyId: "pr-old", days: 7, now })).resolves.toEqual({ ok: false, reason: "disabled" });
    await setFlags(null);
    await expect(requestPromotion({ userId: "pr-owner", propertyId: "pr-draft", days: 7, now })).resolves.toEqual({ ok: false, reason: "listing" });
    await expect(requestPromotion({ userId: "pr-owner", propertyId: "pr-old", days: 5, now })).resolves.toEqual({ ok: false, reason: "duration" });
  });

  it("təsdiqlənmiş kampaniya elanı aktuallıq sıralamasında birinci edir; bitəndə üstünlük gedir və fasilə tətbiq olunur", async () => {
    expect(await order()).toEqual(["pr-new", "pr-mid", "pr-old"]);
    const sent = await requestPromotion({ userId: "pr-owner", propertyId: "pr-old", days: 3, message: "Tez satmaq istəyirəm", now });
    expect(sent).toMatchObject({ ok: true, started: false });
    await expect(requestPromotion({ userId: "pr-owner", propertyId: "pr-old", days: 3, now })).resolves.toEqual({ ok: false, reason: "pending" });
    const campaignId = sent.ok ? sent.campaignId : "";
    await expect(approvePromotion({ actorId: "staff", campaignId, days: 3, note: null, now })).resolves.toMatchObject({ ok: true });
    expect(await order()).toEqual(["pr-old", "pr-new", "pr-mid"]);
    await expect(requestPromotion({ userId: "pr-owner", propertyId: "pr-old", days: 3, now })).resolves.toEqual({ ok: false, reason: "active" });

    const dashboard = await getPromotionDashboard(now);
    expect(dashboard.active.map((row) => row.id)).toContain(campaignId);

    // Bitmə (cron) — üstünlük və status təmizlənir; dərhal yeni sorğu fasiləyə düşür.
    const later = new Date(now.getTime() + 4 * DAY);
    await expect(expirePromotions(later)).resolves.toEqual({ campaigns: 1, listings: 1 });
    expect(await order()).toEqual(["pr-new", "pr-mid", "pr-old"]);
    const blocked = await requestPromotion({ userId: "pr-owner", propertyId: "pr-old", days: 3, now: later });
    expect(blocked).toMatchObject({ ok: false, reason: "cooldown" });
    expect(blocked.ok === false && blocked.availableAt?.getTime()).toBe(now.getTime() + (3 + PROMOTION_COOLDOWN_DAYS) * DAY);
    const state = await getOwnerPromotionState(["pr-old"], later);
    expect(state.get("pr-old")).toMatchObject({ status: "EXPIRED" });
    expect(state.get("pr-old")?.availableAt).not.toBeNull();
  });

  it("rədd səbəb tələb edir; dayandırma üstünlüyü dərhal götürür; özünəxidmət dərhal başlayır", async () => {
    const sent = await requestPromotion({ userId: "pr-owner", propertyId: "pr-mid", days: 7, now });
    const campaignId = sent.ok ? sent.campaignId : "";
    await expect(rejectPromotion({ actorId: "staff", campaignId, note: "yox" })).resolves.toEqual({ ok: false, reason: "note" });
    await expect(rejectPromotion({ actorId: "staff", campaignId, note: "Foto keyfiyyəti aşağıdır", now })).resolves.toMatchObject({ ok: true });
    // Əvvəlki testdəki təsdiq + bu rədd — iki bildiriş.
    expect(await prisma.notification.count({ where: { userId: "pr-owner", type: "PROMOTION" } })).toBe(2);

    const granted = await grantPromotion({ actorId: "staff", propertyId: "pr-mid", days: 1, note: null, now });
    expect(granted.ok).toBe(true);
    await expect(grantPromotion({ actorId: "staff", propertyId: "pr-mid", days: 1, note: null, now })).resolves.toMatchObject({ ok: false, blocked: "active" });
    await expect(revokePromotion({ actorId: "staff", campaignId: granted.campaignId!, note: "Qaydalara zidd", now })).resolves.toMatchObject({ ok: true });
    expect((await prisma.property.findUniqueOrThrow({ where: { id: "pr-mid" } })).promotedUntil).toBeNull();
    // Dayandırılmış kampaniyadan sonra fasilə birbaşa verilməyə də aiddir; modul bağlıdırsa admin də başlada bilmir.
    await expect(grantPromotion({ actorId: "staff", propertyId: "pr-mid", days: 1, note: null, now })).resolves.toMatchObject({ ok: false, blocked: "cooldown" });
    await setFlags({ PROMOTION: false });
    await expect(grantPromotion({ actorId: "staff", propertyId: "pr-new", days: 1, note: null, now })).resolves.toEqual({ ok: false, reason: "disabled" });
    await setFlags(null);

    await setFlags({ PROMOTION_SELF_SERVICE_ENABLED: true });
    const self = await requestPromotion({ userId: "pr-owner", propertyId: "pr-new", days: 1, now });
    expect(self).toMatchObject({ ok: true, started: true });
    expect((await prisma.promotionCampaign.findUniqueOrThrow({ where: { id: self.ok ? self.campaignId : "" } })).source).toBe("SELF_SERVICE");
  });
});
