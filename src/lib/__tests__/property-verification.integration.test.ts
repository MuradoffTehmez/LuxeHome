import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { PROPERTY_STATUSES } from "@/lib/constants";
import { SETTING_KEYS } from "@/lib/settings";
import {
  decideDocuments,
  deletePendingDocument,
  getListingVerification,
  isDocumentKind,
  openDocumentForStaff,
  purgeReviewedDocuments,
  setDataVerified,
  uploadPropertyDocuments,
  verificationBadges,
} from "@/lib/property-verification";

/** Əmlak və profil doğrulaması (#256, PRD Modul 17) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;
const now = new Date("2026-10-18T10:00:00Z");

describe("nişan qaydaları", () => {
  it("hər səviyyə ayrı nişandır; NONE sənəd növü deyil", () => {
    expect(verificationBadges({ phoneVerified: true, emailVerified: false, agencyVerified: false, documentsVerified: false, dataVerified: false })).toEqual(["PHONE"]);
    expect(verificationBadges({ phoneVerified: true, emailVerified: true, agencyVerified: true, documentsVerified: true, dataVerified: true })).toEqual(["PHONE", "EMAIL", "AGENCY", "DOCUMENTS", "DATA"]);
    expect(isDocumentKind("TITLE_DEED")).toBe(true);
    expect(isDocumentKind("NONE")).toBe(false);
    expect(isDocumentKind("X")).toBe(false);
  });
});

beforeAll(async () => {
  await DB.batch([
    DB.prepare(`INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES ('pv-type', 'Mənzil', 'menzil', 'pv-menzil')`),
    DB.prepare(`INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES ('pv-city', 'Pv', 'pv', 'pv-city', 'CITY', NULL, 0)`),
    DB.prepare(`INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "verifiedPhone", "createdAt", "updatedAt") VALUES ('pv-owner', 'Sahib', 'pv@example.test', 'disabled', 'EDITOR', 'OWNER', '+994500000001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`),
    DB.prepare(`INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "createdAt", "updatedAt") VALUES ('pv-p1', 'Elan', 'pv-p1', 'Təsvir', 'x', 'SALE', ?, 1000, 'pv-type', 'pv-city', 'pv-owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(PROPERTY_STATUSES.PUBLISHED),
    DB.prepare(`INSERT INTO "PropertyDocument" ("id", "propertyId", "uploaderId", "kind", "key", "contentType", "size") VALUES ('pv-d1', 'pv-p1', 'pv-owner', 'TITLE_DEED', 'private/senedler/a.webp', 'image/webp', 10), ('pv-d2', 'pv-p1', 'pv-owner', 'CONTRACT', 'private/senedler/b.webp', 'image/webp', 10)`),
  ]);
});

describe("sənəd axını", () => {
  it("telefon nişanı sənəd nişanı demək deyil; təsdiq yalnız sənəd nişanını verir", async () => {
    expect(await getListingVerification("pv-p1")).toEqual(["PHONE"]);
    await expect(decideDocuments({ staffId: "staff", propertyId: "pv-p1", verified: false, note: "yox" })).resolves.toEqual({ ok: false, reason: "note" });
    await expect(decideDocuments({ staffId: "staff", propertyId: "pv-p1", verified: true, now })).resolves.toEqual({ ok: true });
    expect(await getListingVerification("pv-p1")).toEqual(["PHONE", "DOCUMENTS"]);
    await setDataVerified({ staffId: "staff", propertyId: "pv-p1", verified: true, now });
    expect(await getListingVerification("pv-p1")).toEqual(["PHONE", "DOCUMENTS", "DATA"]);
    const rows = await prisma.propertyDocument.findMany({ where: { propertyId: "pv-p1" } });
    expect(rows.every((row) => row.status === "VERIFIED" && row.purgeAfter && row.reviewedById === "staff")).toBe(true);
    // Qərar və baxış tarixçəyə yazılır.
    await openDocumentForStaff({ documentId: "pv-d1", staffId: "staff" });
    expect(await prisma.documentAccessLog.count({ where: { propertyId: "pv-p1", action: "DECISION" } })).toBe(2);
    expect(await prisma.documentAccessLog.count({ where: { documentId: "pv-d1", action: "VIEW" } })).toBe(1);
  });

  it("sahib yalnız gözləyən sənədini silir; saxlama müddəti bitəndə sənədlər silinir", async () => {
    await DB.prepare(`INSERT INTO "PropertyDocument" ("id", "propertyId", "uploaderId", "kind", "key", "contentType", "size") VALUES ('pv-d3', 'pv-p1', 'pv-owner', 'CONTRACT', 'private/senedler/c.webp', 'image/webp', 10)`).run();
    await expect(deletePendingDocument({ userId: "başqası", documentId: "pv-d3" })).resolves.toBe(false);
    await expect(deletePendingDocument({ userId: "pv-owner", documentId: "pv-d1" })).resolves.toBe(false);
    await expect(deletePendingDocument({ userId: "pv-owner", documentId: "pv-d3" })).resolves.toBe(true);
    await expect(purgeReviewedDocuments(new Date(now.getTime() + 10 * DAY))).resolves.toBe(0);
    await expect(purgeReviewedDocuments(new Date(now.getTime() + 31 * DAY))).resolves.toBe(2);
    expect(await prisma.propertyDocument.count({ where: { propertyId: "pv-p1" } })).toBe(0);
    // Giriş tarixçəsi sənəd silinəndən sonra da qalır.
    expect(await prisma.documentAccessLog.count({ where: { propertyId: "pv-p1" } })).toBeGreaterThanOrEqual(3);
  });
});

describe("«Əlavə doğrulamalar» açarı (#268)", () => {
  it("söndürüləndə sənəd qəbul olunmur, sənəd/məlumat nişanları gizlənir; açılanda qayıdır", async () => {
    await setDataVerified({ staffId: "pv-staff", propertyId: "pv-p1", verified: true, now });
    await DB.prepare('INSERT OR REPLACE INTO "Setting" ("key", "value", "updatedAt") VALUES (?, ?, CURRENT_TIMESTAMP)').bind(SETTING_KEYS.FEATURE_FLAGS, JSON.stringify({ EXTRA_VERIFICATION: false })).run();
    const file = new File([new Uint8Array([1, 2, 3])], "a.webp", { type: "image/webp" });
    expect(await uploadPropertyDocuments({ userId: "pv-owner", propertyId: "pv-p1", kind: "TITLE_DEED", files: [file] })).toEqual({ ok: false, reason: "disabled" });
    expect(await getListingVerification("pv-p1")).not.toContain("DATA");
    await DB.prepare('DELETE FROM "Setting" WHERE "key" = ?').bind(SETTING_KEYS.FEATURE_FLAGS).run();
    expect(await getListingVerification("pv-p1")).toContain("DATA");
  });
});
