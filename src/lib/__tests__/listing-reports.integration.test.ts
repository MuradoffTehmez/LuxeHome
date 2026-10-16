import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { LOCATION_KINDS, NOTIFICATION_TYPES, PROPERTY_STATUSES, REPORT_REASONS, REPORT_STATUSES } from "@/lib/constants";
import {
  addReportNote,
  assignActiveReports,
  getReportGroups,
  getReportQueueStats,
  getUserReports,
  parseReportCycleId,
  parseReportReasons,
  reopenDecidedReports,
  reportCycleId,
  requestReportInfo,
  revertReportInfoRequest,
  submitListingReport,
} from "@/lib/listing-reports";
import { noticeReportOutcome } from "@/lib/accounts/account-notices";
import { mediaKeyFromPath } from "@/lib/media-response";
import { activeOfferWhere, getClosedDeals } from "@/lib/agency-profile";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/revalidate-public", () => ({ revalidatePublicContent: vi.fn() }));

/** Şikayət (#159, iş axını #195) və bağlanmış sövdələşmələr real D1-də (elan təhvili: agency-ownership.integration). */
const DB = (env as unknown as { DB: D1Database }).DB;
const MEDIA = (env as unknown as { MEDIA: R2Bucket }).MEDIA;
/** PNG imzası — `sniffImageType()` yalnız ilk baytlara baxır; test mühitində `IMAGES` yoxdur, fayl olduğu kimi yazılır. */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const DAY = 86_400_000;

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const property = DB.prepare(
    `INSERT INTO "Property" ("id", "title", "slug", "description", "searchText", "listingType", "status", "price", "typeId", "cityId",
       "authorId", "closedAt", "publishedAt", "createdAt", "updatedAt")
     VALUES (?, ?, ?, 'Təsvir', 'x', ?, ?, 1000, 'rep-type', 'rep-city', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`,
  );
  const now = new Date().toISOString();
  const old = new Date(Date.now() - 400 * DAY).toISOString();
  await DB.batch([
    DB.prepare('INSERT INTO "PropertyType" ("id", "name", "searchName", "slug") VALUES (?, ?, ?, ?)').bind("rep-type", "Mənzil", "menzil", "rep-menzil"),
    DB.prepare('INSERT INTO "Location" ("id", "name", "searchName", "slug", "kind", "parentId", "order") VALUES (?, ?, ?, ?, ?, NULL, 0)').bind("rep-city", "Bakı", "baki", "rep-baki", LOCATION_KINDS.CITY),
    user.bind("rep-agent", "Agent", "rep-agent@example.test", "disabled", "EDITOR", "AGENT"),
    user.bind("rep-owner", "Agentlik", "rep-owner@example.test", "disabled", "EDITOR", "AGENCY"),
    property.bind("rep-live", "Aktiv", "rep-live", "SALE", PROPERTY_STATUSES.PUBLISHED, "rep-agent", null, now),
    // İş axını testi üçün müəllifsiz (şirkət) elan — agentin elan saylarına təsir etmir.
    property.bind("rep-flow", "Axın", "rep-flow", "SALE", PROPERTY_STATUSES.PUBLISHED, null, null, now),
    user.bind("rep-moderator", "Moderator", "rep-moderator@example.test", "disabled", "ADMIN", "STAFF"),
    property.bind("rep-draft", "Qaralama", "rep-draft", "SALE", PROPERTY_STATUSES.DRAFT, "rep-agent", null, now),
    property.bind("rep-sold", "Satılıb", "rep-sold", "SALE", PROPERTY_STATUSES.SOLD, "rep-agent", now, now),
    property.bind("rep-rented", "İcarədə", "rep-rented", "RENT", PROPERTY_STATUSES.RENTED, "rep-agent", now, now),
    // Bağlanma tarixi olmayan qeyd sayılmır — `updatedAt` baxışla da dəyişir, tarix deyil.
    property.bind("rep-legacy", "Tarixsiz", "rep-legacy", "SALE", PROPERTY_STATUSES.SOLD, "rep-agent", null, now),
    // 12 aydan köhnə bağlanmış elan statistikaya düşmür.
    property.bind("rep-sold-old", "Köhnə satış", "rep-sold-old", "SALE", PROPERTY_STATUSES.SOLD, "rep-agent", old, old),
  ]);
});

