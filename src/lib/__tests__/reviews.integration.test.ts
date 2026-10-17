import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { REVIEW_STATUSES, REVIEW_SUSPICION_FLAGS } from "@/lib/constants";
import {
  getRespondableReviews,
  hasVerifiedInteraction,
  isVerifiedReviewer,
  parseReviewForm,
  parseSuspicionFlags,
  reviewCriteriaAverages,
  reviewSuspicionFlags,
  saveReviewReply,
} from "@/lib/reviews";
import { getAgencyCriteria, getAgencyRatings, getAgencyReviews } from "@/lib/agency-ratings";

/** Meyarlı rəylər, təsdiqlənmiş əlaqə, şübhə siqnalları və cavab (#230, PRD 10.2–10.5) real D1-də. */
const DB = (env as unknown as { DB: D1Database }).DB;
const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeAll(async () => {
  const user = DB.prepare('INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountType", "emailVerifiedAt", "verifiedPhone", "createdAt", "updatedAt") VALUES (?, ?, ?, \'disabled\', \'EDITOR\', ?, ?, ?, ?, CURRENT_TIMESTAMP)');
  const review = DB.prepare(
    `INSERT INTO "AgencyReview" ("id", "agencyId", "customerId", "customerName", "rating", "ratingCommunication", "ratingAccuracy", "comment", "status", "verifiedInteraction", "createdAt")
     VALUES (?, 'rv-agency', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  await DB.batch([
    user.bind("rv-owner", "Sahib", "rv-owner@example.test", "AGENCY", daysAgo(100), null, daysAgo(100)),
    user.bind("rv-agent", "Agent", "rv-agent@example.test", "AGENT", daysAgo(100), null, daysAgo(100)),
    user.bind("rv-client", "Müştəri", "rv-client@example.test", "USER", daysAgo(30), null, daysAgo(30)),
    user.bind("rv-phone", "Telefonlu", "rv-phone@example.test", "USER", null, "+994501112233", daysAgo(1)),
    user.bind("rv-unverified", "Təsdiqsiz", "rv-unverified@example.test", "USER", null, null, daysAgo(30)),
    DB.prepare('INSERT INTO "Agency" ("id", "userId", "name", "slug", "isVerified", "createdAt", "updatedAt") VALUES (\'rv-agency\', \'rv-owner\', \'Alfa\', \'rv-alfa\', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    DB.prepare('INSERT INTO "AgentProfile" ("id", "userId", "agencyId", "slug", "name", "isPublic", "createdAt", "updatedAt") VALUES (\'rv-ap\', \'rv-agent\', \'rv-agency\', \'rv-agent\', \'Agent\', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    DB.prepare('INSERT INTO "Lead" ("id", "name", "phone", "email", "message", "source", "status", "agencyId", "createdAt", "updatedAt") VALUES (\'rv-lead\', \'Müştəri\', \'0500000000\', \'rv-client@example.test\', \'Salam\', \'AGENCY\', \'NEW\', \'rv-agency\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'),
    review.bind("rv-r1", "rv-client", "Müştəri", 5, 4, 5, "Çox peşəkar xidmət göstərdilər, tövsiyə edirəm.", REVIEW_STATUSES.APPROVED, 1, daysAgo(2)),
    review.bind("rv-r2", "rv-other", "Başqa", 3, 2, null, "Orta səviyyəli xidmət idi, cavab gecikirdi.", REVIEW_STATUSES.APPROVED, 0, daysAgo(3)),
    review.bind("rv-r3", "rv-pending", "Gözləyən", 1, 1, 1, "Hələ moderasiyadadır, reytinqə düşməməlidir.", REVIEW_STATUSES.PENDING, 0, daysAgo(1)),
  ]);
});

describe("forma və meyarlar", () => {
  it("beş meyar tələb olunur; köhnə `rating` sahəsi ümumi məmnunluq kimi qəbul edilir", () => {
    const base = { communication: "5", accuracy: "4", responsiveness: "3", professionalism: "5", comment: "Kifayət qədər uzun rəy mətni yazıram." };
    expect(parseReviewForm(form({ ...base, overall: "4" })).success).toBe(true);
    expect(parseReviewForm(form({ ...base, rating: "4" })).success).toBe(true);
    expect(parseReviewForm(form({ ...base, overall: "6" })).success).toBe(false);
    expect(parseReviewForm(form({ ...base, overall: "4", comment: "Qısa" })).success).toBe(false);
  });

  it("meyar ortalamaları yalnız dolu dəyərlərdən; reytinq yalnız təsdiqlənmiş rəylərdən", async () => {
    expect(reviewCriteriaAverages([
      { rating: 5, ratingCommunication: 4, ratingAccuracy: null, ratingResponsiveness: null, ratingProfessionalism: null },
      { rating: 3, ratingCommunication: 2, ratingAccuracy: 5, ratingResponsiveness: null, ratingProfessionalism: null },
    ])).toEqual([
      { criterion: "communication", average: 3, count: 2 },
      { criterion: "accuracy", average: 5, count: 1 },
      { criterion: "responsiveness", average: null, count: 0 },
      { criterion: "professionalism", average: null, count: 0 },
      { criterion: "overall", average: 4, count: 2 },
    ]);
    await expect(getAgencyRatings(["rv-agency"])).resolves.toEqual(new Map([["rv-agency", { average: 4, count: 2 }]]));
    const criteria = await getAgencyCriteria("rv-agency");
    expect(criteria.find((row) => row.criterion === "communication")).toEqual({ criterion: "communication", average: 3, count: 2 });
    const reviews = await getAgencyReviews("rv-agency");
    expect(reviews.map((item) => item.id)).toEqual(["rv-r1", "rv-r2"]);
    expect(reviews[0]).toMatchObject({ verifiedInteraction: true, agentName: null });
  });
});

describe("saxta rəydən qorunma", () => {
  it("yalnız e-poçtu və ya telefonu təsdiqlənmiş hesab rəy yazır", async () => {
    await expect(isVerifiedReviewer("rv-client")).resolves.toBe(true);
    await expect(isVerifiedReviewer("rv-phone")).resolves.toBe(true);
    await expect(isVerifiedReviewer("rv-unverified")).resolves.toBe(false);
  });

  it("agentliyə real müraciəti olan istifadəçi təsdiqlənmiş əlaqə sayılır", async () => {
    await expect(hasVerifiedInteraction({ userId: "rv-client", agencyId: "rv-agency" })).resolves.toBe(true);
    await expect(hasVerifiedInteraction({ userId: "rv-phone", agencyId: "rv-agency" })).resolves.toBe(false);
    await expect(hasVerifiedInteraction({ userId: "rv-client" })).resolves.toBe(false);
  });

  it("şübhə siqnalları: təzə hesab, təkrar mətn, müraciətsiz ifrat qiymət, qısa müddətdə çox rəy", async () => {
    await expect(reviewSuspicionFlags({ userId: "rv-phone", comment: "Çox peşəkar xidmət göstərdilər, tövsiyə edirəm.", overall: 5, verifiedInteraction: false, now }))
      .resolves.toEqual([REVIEW_SUSPICION_FLAGS.NEW_ACCOUNT, REVIEW_SUSPICION_FLAGS.DUPLICATE_TEXT, REVIEW_SUSPICION_FLAGS.NO_INTERACTION]);
    await expect(reviewSuspicionFlags({ userId: "rv-client", comment: "Tamamilə yeni və fərqli rəy mətni.", overall: 4, verifiedInteraction: true, now })).resolves.toEqual([]);
    // Son 24 saatda iki rəy + yazılan üçüncü = `REVIEW_BURST_LIMIT`.
    await DB.batch([
      DB.prepare('INSERT INTO "AgentReview" ("id", "agentId", "customerId", "customerName", "rating", "comment", "createdAt") VALUES (\'rv-burst\', \'rv-ap\', \'rv-client\', \'Müştəri\', 4, \'Başqa rəy\', ?)').bind(now.toISOString()),
      DB.prepare('INSERT INTO "AgencyReview" ("id", "agencyId", "customerId", "customerName", "rating", "comment", "status", "createdAt") VALUES (\'rv-burst2\', \'rv-agency\', \'rv-client\', \'Müştəri\', 4, \'İkinci rəy\', \'PENDING\', ?)').bind(now.toISOString()),
    ]);
    await expect(reviewSuspicionFlags({ userId: "rv-client", comment: "Üçüncü fərqli rəy mətni burada.", overall: 4, verifiedInteraction: true, now }))
      .resolves.toEqual([REVIEW_SUSPICION_FLAGS.BURST]);
    expect(parseSuspicionFlags('["BURST","UNKNOWN"]')).toEqual(["BURST"]);
  });
});

describe("rəyə cavab", () => {
  it("agentlik sahibi öz agentliyinin təsdiqlənmiş rəyinə cavab yazır; başqası və gözləyən rəy yox", async () => {
    await expect(saveReviewReply({ userId: "rv-owner", authorName: "Alfa", kind: "agency", reviewId: "rv-r1", text: "Təşəkkür edirik!" })).resolves.toBe("saved");
    await expect(saveReviewReply({ userId: "rv-agent", authorName: "Agent", kind: "agency", reviewId: "rv-r1", text: "Cavab" })).resolves.toBe("notFound");
    await expect(saveReviewReply({ userId: "rv-owner", authorName: "Alfa", kind: "agency", reviewId: "rv-r3", text: "Cavab" })).resolves.toBe("notFound");
    await expect(saveReviewReply({ userId: "rv-owner", authorName: "Alfa", kind: "agency", reviewId: "rv-r1", text: "x".repeat(1001) })).resolves.toBe("invalid");
    const reviews = await getAgencyReviews("rv-agency");
    expect(reviews[0]).toMatchObject({ replyText: "Təşəkkür edirik!", replyAuthorName: "Alfa" });
    const respondable = await getRespondableReviews("rv-owner");
    expect(respondable.map((item) => item.id)).toEqual(["rv-r1", "rv-r2"]);
    await expect(saveReviewReply({ userId: "rv-owner", authorName: "Alfa", kind: "agency", reviewId: "rv-r1", text: "" })).resolves.toBe("cleared");
  });
});
