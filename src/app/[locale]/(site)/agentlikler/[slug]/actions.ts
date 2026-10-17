"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import { isUniqueViolation } from "@/lib/media/upload-record";
import type { Locale } from "@/lib/constants";
import { hasVerifiedInteraction, isVerifiedReviewer, parseReviewForm, reviewRatingData, reviewSuspicionFlags } from "@/lib/reviews";

/**
 * Agentliyə birbaşa rəy (#230, PRD 10.3–10.5) — agent rəyi ilə eyni qaydalar: hesab yoxlanışı,
 * agentlik başına bir rəy, agentlik sahibi və üzvləri öz agentliyini qiymətləndirə bilməz,
 * moderasiya, təsdiqlənmiş əlaqə və şübhə siqnalları.
 */
export async function submitAgencyReview(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("phase2.agents");
  let user;
  try {
    user = await requirePublicAction("review", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const agencyId = String(formData.get("agencyId") ?? "").slice(0, 40);
  const parsed = parseReviewForm(formData);
  if (!agencyId || !parsed.success) return failure(t("reviewInvalid"));

  try {
    if (!(await isVerifiedReviewer(user.id))) return failure(t("reviewUnverified"));
    const [agency, duplicate] = await Promise.all([
      prisma.agency.findFirst({
        where: { id: agencyId, isVerified: true, user: { isActive: true, deletionRequestedAt: null } },
        select: { id: true, userId: true, employees: { where: { userId: user.id }, select: { id: true } } },
      }),
      prisma.agencyReview.findFirst({ where: { agencyId, customerId: user.id }, select: { id: true } }),
    ]);
    if (!agency) return failure(t("notFound"));
    if (duplicate) return failure(t("reviewDuplicateAgency"));
    if (agency.userId === user.id || agency.employees.length > 0) return failure(t("reviewSelf"));

    const verifiedInteraction = await hasVerifiedInteraction({ userId: user.id, agencyId: agency.id });
    const flags = await reviewSuspicionFlags({ userId: user.id, comment: parsed.data.comment, overall: parsed.data.overall, verifiedInteraction });
    const created = await prisma.agencyReview.create({
      data: {
        agencyId: agency.id,
        customerId: user.id,
        customerName: user.name,
        ...reviewRatingData(parsed.data),
        verifiedInteraction,
        suspicionFlags: flags.length ? JSON.stringify(flags) : null,
      },
    }).then(() => true).catch((error: unknown) => {
      // Eyni anda ikinci göndəriş unikal indeksə dəyir (`@@unique([agencyId, customerId])`).
      if (isUniqueViolation(error)) return false;
      throw error;
    });
    if (!created) return failure(t("reviewDuplicateAgency"));
    return success(t("reviewSuccess"));
  } catch (error) {
    return unexpected("agentlik rəyi yaradıla bilmədi", error, t("reviewFailed"));
  }
}
