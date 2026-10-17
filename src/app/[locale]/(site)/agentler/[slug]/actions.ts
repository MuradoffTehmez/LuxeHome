"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { featureDisabledFailure } from "@/lib/feature-guard";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/lib/constants";
import { hasVerifiedInteraction, isVerifiedReviewer, parseReviewForm, reviewRatingData, reviewSuspicionFlags } from "@/lib/reviews";

/**
 * Agentə rəy (#230, PRD 10.4, 10.5): beş meyar, hesab yoxlanışı, təkrar rəy limiti, özünü və öz
 * agentliyinin agentini qiymətləndirmə qadağası. Rəy moderasiyaya düşür; real müraciəti olan
 * istifadəçinin rəyi «təsdiqlənmiş əlaqə» kimi işarələnir, şübhə siqnalları moderatora yazılır.
 */
export async function submitAgentReview(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("phase2.agents");
  let user;
  try {
    user = await requirePublicAction("review", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  // Bayraq guard-dan sonra yoxlanılır — anonim/kənar sorğu əvvəlcə same-origin və giriş yoxlamasından keçir.
  const disabled = await featureDisabledFailure("RATINGS");
  if (disabled) return disabled;

  const agentId = String(formData.get("agentId") ?? "").slice(0, 40);
  const parsed = parseReviewForm(formData);
  if (!agentId || !parsed.success) return failure(t("reviewInvalid"));

  try {
    if (!(await isVerifiedReviewer(user.id))) return failure(t("reviewUnverified"));
    const [agent, duplicate] = await Promise.all([
      prisma.agentProfile.findFirst({ where: { id: agentId, isPublic: true }, select: { id: true, userId: true, agencyId: true } }),
      prisma.agentReview.findFirst({ where: { agentId, customerId: user.id }, select: { id: true } }),
    ]);
    if (!agent) return failure(t("notFound"));
    if (duplicate) return failure(t("reviewDuplicate"));

    // PRD 10.5 — agent özünə, agentlik əməkdaşı isə öz agentliyinin agentinə rəy yaza bilməz.
    // Yoxlama serverdədir: forma gizlədilsə də POST açıq qalır.
    if (agent.userId && agent.userId === user.id) return failure(t("reviewSelf"));
    if (agent.agencyId) {
      const insider = await prisma.agency.findFirst({
        where: { id: agent.agencyId, OR: [{ userId: user.id }, { employees: { some: { userId: user.id } } }] },
        select: { id: true },
      });
      if (insider) return failure(t("reviewSelf"));
    }

    const verifiedInteraction = await hasVerifiedInteraction({ userId: user.id, agentUserId: agent.userId, agencyId: agent.agencyId });
    const flags = await reviewSuspicionFlags({ userId: user.id, comment: parsed.data.comment, overall: parsed.data.overall, verifiedInteraction });
    await prisma.agentReview.create({
      data: {
        agentId: agent.id,
        customerId: user.id,
        customerName: user.name,
        ...reviewRatingData(parsed.data),
        verifiedInteraction,
        suspicionFlags: flags.length ? JSON.stringify(flags) : null,
      },
    });
    return success(t("reviewSuccess"));
  } catch (error) {
    return unexpected("agent rəyi yaradıla bilmədi", error, t("reviewFailed"));
  }
}
