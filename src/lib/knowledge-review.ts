import {
  KNOWLEDGE_REVIEW_INTERVAL_DAYS,
  KNOWLEDGE_RISK_LEVELS,
  KNOWLEDGE_STATUSES,
  ROLES,
} from "@/lib/constants";

/**
 * Bilik Mərkəzi məqaləsinin redaktor təsdiq axını (#266, PRD 24.2) — saf modul, Prisma-sız.
 *
 * Qaralama → «Təsdiqə göndər» (`IN_REVIEW`) → başqa redaktor dərc edir. Super Admin öz məqaləsini də təsdiqləyə
 * bilər (tək işçili rejim), amma bu da `approvedById` ilə qeyd olunur. Hüquqi yoxlama tələb edən (`LEGAL_REVIEW`)
 * məqalə hüquqşünas yoxlama tarixi olmadan heç kim tərəfindən dərc olunmur. Dərc olunmuş məqalənin redaktəsi
 * dərcdə qalır — yenidən təsdiq tələb etmir (ilk təsdiq və yoxlama tarixi saxlanılır).
 */
export type KnowledgeTransition =
  | { ok: true; submit: boolean; approve: boolean; refresh?: boolean }
  | { ok: false; reason: "needsReview" | "sameReviewer" | "legalReview" };

export function knowledgeTransition(input: {
  from: string | null;
  to: string;
  actorId: string;
  actorRole: string | null | undefined;
  submittedById: string | null;
  riskLevel: string;
  legalReviewedAt: Date | null;
}): KnowledgeTransition {
  if (input.to === KNOWLEDGE_STATUSES.PUBLISHED) {
    if (input.riskLevel === KNOWLEDGE_RISK_LEVELS.LEGAL_REVIEW && !input.legalReviewedAt) return { ok: false, reason: "legalReview" };
    // Dərc olunmuş məqalənin redaktəsi: yenidən təsdiq yoxdur, amma keçmiş yoxlama müddəti yenilənir (redaktor məzmunu baxıb).
    if (input.from === KNOWLEDGE_STATUSES.PUBLISHED) return { ok: true, submit: false, approve: false, refresh: true };
    if (input.actorRole === ROLES.SUPER_ADMIN) return { ok: true, submit: false, approve: true };
    if (input.from !== KNOWLEDGE_STATUSES.IN_REVIEW) return { ok: false, reason: "needsReview" };
    if (input.submittedById === input.actorId) return { ok: false, reason: "sameReviewer" };
    return { ok: true, submit: false, approve: true };
  }
  if (input.to === KNOWLEDGE_STATUSES.IN_REVIEW) return { ok: true, submit: input.from !== KNOWLEDGE_STATUSES.IN_REVIEW, approve: false };
  return { ok: true, submit: false, approve: false };
}

/** Təsdiqdə növbəti yoxlama tarixi: hələ gələcəkdədirsə saxlanılır, yoxdursa və ya keçibsə yenidən qurulur. */
export function nextReviewAfter(current: Date | null, now: Date): Date {
  if (current && current.getTime() > now.getTime()) return current;
  return new Date(now.getTime() + KNOWLEDGE_REVIEW_INTERVAL_DAYS * 86_400_000);
}

/** Dərc olunmuş, yoxlama tarixi keçmiş məqalə — «Yenilənməli» növbəsi. */
export function isKnowledgeReviewDue(article: { status: string; reviewAfter: Date | null }, now: Date): boolean {
  return article.status === KNOWLEDGE_STATUSES.PUBLISHED && article.reviewAfter !== null && article.reviewAfter.getTime() <= now.getTime();
}
