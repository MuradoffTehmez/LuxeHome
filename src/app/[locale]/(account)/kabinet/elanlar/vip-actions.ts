"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { requestVip } from "@/lib/vip";

/** VIP sorğusu (#248, PRD 14.3): sahib dərc olunmuş elanı üçün göndərir, admin təsdiqləyir. */
export async function requestVipAction(propertyId: string, days: number, message: string): Promise<ActionState> {
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
    const result = await requestVip({
      userId: user.id,
      propertyId: String(propertyId).slice(0, 60),
      days: Number(days),
      message: typeof message === "string" ? message : "",
    });
    if (!result.ok) return failure(t(`vip.errors.${result.reason}`));
    revalidatePath(localizePath("/kabinet/elanlar", locale));
    if (result.approved) revalidatePublicContent("property");
    return success(result.approved ? t("vip.approvedNow") : t("vip.sent"));
  } catch (error) {
    return unexpected("VIP sorğusu göndərilmədi", error, t("vip.errors.failed"));
  }
}
