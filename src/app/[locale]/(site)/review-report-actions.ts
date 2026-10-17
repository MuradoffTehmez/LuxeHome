"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { featureDisabledFailure } from "@/lib/feature-guard";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { createReviewReport } from "@/lib/review-reports";
import { getOptionalUser } from "@/lib/auth/guard";
import { AUTH_KINDS, type Locale } from "@/lib/constants";

/**
 * Rəydən şikayət (#232, PRD 10.5) — agent və agentlik profillərindəki rəy kartından. Daxil olmamış
 * istifadəçi guard-dan keçmir; qərar moderatorundur, şikayət rəyi avtomatik gizlətmir.
 */
export async function reportReview(kind: string, reviewId: string, reason: string, comment: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("phase2");
  const disabled = await featureDisabledFailure("REPORTS");
  if (disabled) return disabled;
  // Anonim ziyarətçi: `requireAccount` `redirect()` atardı və dialoq əvəzinə bütün səhifə giriş
  // səhifəsinə keçərdi (və ya istisna aşağıdakı `catch`-də udulardı) — aydın mesaj qaytarılır.
  if (!(await getOptionalUser(AUTH_KINDS.PUBLIC))) return failure(t("agents.report.errors.login"));
  try {
    const user = await requirePublicAction("review", locale);
    const result = await createReviewReport({ reporterId: user.id, kind, reviewId: String(reviewId), reason, comment });
    if (result === "created") return success(t("agents.report.sent"));
    return failure(t(`agents.report.errors.${result}`));
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(t("agents.report.errors.login"));
    return unexpected("rəydən şikayət yazılmadı", error, t("agents.reviewFailed"));
  }
}
