import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  accountWriteBlock,
  appealRestriction,
  applyRestriction,
  assessAccountTrust,
  decideAppeal,
  liftRestriction,
  postingGate,
  refreshAccountTrust,
} from "@/lib/account-trust";
import { maxDuplicateCount, scoreTrust, suggestedRestriction, trustLevel } from "@/lib/moderation/trust-signals";

/** Hesab etibarlılığı (#258, PRD Modul 18) real D1-də: siqnallar, tədbirlər, qapılar, etiraz. */
const DB = (env as unknown as { DB: D1Database }).DB;

describe("siqnal qaydaları", () => {
  it("bal, səviyyə və tövsiyə", () => {
    expect(maxDuplicateCount(["Mənzil  satılır", "mənzil satılır", "Ev"])).toBe(2);
    expect(scoreTrust([{ code: "AUTOMATION", value: 20 }, { code: "CONFIRMED_REPORTS", value: 3 }])).toBe(60);
    expect(trustLevel(60)).toBe("high");
    expect(trustLevel(25)).toBe("none");
    expect(suggestedRestriction([{ code: "DUPLICATE_BURST", value: 4 }, { code: "REVIEW_BURST", value: 3 }])).toBe("POSTING_LIMIT");
    expect(suggestedRestriction([{ code: "REVIEW_BURST", value: 3 }])).toBeNull();
  });
});

beforeAll(async () => {
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "createdAt", "updatedAt") VALUES (?, ?, ?, 'Qısa', 'x', 'SALE', 'PUBLISHED', 1000, 'tr-type', 'tr-city', 'tr-user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare(`INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES ('tr-type', 'Mənzil', 'menzil', 'tr-menzil')`),
    DB.prepare(`INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES ('tr-city', 'Tr', 'tr', 'tr-city', 'CITY', NULL, 0)`),
    DB.prepare(`INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES ('tr-user', 'İstifadəçi', 'tr@example.test', 'disabled', 'EDITOR', 'OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`),
    property.bind("tr-1", "Bakıda mənzil", "tr-1"),
    property.bind("tr-2", "bakıda  mənzil", "tr-2"),
    property.bind("tr-3", "Bakıda Mənzil", "tr-3"),
  ]);
});

describe("hesab tədbirləri", () => {
  it("eyni elanlar siqnal verir və bal yazılır", async () => {
    const flags = await assessAccountTrust("tr-user");
    expect(flags?.map((flag) => flag.code)).toContain("DUPLICATE_BURST");
    const refreshed = await refreshAccountTrust("tr-user");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: "tr-user" } })).trustScore).toBe(refreshed?.score);
  });

  it("paylaşım limiti, əlavə təsdiq və moderator yoxlaması yeni elan qapısında işləyir", async () => {
    await expect(postingGate("tr-user")).resolves.toEqual({ ok: true, review: false });
    await expect(applyRestriction({ staffId: "mod-a", userId: "tr-user", kind: "POSTING_LIMIT", reason: "qısa" })).resolves.toEqual({ ok: false, reason: "reason" });
    const limit = await applyRestriction({ staffId: "mod-a", userId: "tr-user", kind: "POSTING_LIMIT", reason: "Qısa müddətdə eyni elanlar" });
    expect(limit.ok).toBe(true);
    await expect(postingGate("tr-user")).resolves.toEqual({ ok: false, reason: "limit" });
    await applyRestriction({ staffId: "mod-a", userId: "tr-user", kind: "EXTRA_VERIFICATION", reason: "Telefon təsdiqi tələb olunur" });
    await expect(postingGate("tr-user")).resolves.toEqual({ ok: false, reason: "verification" });
    expect(await prisma.notification.count({ where: { userId: "tr-user", type: "ACCOUNT_RESTRICTION" } })).toBe(2);
  });

  it("müvəqqəti məhdudiyyət yazmanı bağlayır; etirazı başqa əməkdaş həll edir və qəbul tədbiri götürür", async () => {
    await expect(accountWriteBlock("tr-user", "az")).resolves.toBeNull();
    const suspension = await applyRestriction({ staffId: "mod-a", userId: "tr-user", kind: "TEMP_SUSPENSION", reason: "Təkrarlanan şikayətlər səbəbilə" });
    const id = suspension.ok ? suspension.id : "";
    await expect(accountWriteBlock("tr-user", "en")).resolves.toContain("restriction");

    await expect(appealRestriction({ userId: "tr-user", restrictionId: id, message: "qısa" })).resolves.toEqual({ ok: false, reason: "message" });
    await expect(appealRestriction({ userId: "tr-user", restrictionId: id, message: "Bu elanlar fərqli mənzillərdir, səhv anlaşılma olub" })).resolves.toEqual({ ok: true });
    await expect(appealRestriction({ userId: "tr-user", restrictionId: id, message: "Bu elanlar fərqli mənzillərdir, ikinci etiraz" })).resolves.toEqual({ ok: false, reason: "open" });
    const appeal = await prisma.accountRestrictionAppeal.findFirstOrThrow({ where: { restrictionId: id } });
    await expect(decideAppeal({ staffId: "mod-a", appealId: appeal.id, accept: true, note: "Haqlıdır" })).resolves.toEqual({ ok: false, reason: "sameReviewer" });
    await expect(decideAppeal({ staffId: "mod-b", appealId: appeal.id, accept: true, note: "Yoxlandı, haqlıdır" })).resolves.toEqual({ ok: true });
    await expect(accountWriteBlock("tr-user", "az")).resolves.toBeNull();
    const lifted = await prisma.accountRestriction.findUniqueOrThrow({ where: { id } });
    expect(lifted.liftedById).toBe("mod-b");
    expect(lifted.evidence).not.toBeNull();

    // Bloku yalnız `user:manage` götürür; etiraz qəbulu da eyni qaydaya tabedir.
    const block = await applyRestriction({ staffId: "mod-a", userId: "tr-user", kind: "BLOCK", reason: "Ağır qayda pozuntusu səbəbilə" });
    const blockId = block.ok ? block.id : "";
    await expect(liftRestriction({ staffId: "mod-b", restrictionId: blockId, reason: "Səhv qərar" })).resolves.toEqual({ ok: false, reason: "blockPermission" });
    await appealRestriction({ userId: "tr-user", restrictionId: blockId, message: "Bloka etiraz edirəm, səhv qərardır" });
    const blockAppeal = await prisma.accountRestrictionAppeal.findFirstOrThrow({ where: { restrictionId: blockId } });
    await expect(decideAppeal({ staffId: "mod-b", appealId: blockAppeal.id, accept: true, note: "Haqlıdır" })).resolves.toEqual({ ok: false, reason: "blockPermission" });
    expect((await prisma.accountRestrictionAppeal.findUniqueOrThrow({ where: { id: blockAppeal.id } })).status).toBe("OPEN");
    await expect(decideAppeal({ staffId: "mod-b", appealId: blockAppeal.id, accept: true, note: "Haqlıdır", canLiftBlock: true })).resolves.toEqual({ ok: true });
  });
});