describe("elan şikayəti", () => {
  it("bir neçə səbəblə şikayət yazır, eyni IP-dən 24 saat ərzində təkrarı süzür", async () => {
    const base = { propertyId: "rep-live", reasons: [REPORT_REASONS.FRAUD, REPORT_REASONS.PREPAYMENT], message: "Beh istədilər", userId: null };
    await expect(submitListingReport({ ...base, ip: "203.0.113.1" })).resolves.toBe("created");
    await expect(submitListingReport({ ...base, ip: "203.0.113.1" })).resolves.toBe("duplicate");
    await expect(submitListingReport({ ...base, reasons: [REPORT_REASONS.SOLD], message: null, ip: "203.0.113.2" })).resolves.toBe("created");

    const stored = await DB.prepare('SELECT "reporterKey", "reason", "reasons" FROM "ListingReport" WHERE "propertyId" = ? ORDER BY "createdAt"')
      .bind("rep-live").all<{ reporterKey: string; reason: string; reasons: string }>();
    // Xam IP saxlanmır — yalnız heş.
    expect(stored.results.every((row) => /^[0-9a-f]{64}$/.test(row.reporterKey))).toBe(true);
    // Əsas səbəb birincidir, bütün siyahı JSON-da.
    expect(stored.results.map((row) => [row.reason, JSON.parse(row.reasons)])).toEqual([
      ["FRAUD", ["FRAUD", "PREPAYMENT"]],
      ["SOLD", ["SOLD"]],
    ]);
  });

  it("qaralama və ya mövcud olmayan elana şikayət qəbul olunmur", async () => {
    const input = { reasons: [REPORT_REASONS.FAKE], message: null, ip: "203.0.113.3", userId: null };
    await expect(submitListingReport({ ...input, propertyId: "rep-draft" })).resolves.toBe("notFound");
    await expect(submitListingReport({ ...input, propertyId: "yoxdur" })).resolves.toBe("notFound");
  });

  it("admin növbəsi şikayətləri elan üzrə qruplaşdırır, beh tələbi yüksək prioritet verir", async () => {
    const groups = await getReportGroups();
    const group = groups.find((item) => item.property.id === "rep-live");
    expect(group?.count).toBe(2);
    expect(group?.status).toBe(REPORT_STATUSES.OPEN);
    expect(group?.priority).toBe("high");
    expect(new Map(group?.reasons)).toEqual(new Map([["FRAUD", 1], ["PREPAYMENT", 1], ["SOLD", 1]]));
    await expect(getReportGroups([REPORT_STATUSES.RESOLVED])).resolves.toEqual([]);
  });

  it("köhnə (#159) və pozulmuş qeydin səbəbi `reason` sütunundan oxunur", () => {
    expect(parseReportReasons("[]", "NOT_OWNER")).toEqual(["NOT_OWNER"]);
    expect(parseReportReasons("{pozuq", "FAKE")).toEqual(["FAKE"]);
    expect(parseReportReasons('["SOLD","naməlum","SOLD"]', "SOLD")).toEqual(["SOLD"]);
  });

  it("sübut şəkli yalnız daxil olmuş istifadəçidən saxlanılır və məxfi prefiksdədir", async () => {
    const file = () => new File([PNG], "subut.png", { type: "image/png" });
    await expect(submitListingReport({
      propertyId: "rep-flow", reasons: [REPORT_REASONS.FAKE], message: null, ip: "203.0.113.10", userId: null, evidence: [file()],
    })).resolves.toBe("created");
    await expect(submitListingReport({
      propertyId: "rep-flow", reasons: [REPORT_REASONS.PHOTOS_MISMATCH], message: null, ip: "203.0.113.11", userId: "rep-agent", evidence: [file(), file()],
    })).resolves.toBe("created");

    const evidence = await prisma.listingReportEvidence.findMany({ select: { key: true, report: { select: { reporterUserId: true } } } });
    // Qonağın faylı atılır, daxil olmuş istifadəçinin iki faylı qalır.
    expect(evidence).toHaveLength(2);
    expect(evidence.every((item) => item.report.reporterUserId === "rep-agent")).toBe(true);
    for (const item of evidence) {
      expect(item.key.startsWith("private/sikayet-subutlari/")).toBe(true);
      await expect(MEDIA.get(item.key)).resolves.not.toBeNull();
      // İctimai `/media/...` marşrutu məxfi açarı vermir.
      expect(mediaKeyFromPath(`/media/${item.key}`)).toBeNull();
    }
  });

  it("moderator götürür, yeni şikayət mərhələni miras alır, izahat istənir və qərar yenidən açılır", async () => {
    await expect(assignActiveReports("rep-flow", "rep-moderator")).resolves.toBe(2);
    await expect(submitListingReport({
      propertyId: "rep-flow", reasons: [REPORT_REASONS.WRONG_PHONE], message: null, ip: "203.0.113.12", userId: null,
    })).resolves.toBe("created");
    let rows = await prisma.listingReport.findMany({ where: { propertyId: "rep-flow" }, select: { status: true, assigneeId: true } });
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.status === REPORT_STATUSES.IN_REVIEW && row.assigneeId === "rep-moderator")).toBe(true);

    const first = await requestReportInfo({ propertyId: "rep-flow", actorId: "rep-moderator", note: "Sənədi təsdiqləyin." });
    expect(first).toEqual({ count: 3, previous: null });
    const group = (await getReportGroups([REPORT_STATUSES.NEEDS_INFO])).find((item) => item.property.id === "rep-flow");
    expect(group?.infoRequest?.note).toBe("Sənədi təsdiqləyin.");
    expect(group?.assignee?.id).toBe("rep-moderator");
    expect(group?.evidenceCount).toBe(2);

    // Admin qərarı: aktiv şikayətlər birlikdə rədd edilir (action-dakı şərti `updateMany`).
    const decidedAt = new Date();
    await prisma.listingReport.updateMany({
      where: { propertyId: "rep-flow", status: REPORT_STATUSES.NEEDS_INFO },
      data: { status: REPORT_STATUSES.DISMISSED, resolution: "NO_ACTION", resolvedById: "rep-moderator", resolvedAt: decidedAt },
    });
    const [dismissed] = (await getReportGroups([REPORT_STATUSES.DISMISSED])).filter((item) => item.property.id === "rep-flow");
    expect(dismissed?.decision?.cycleId).toBe(reportCycleId("rep-flow", decidedAt));
    expect(parseReportCycleId(dismissed?.decision?.cycleId)).toEqual({ propertyId: "rep-flow", decidedAt });
    await expect(reopenDecidedReports("rep-flow", decidedAt, "rep-moderator")).resolves.toBe(3);
    rows = await prisma.listingReport.findMany({ where: { propertyId: "rep-flow" }, select: { status: true, assigneeId: true } });
    expect(rows.every((row) => row.status === REPORT_STATUSES.IN_REVIEW)).toBe(true);
    await expect(reopenDecidedReports("rep-flow", decidedAt, "rep-moderator")).resolves.toBe(0);
  });

  it("yenidən baxış yalnız göstərilən qərar dövrünü açır, köhnə dövr yenisinə toxunmur", async () => {
    const older = new Date(Date.now() - 2 * DAY);
    const newer = new Date(Date.now() - DAY);
    const base = { propertyId: "rep-flow", reason: "FAKE", reasons: '["FAKE"]', resolvedById: "rep-moderator" };
    await prisma.listingReport.createMany({
      data: [
        { ...base, id: "cycle-old", reporterKey: "cycle-old", status: REPORT_STATUSES.DISMISSED, resolution: "NO_ACTION", resolvedAt: older },
        { ...base, id: "cycle-new", reporterKey: "cycle-new", status: REPORT_STATUSES.RESOLVED, resolution: "LISTING_FIXED", resolvedAt: newer },
      ],
    });
    await expect(reopenDecidedReports("rep-flow", older, "rep-moderator")).resolves.toBe(1);
    const statuses = await prisma.listingReport.findMany({
      where: { id: { in: ["cycle-old", "cycle-new"] } },
      select: { id: true, status: true },
      orderBy: { id: "asc" },
    });
    expect(statuses).toEqual([
      { id: "cycle-new", status: REPORT_STATUSES.RESOLVED },
      { id: "cycle-old", status: REPORT_STATUSES.IN_REVIEW },
    ]);
    expect(parseReportCycleId("rep-flow|tarix-deyil")).toBeNull();
    expect(parseReportCycleId("a|b|c")).toBeNull();
    await prisma.listingReport.deleteMany({ where: { id: { in: ["cycle-old", "cycle-new"] } } });
  });

  it("çatdırılmayan izahat istəyi geri qaytarılır: əvvəlki sual bərpa olunur, yoxdursa «Yoxlanılır»", async () => {
    const firstAt = new Date(Date.now() - 60_000);
    const first = await requestReportInfo({ propertyId: "rep-flow", actorId: "rep-moderator", note: "Birinci sual.", now: firstAt });
    expect(first.previous).toBeNull();
    const secondAt = new Date();
    const second = await requestReportInfo({ propertyId: "rep-flow", actorId: "rep-moderator", note: "İkinci sual.", now: secondAt });
    expect(second.previous).toEqual({ at: firstAt, note: "Birinci sual." });

    // İkinci sual çatmadı — birinci (artıq çatdırılmış) istək bərpa olunur, qrup məlumat gözləməkdə qalır.
    await expect(revertReportInfoRequest("rep-flow", secondAt, second.previous)).resolves.toBe(3);
    let rows = await prisma.listingReport.findMany({ where: { propertyId: "rep-flow" }, select: { status: true, infoRequestNote: true } });
    expect(rows.every((row) => row.status === REPORT_STATUSES.NEEDS_INFO && row.infoRequestNote === "Birinci sual.")).toBe(true);

    // Heç bir sual çatmayıbsa qrup yoxlamaya qayıdır.
    await expect(revertReportInfoRequest("rep-flow", firstAt, null)).resolves.toBe(3);
    rows = await prisma.listingReport.findMany({ where: { propertyId: "rep-flow" }, select: { status: true, infoRequestNote: true } });
    expect(rows.every((row) => row.status === REPORT_STATUSES.IN_REVIEW && row.infoRequestNote === null)).toBe(true);
  });

  it("eyni qərarın nəticəsi hər şikayətçiyə ayrıca bildiriş kimi yazılır", async () => {
    const decidedAt = new Date();
    for (const userId of ["rep-agent", "rep-owner"]) {
      await noticeReportOutcome({ userId, propertyId: "rep-flow", propertyTitle: "Axın", decidedAt, outcome: "dismissed" });
    }
    const notices = await prisma.notification.findMany({
      where: { type: NOTIFICATION_TYPES.LISTING_REPORT, dedupeKey: { startsWith: "report-outcome:rep-flow:" } },
      select: { userId: true },
    });
    expect(notices.map((item) => item.userId).sort()).toEqual(["rep-agent", "rep-owner"]);
  });

  it("daxili qeyd elan üzrə yazılır və növbədə ən yenisi birinci görünür", async () => {
    await expect(addReportNote({ propertyId: "yoxdur", authorId: "rep-moderator", body: "x" })).resolves.toBeNull();
    await addReportNote({ propertyId: "rep-flow", authorId: "rep-moderator", body: "Sahibə zəng edildi." });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await addReportNote({ propertyId: "rep-flow", authorId: "rep-moderator", body: "Sənəd göndərildi." });
    const group = (await getReportGroups()).find((item) => item.property.id === "rep-flow");
    expect(group?.notes.map((note) => note.body)).toEqual(["Sənəd göndərildi.", "Sahibə zəng edildi."]);
    expect(group?.notes[0].author?.name).toBe("Moderator");
    // Başqa elanın qrupuna qarışmır.
    expect((await getReportGroups()).find((item) => item.property.id === "rep-live")?.notes).toEqual([]);
  });

  it("«Şikayətlərim» yalnız istifadəçinin öz şikayətlərini və məxfi olmayan sahələri qaytarır", async () => {
    const mine = await getUserReports("rep-agent");
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({
      propertyTitle: "Axın",
      propertySlug: "rep-flow",
      reasons: ["PHOTOS_MISMATCH"],
      status: REPORT_STATUSES.IN_REVIEW,
      evidenceCount: 2,
    });
    // Moderator, izahat mətni, daxili qeyd və reporterKey səhifəyə ötürülmür.
    expect(Object.keys(mine[0]).sort()).toEqual(
      ["createdAt", "evidenceCount", "id", "propertySlug", "propertyTitle", "reasons", "resolution", "resolvedAt", "status"],
    );
    await expect(getUserReports("rep-owner")).resolves.toEqual([]);
  });

  it("növbə göstəricilərini hesablayır", async () => {
    const stats = await getReportQueueStats();
    expect(stats.counts.OPEN).toBe(2);
    expect(stats.counts.IN_REVIEW).toBe(3);
    expect(stats.total).toBe(5);
    // Hər iki elanda 2+ aktiv şikayət var; beh tələbi və təkrar şikayət yüksək prioritet verir.
    expect(stats.repeated).toBe(2);
    expect(stats.highPriority).toBe(2);
  });
});

describe("bağlanmış sövdələşmələr və aktiv təkliflər", () => {
  it("son 12 ayın satış/icarəsini sayır, aktiv təklif yalnız dərcdə olanlardır", async () => {
    const deals = await getClosedDeals({ authorId: "rep-agent" });
    expect(deals.stats).toEqual({ total: 2, sold: 1, rented: 1 });
    expect(deals.recent.map((item) => item.id).sort()).toEqual(["rep-rented", "rep-sold"]);

    const active = await prisma.property.findMany({ where: { ...(await activeOfferWhere()), authorId: "rep-agent" }, select: { id: true } });
    expect(active.map((item) => item.id)).toEqual(["rep-live"]);
  });
});
