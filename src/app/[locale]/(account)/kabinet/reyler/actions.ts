"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { localizePath } from "@/i18n/path-locale";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { saveReviewReply } from "@/lib/reviews";
import type { Locale } from "@/lib/constants";
import { featureDisabledFailure } from "@/lib/feature-guard";

/** Agentin/agentliyin təsdiqlənmiş rəyə cavabı (#230, PRD 10.5); boş mətn cavabı silir. */
export async function replyToReview(kind: string, reviewId: string, text: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.reviews");
  const disabled = await featureDisabledFailure("RATINGS");
  if (disabled) return disabled;
  let user;
  try {
    user = await requirePublicAction("review", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  if (kind !== "agent" && kind !== "agency") return failure(t("notFound"));
  try {
    const result = await saveReviewReply({
      userId: user.id,
      authorName: user.name,
      kind,
      reviewId: String(reviewId).slice(0, 40),
      text: typeof text === "string" ? text : "",
    });
    if (result === "notFound") return failure(t("notFound"));
    if (result === "invalid") return failure(t("invalid"));
    revalidatePath(localizePath("/kabinet/reyler", locale));
    revalidatePublicContent(kind === "agent" ? "agent" : "agency");
    return success(t(result === "saved" ? "saved" : "cleared"));
  } catch (error) {
    return unexpected("rəyə cavab yazılmadı", error, t("failed"));
  }
}
