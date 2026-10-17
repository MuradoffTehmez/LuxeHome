import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { REVIEW_STATUSES } from "@/lib/constants";
import { countOpenReviewReports, createReviewReport, getReviewReportQueue, resolveReviewReports } from "@/lib/review-reports";
import { getAgencyRatings } from "@/lib/agency-ratings";
import { prisma } from "@/lib/prisma";

/** Rəydən şikayət və moderator qərarı (#232, PRD 10.5) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "createdAt", "updatedAt") VALUES (?, ?, ?, \'disabled\', \'EDITOR\', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
  const review = DB.prepare('INSERT INTO "AgencyReview" ("id", "agencyId", "customerId", "customerName", "rating", "comment", "status") VALUES (?, \'rr-agency\', ?, ?, ?, ?, ?)');
  await DB.batch([
    user.bind("rr-owner", "Sahib", "rr-owner@example.test", "AGENCY"),
    user.bind("rr-author", "Müəllif", "rr-author@example.test", "USER"),
    user.bind("rr-a", "Birinci", "rr-a@example.test", "USER"),
    user.bind("rr-b", "İkinci", "rr-b@example.test", "USER"),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (\'rr-agency\', \'rr-owner\', \'Alfa\', \'rr-alfa\', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    review.bind("rr-r1", "rr-author", "Müəllif", 1, "Bu agentlik fırıldaqçıdır, adını da yazıram: ...", REVIEW_STATUSES.APPROVED),
    review.bind("rr-r2", "rr-a", "Birinci", 5, "Əla xidmət göstərdilər, hər şey vaxtında oldu.", REVIEW_STATUSES.APPROVED),
    review.bind("rr-r3", "rr-b", "İkinci", 4, "Moderasiyadadır.", REVIEW_STATUSES.PENDING),
  ]);
});

describe("şikayət", () => {
  it("təsdiqlənmiş rəyə bir dəfə; öz rəyinə, gözləyən rəyə və izahsız «digər»ə yox", async () => {
    await expect(createReviewReport({ reporterId: "rr-owner", kind: "agency", reviewId: "rr-r1", reason: "OFFENSIVE" })).resolves.toBe("created");
    await expect(createReviewReport({ reporterId: "rr-owner", kind: "agency", reviewId: "rr-r1", reason: "FAKE" })).resolves.toBe("duplicate");
    await expect(createReviewReport({ reporterId: "rr-a", kind: "agency", reviewId: "rr-r1", reason: "PERSONAL_DATA", comment: "Ad yazılıb" })).resolves.toBe("created");
    await expect(createReviewReport({ reporterId: "rr-author", kind: "agency", reviewId: "rr-r1", reason: "FAKE" })).resolves.toBe("own");
    await expect(createReviewReport({ reporterId: "rr-a", kind: "agency", reviewId: "rr-r3", reason: "FAKE" })).resolves.toBe("notFound");
    await expect(createReviewReport({ reporterId: "rr-a", kind: "agency", reviewId: "rr-r2", reason: "OTHER", comment: "" })).resolves.toBe("invalid");
    await expect(createReviewReport({ reporterId: "rr-a", kind: "listing", reviewId: "rr-r2", reason: "FAKE" })).resolves.toBe("invalid");
    await expect(createReviewReport({ reporterId: "rr-b", kind: "agency", reviewId: "rr-r2", reason: "CONFLICT" })).resolves.toBe("created");
  });

  it("növbə rəy üzrə qruplaşır, ən çox şikayət olunan yuxarıda", async () => {
    const queue = await getReviewReportQueue();
    expect(queue.map((group) => [group.reviewId, group.reports.length])).toEqual([["rr-r1", 2], ["rr-r2", 1]]);
    expect(queue[0]).toMatchObject({ kind: "agency", targetName: "Alfa", rating: 1 });
    await expect(countOpenReviewReports()).resolves.toBe(3);
  });

  it("«gizlət» rəyi reytinqdən çıxarır, «rədd et» saxlayır; təkrar qərar heç nə etmir", async () => {
    await expect(getAgencyRatings(["rr-agency"])).resolves.toEqual(new Map([["rr-agency", { average: 3, count: 2 }]]));
    const hidden = await resolveReviewReports({ kind: "agency", reviewId: "rr-r1", decision: "hide", actorId: "admin" });
    expect(hidden).toEqual({ reporters: ["rr-owner", "rr-a"], slug: "rr-alfa" });
    await expect(prisma.agencyReview.findUniqueOrThrow({ where: { id: "rr-r1" }, select: { status: true } })).resolves.toEqual({ status: REVIEW_STATUSES.HIDDEN });
    await expect(getAgencyRatings(["rr-agency"])).resolves.toEqual(new Map([["rr-agency", { average: 5, count: 1 }]]));
    await expect(resolveReviewReports({ kind: "agency", reviewId: "rr-r1", decision: "hide", actorId: "admin" })).resolves.toBeNull();

    const dismissed = await resolveReviewReports({ kind: "agency", reviewId: "rr-r2", decision: "dismiss", actorId: "admin" });
    expect(dismissed?.reporters).toEqual(["rr-b"]);
    await expect(prisma.agencyReview.findUniqueOrThrow({ where: { id: "rr-r2" }, select: { status: true } })).resolves.toEqual({ status: REVIEW_STATUSES.APPROVED });
    await expect(countOpenReviewReports()).resolves.toBe(0);
  });
});

describe("çox şikayət olunan rəy", () => {
  it("120 açıq şikayət bir qərarla bağlanır (D1 parametr həddi)", async () => {
    await DB.prepare('INSERT INTO "AgencyReview" ("id", "agencyId", "customerId", "customerName", "rating", "comment", "status") VALUES (\'rr-many\', \'rr-agency\', NULL, \'Anonim\', 1, \'Çox şikayət\', ?)').bind(REVIEW_STATUSES.APPROVED).run();
    const insert = DB.prepare('INSERT INTO "ReviewReport" ("id", "reviewKind", "reviewId", "reporterId", "reason") VALUES (?, \'agency\', \'rr-many\', ?, \'FAKE\')');
    await DB.batch(Array.from({ length: 120 }, (_, index) => insert.bind(`rr-many-${index}`, `rr-reporter-${index}`)));
    const result = await resolveReviewReports({ kind: "agency", reviewId: "rr-many", decision: "hide", actorId: "admin" });
    expect(result?.reporters).toHaveLength(120);
    await expect(countOpenReviewReports()).resolves.toBe(0);
  });
});
