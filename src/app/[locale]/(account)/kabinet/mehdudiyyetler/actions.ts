"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { requireAccount } from "@/lib/auth/guard";
import { assertSameOrigin, SameOriginError } from "@/lib/request-origin";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { appealRestriction } from "@/lib/account-trust";

/**
 * Tədbirə etiraz (#258, PRD 20.4). Məhdudiyyətli hesab da etiraz edə bilməlidir, ona görə `requirePublicAction`
 * (blok qapısı) əvəzinə same-origin + `requireAccount` işlədilir.
 */
export async function appealRestrictionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.restrictions");
  try {
    await assertSameOrigin();
  } catch (error) {
    if (error instanceof SameOriginError) return failure(t("errors.notFound"));
    throw error;
  }
  const user = await requireAccount(locale);
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
