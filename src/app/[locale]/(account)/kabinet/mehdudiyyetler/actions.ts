"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { appealRestriction } from "@/lib/account-trust";

/**
 * Tədbirə etiraz (#258, PRD 20.4). `appeal` scope-u same-origin, sistem rejimi və yazma limitini tətbiq edir, amma
 * hesab tədbiri qapısından azaddır — məhdudiyyətli hesab da etiraz edə bilməlidir.
 */
export async function appealRestrictionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.restrictions");
  let user;
  try {
    user = await requirePublicAction("appeal", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const result = await appealRestriction({
      userId: user.id,
      restrictionId: String(formData.get("restrictionId") ?? "").slice(0, 60),
      message: String(formData.get("message") ?? ""),
    });
    if (!result.ok) return failure(t(`errors.${result.reason}`));
    revalidatePath(localizePath("/kabinet/mehdudiyyetler", locale));
    return success(t("appealSent"));
  } catch (error) {
    return unexpected("etiraz göndərilmədi", error, t("errors.failed"));
  }
}
