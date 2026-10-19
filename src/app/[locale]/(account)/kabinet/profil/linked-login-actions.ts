"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { failure, success, unexpected, type ActionState } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import type { Locale } from "@/lib/constants";
import { localizePath } from "@/i18n/path-locale";
import { unlinkLoginMethod } from "@/lib/auth/linked-logins";
import { isLinkableProvider } from "@/lib/auth/linked-logins-policy";

/**
 * «Bağlı giriş üsulları» — ayırma. Guard ilk sətirdədir (server action layout-dan keçmir); yalnız sessiya sahibinin
 * öz hesabına təsir edir. Son giriş yolu ayrılmır — hesab kilidlənməsin. Bağlama OAuth axını ilə gedir (`?bagla=1`).
 */
export async function unlinkLogin(provider: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.profile.linkedLogins");
  let user;
  try {
    user = await requirePublicAction("profile", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  if (!isLinkableProvider(provider)) return failure(t("results.failed"));
  try {
    const outcome = await unlinkLoginMethod(user.id, provider);
    if (outcome === "last-method") return failure(t("lastMethod"));
    if (outcome === "not-linked") return failure(t("results.failed"));
  } catch (error) {
    return unexpected("giriş üsulu ayrılmadı", error, t("results.failed"));
  }
  revalidatePath(localizePath("/kabinet/profil", locale));
  return success(t("unlinked"));
}
