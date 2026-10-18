import { env } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { isKnowledgeReviewDue, knowledgeTransition, nextReviewAfter } from "@/lib/knowledge-review";
import { getAdminKnowledgeArticles, getKnowledgeArticles, getKnowledgeReviewCounts, KNOWLEDGE_STALE_FILTER } from "@/lib/knowledge";
import { KNOWLEDGE_REVIEW_INTERVAL_DAYS } from "@/lib/constants";

/** Bilik Mərkəzi redaktor təsdiq axını və dövri yenilənmə (#266, PRD Modul 22). */
const DB = (env as unknown as { DB: D1Database }).DB;
const DAY = 86_400_000;
const now = new Date("2026-10-18T10:00:00Z");
const base = { actorId: "editor-b", actorRole: "EDITOR", submittedById: "editor-a", riskLevel: "YELLOW", legalReviewedAt: null };

describe("təsdiq keçidləri", () => {
  it("qaralama birbaşa dərc olunmur, əvvəl təsdiqə göndərilir", () => {
    expect(knowledgeTransition({ ...base, from: "DRAFT", to: "PUBLISHED" })).toEqual({ ok: false, reason: "needsReview" });
    expect(knowledgeTransition({ ...base, from: null, to: "PUBLISHED" })).toEqual({ ok: false, reason: "needsReview" });
    expect(knowledgeTransition({ ...base, from: "DRAFT", to: "IN_REVIEW" })).toEqual({ ok: true, submit: true, approve: false });
    expect(knowledgeTransition({ ...base, from: "IN_REVIEW", to: "IN_REVIEW" })).toEqual({ ok: true, submit: false, approve: false });
  });

  it("təsdiqə göndərən özü dərc edə bilməz, başqa redaktor edir; Super Admin istisnadır", () => {
    expect(knowledgeTransition({ ...base, actorId: "editor-a", from: "IN_REVIEW", to: "PUBLISHED" })).toEqual({ ok: false, reason: "sameReviewer" });
    expect(knowledgeTransition({ ...base, from: "IN_REVIEW", to: "PUBLISHED" })).toEqual({ ok: true, submit: false, approve: true });
    expect(knowledgeTransition({ ...base, actorRole: "SUPER_ADMIN", from: "DRAFT", to: "PUBLISHED" })).toEqual({ ok: true, submit: false, approve: true });
  });

  it("hüquqi yoxlama tələb edən məqalə yoxlama tarixi olmadan heç kimə dərc olunmur", () => {
    expect(knowledgeTransition({ ...base, actorRole: "SUPER_ADMIN", riskLevel: "LEGAL_REVIEW", from: "IN_REVIEW", to: "PUBLISHED" })).toEqual({ ok: false, reason: "legalReview" });
    expect(knowledgeTransition({ ...base, riskLevel: "LEGAL_REVIEW", legalReviewedAt: now, from: "IN_REVIEW", to: "PUBLISHED" }).ok).toBe(true);
  });

  it("dərc olunmuş məqalənin redaktəsi yenidən təsdiq tələb etmir", () => {
    expect(knowledgeTransition({ ...base, actorId: "editor-a", from: "PUBLISHED", to: "PUBLISHED" })).toEqual({ ok: true, submit: false, approve: false });
  });

  it("növbəti yoxlama tarixi və «yenilənməli» qaydası", () => {
    const future = new Date(now.getTime() + 10 * DAY);
    expect(nextReviewAfter(future, now)).toBe(future);
    expect(nextReviewAfter(null, now).getTime()).toBe(now.getTime() + KNOWLEDGE_REVIEW_INTERVAL_DAYS * DAY);
    expect(nextReviewAfter(new Date(now.getTime() - DAY), now).getTime()).toBe(now.getTime() + KNOWLEDGE_REVIEW_INTERVAL_DAYS * DAY);
    expect(isKnowledgeReviewDue({ status: "PUBLISHED", reviewAfter: new Date(now.getTime() - DAY) }, now)).toBe(true);
    expect(isKnowledgeReviewDue({ status: "DRAFT", reviewAfter: new Date(now.getTime() - DAY) }, now)).toBe(false);
    expect(isKnowledgeReviewDue({ status: "PUBLISHED", reviewAfter: null }, now)).toBe(false);
  });
});

beforeAll(async () => {
  const article = DB.prepare(
    `INSERT INTO "KnowledgeArticle" ("id", "slug", "title", "excerpt", "content", "status", "reviewAfter", "publishedAt", "createdAt", "updatedAt") VALUES (?, ?, ?, 'Qısa təsvir', 'Məzmun', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
  );
  await DB.batch([
    article.bind("kr-stale", "kr-stale", "Köhnə bələdçi", "PUBLISHED", new Date(now.getTime() - DAY).toISOString(), now.toISOString()),
    article.bind("kr-fresh", "kr-fresh", "Təzə bələdçi", "PUBLISHED", new Date(now.getTime() + 30 * DAY).toISOString(), now.toISOString()),
  ]);
});

describe("redaktor növbələri", () => {
  it("miqrasiya beh bölməsini və təsdiq gözləyən (ictimai olmayan) bələdçini yaradır", async () => {
    const category = await DB.prepare(`SELECT "name" FROM "KnowledgeCategory" WHERE "slug" = 'beh-ilkin-odenis'`).first<{ name: string }>();
    expect(category?.name).toBe("Beh və ilkin ödəniş");
    const guide = await DB.prepare(`SELECT "status", "riskLevel", "legalReviewedAt" FROM "KnowledgeArticle" WHERE "slug" = 'beh-ve-ilkin-odenis-tehlukesiz-nece-verilir'`).first();
    expect(guide).toEqual({ status: "IN_REVIEW", riskLevel: "LEGAL_REVIEW", legalReviewedAt: null });
    const publicResult = await getKnowledgeArticles({ categorySlug: "beh-ilkin-odenis" });
    expect(publicResult.items).toHaveLength(0);
  });

  it("«yenilənməli» filtri və sayğaclar", async () => {
    const stale = await getAdminKnowledgeArticles({ status: KNOWLEDGE_STALE_FILTER, now });
    expect(stale.map((row) => row.id)).toContain("kr-stale");
    expect(stale.map((row) => row.id)).not.toContain("kr-fresh");
    const counts = await getKnowledgeReviewCounts(now);
    expect(counts.inReview).toBeGreaterThanOrEqual(1);
    expect(counts.stale).toBeGreaterThanOrEqual(1);
  });
});
