"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { requestPromotion } from "@/lib/promotion";

/** İrəli çəkmə sorğusu (#250, PRD 15.4): ödənişsiz, kart məlumatı istənmir; admin idarə edir. */
export async function requestPromotionAction(propertyId: string, days: number, message: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.listings");
  let user;
  try {
    user = await requirePublicAction("property", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const result = await requestPromotion({
      userId: user.id,
      propertyId: String(propertyId).slice(0, 60),
      days: Number(days),
      message: typeof message === "string" ? message : "",
    });
    if (!result.ok) return failure(t(`promotion.errors.${result.reason}`));
    revalidatePath(localizePath("/kabinet/elanlar", locale));
    if (result.started) revalidatePublicContent("property");
    return success(result.started ? t("promotion.startedNow") : t("promotion.sent"));
  } catch (error) {
    return unexpected("irəli çəkmə sorğusu göndərilmədi", error, t("promotion.errors.failed"));
  }
}
