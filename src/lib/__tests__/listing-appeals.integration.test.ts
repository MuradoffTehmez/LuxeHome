import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { APPEAL_STATUSES, LOCATION_KINDS, PROPERTY_STATUSES, PROPERTY_STATUS_SOURCES } from "@/lib/constants";
import { countOpenAppeals, decideListingAppeal, getAppealQueue, getOwnerAppeals, submitListingAppeal } from "@/lib/listing-appeals";
import { getPropertyHistory, recordPropertyStatusChange } from "@/lib/property-status-history";
import { prisma } from "@/lib/prisma";

/** Moderasiya qərarına etiraz (#206, PRD 20.4) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const MESSAGE = "Şəkillər bu əmlakındır, sənədlər də məndədir — elan qaydalara uyğundur.";

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "moderationNote", "price", "typeId", "cityId",
       "authorId", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'T', 'x', 'SALE', ?, 'Moderator səbəbi', 1000, 'ap-type', 'ap-city', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("ap-type", "Mənzil", "menzil", "ap-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("ap-city", "Bakı", "baki", "ap-baki", LOCATION_KINDS.CITY),
    user.bind("ap-owner", "Sahib", "ap-owner@example.test", "disabled", "EDITOR", "OWNER"),
    user.bind("ap-other", "Başqası", "ap-other@example.test", "disabled", "EDITOR", "OWNER"),
    user.bind("ap-mod-a", "Moderator A", "ap-a@example.test", "disabled", "ADMIN", "STAFF"),
    user.bind("ap-mod-b", "Moderator B", "ap-b@example.test", "disabled", "ADMIN", "STAFF"),
    property.bind("ap-suspended", "Dayandırılmış", "ap-suspended", PROPERTY_STATUSES.SUSPENDED, "ap-owner"),
    property.bind("ap-rejected", "Rədd edilmiş", "ap-rejected", PROPERTY_STATUSES.REJECTED, "ap-owner"),
    property.bind("ap-live", "Aktiv", "ap-live", PROPERTY_STATUSES.PUBLISHED, "ap-owner"),
  ]);
  // Qərarları moderator A verib — tarixçədən oxunur.
  await recordPropertyStatusChange({
    propertyId: "ap-suspended", from: PROPERTY_STATUSES.PUBLISHED, to: PROPERTY_STATUSES.SUSPENDED, source: PROPERTY_STATUS_SOURCES.MODERATION, changedById: "ap-mod-a",
  });
  await recordPropertyStatusChange({
    propertyId: "ap-rejected", from: PROPERTY_STATUSES.PENDING, to: PROPERTY_STATUSES.REJECTED, source: PROPERTY_STATUS_SOURCES.MODERATION, changedById: "ap-mod-a",
  });
});

describe("etiraz göndərmə", () => {
  it("yalnız sahib, yalnız rədd edilmiş/dayandırılmış elana, bir açıq etiraz", async () => {
    await expect(submitListingAppeal({ propertyId: "ap-live", userId: "ap-owner", message: MESSAGE })).resolves.toBe("notAllowed");
    await expect(submitListingAppeal({ propertyId: "ap-suspended", userId: "ap-other", message: MESSAGE })).resolves.toBe("notAllowed");
    await expect(submitListingAppeal({ propertyId: "ap-suspended", userId: "ap-owner", message: MESSAGE })).resolves.toBe("created");
    await expect(submitListingAppeal({ propertyId: "ap-suspended", userId: "ap-owner", message: MESSAGE })).resolves.toBe("duplicate");
    await expect(submitListingAppeal({ propertyId: "ap-rejected", userId: "ap-owner", message: MESSAGE })).resolves.toBe("created");

    const appeal = await prisma.listingAppeal.findFirst({ where: { propertyId: "ap-suspended" } });
    expect(appeal).toMatchObject({ appealedStatus: "SUSPENDED", previousStatus: "PUBLISHED", decidedById: "ap-mod-a", status: "OPEN" });
    await expect(countOpenAppeals()).resolves.toBe(2);
    const queue = await getAppealQueue();
    expect(queue.find((item) => item.propertyId === "ap-suspended")?.decidedBy).toBe("Moderator A");
    expect((await getOwnerAppeals(["ap-suspended"])).get("ap-suspended")?.status).toBe(APPEAL_STATUSES.OPEN);
  });
});

describe("etirazın həlli", () => {
  it("qərarı verən moderator öz qərarına baxa bilmir (müstəqil baxış)", async () => {
    const appeal = await prisma.listingAppeal.findFirstOrThrow({ where: { propertyId: "ap-suspended" } });
    await expect(decideListingAppeal({ appealId: appeal.id, reviewerId: "ap-mod-a", accept: true, note: null }))
      .resolves.toEqual({ result: "sameReviewer" });
  });

  it("qəbulda dayandırılmış elan əvvəlki dərc statusuna qayıdır və tarixçəyə yazılır", async () => {
    const appeal = await prisma.listingAppeal.findFirstOrThrow({ where: { propertyId: "ap-suspended" } });
    const result = await decideListingAppeal({ appealId: appeal.id, reviewerId: "ap-mod-b", accept: true, note: null });
    expect(result).toMatchObject({ result: "decided", accepted: true, restoredStatus: "PUBLISHED" });

    const property = await prisma.property.findUniqueOrThrow({ where: { id: "ap-suspended" }, select: { status: true, moderationNote: true } });
    expect(property).toEqual({ status: "PUBLISHED", moderationNote: null });
    const [entry] = await getPropertyHistory("ap-suspended");
    expect(entry).toMatchObject({ kind: "status", from: "SUSPENDED", to: "PUBLISHED", source: "MODERATION", note: "Etiraz qəbul edildi" });
    // Həll edilmiş etiraz təkrar həll edilmir.
    await expect(decideListingAppeal({ appealId: appeal.id, reviewerId: "ap-mod-b", accept: false, note: "x" }))
      .resolves.toEqual({ result: "notFound" });
  });

  it("yeni qərar dövründə köhnə etiraz bağlanır, yeni qərarverən öz qərarına baxa bilmir; rəddə status dəyişmir", async () => {
    const old = await prisma.listingAppeal.findFirstOrThrow({ where: { propertyId: "ap-rejected", status: APPEAL_STATUSES.OPEN } });
    // Sahib redaktə edir → PENDING, moderator B yenidən rədd edir → yeni qərar dövrü.
    await prisma.property.update({ where: { id: "ap-rejected" }, data: { status: PROPERTY_STATUSES.PENDING } });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await prisma.property.update({ where: { id: "ap-rejected" }, data: { status: PROPERTY_STATUSES.REJECTED } });
    await recordPropertyStatusChange({
      propertyId: "ap-rejected", from: PROPERTY_STATUSES.PENDING, to: PROPERTY_STATUSES.REJECTED, source: PROPERTY_STATUS_SOURCES.MODERATION, changedById: "ap-mod-b",
    });

    // Köhnə etiraz yeni qərara aid deyil — moderator B onun üzərindən öz qərarına baxa bilməz.
    await expect(decideListingAppeal({ appealId: old.id, reviewerId: "ap-mod-b", accept: true, note: null }))
      .resolves.toEqual({ result: "stale" });
    expect((await prisma.listingAppeal.findUniqueOrThrow({ where: { id: old.id } })).status).toBe(APPEAL_STATUSES.CLOSED);

    // Sahib yeni qərara etiraz edir; qərarverən indi B-dir.
    await expect(submitListingAppeal({ propertyId: "ap-rejected", userId: "ap-owner", message: MESSAGE })).resolves.toBe("created");
    const fresh = await prisma.listingAppeal.findFirstOrThrow({ where: { propertyId: "ap-rejected", status: APPEAL_STATUSES.OPEN } });
    expect(fresh.decidedById).toBe("ap-mod-b");
    await expect(decideListingAppeal({ appealId: fresh.id, reviewerId: "ap-mod-b", accept: true, note: null }))
      .resolves.toEqual({ result: "sameReviewer" });

    const rejected = await decideListingAppeal({ appealId: fresh.id, reviewerId: "ap-mod-a", accept: false, note: "Sənəd təqdim edilməyib." });
    expect(rejected).toMatchObject({ result: "decided", accepted: false, restoredStatus: null });
    expect((await prisma.property.findUniqueOrThrow({ where: { id: "ap-rejected" } })).status).toBe(PROPERTY_STATUSES.REJECTED);
    expect(await prisma.listingAppeal.findUniqueOrThrow({ where: { id: fresh.id } }))
      .toMatchObject({ status: "REJECTED", reviewerId: "ap-mod-a", decisionNote: "Sənəd təqdim edilməyib." });
  });

  it("eyni anda iki göndərişdən yalnız biri açıq qalır", async () => {
    await DB.prepare(
      `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId", "authorId", "createdAt", "updatedAt")
       VALUES ('ap-race', 'Yarış', 'ap-race', 'T', 'x', 'SALE', 'SUSPENDED', 1000, 'ap-type', 'ap-city', 'ap-owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    ).run();
    const results = await Promise.all([
      submitListingAppeal({ propertyId: "ap-race", userId: "ap-owner", message: MESSAGE }),
      submitListingAppeal({ propertyId: "ap-race", userId: "ap-owner", message: MESSAGE }),
    ]);
    expect(results.filter((result) => result === "created")).toHaveLength(1);
    await expect(prisma.listingAppeal.count({ where: { propertyId: "ap-race", status: APPEAL_STATUSES.OPEN } })).resolves.toBe(1);
  });

  it("növbə 98-dən çox etirazda D1 parametr həddini aşmır", async () => {
    const insert = DB.prepare(
      `INSERT INTO "ListingAppeal" ("id", "propertyId", "authorId", "appealedStatus", "message", "status", "createdAt") VALUES (?, 'ap-race', 'ap-owner', 'SUSPENDED', 'x', 'REJECTED', CURRENT_TIMESTAMP)`,
    );
    await DB.batch(Array.from({ length: 110 }, (_, index) => insert.bind(`ap-bulk-${index}`)));
    const queue = await getAppealQueue(APPEAL_STATUSES.REJECTED);
    expect(queue.length).toBeGreaterThanOrEqual(110);
    expect(queue.every((item) => item.property.title && item.author?.name === "Sahib")).toBe(true);
  });
});
