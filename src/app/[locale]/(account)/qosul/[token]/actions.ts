"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { type Locale } from "@/lib/constants";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { recordDomainEvent } from "@/lib/admin/events";
import { type ActionState, failure, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { localizePath } from "@/i18n/path-locale";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { findAgencyByInviteToken, joinAgencyByLink } from "@/lib/accounts/agency-invite";
import { noticeAgencyLinkJoined } from "@/lib/accounts/account-notices";

/**
 * Daxil olmuş agent dəvət linki ilə agentliyə qoşulur (#157). Qeydiyyatdan keçməyən
 * agent üçün eyni qayda `registerAccount`-dadır (`?devet=<token>`).
 */
export async function joinAgencyWithLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let user;
  try {
    user = await requirePublicAction("team", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const agency = await findAgencyByInviteToken(form.text(formData, "token"));
  if (!agency) return failure(t("join.invalid"));

  let joined = false;
  try {
    const result = await joinAgencyByLink(agency, user);
    switch (result.status) {
      case "notAgent":
        return failure(t("join.notAgent"));
      case "otherAgency":
        return failure(t("join.otherAgency"));
      case "full":
        return failure(t("join.full"));
      case "conflict":
        return failure(t("actions.unexpected"));
      case "already":
        joined = true;
        break;
      case "joined":
        await recordDomainEvent("agency.employee_joined_link", "AgencyEmployee", result.employeeId, { agencyId: agency.id });
        await noticeAgencyLinkJoined({
          ownerUserId: agency.userId,
          employeeId: result.employeeId,
          attemptAt: result.attemptAt,
          agentName: user.name,
          agencyName: agency.name,
        });
        revalidatePublicContent("agency", agency.slug);
        revalidatePublicContent("property");
        joined = true;
        break;
    }
  } catch (error) {
    return unexpected("dəvət linki ilə qoşulma alınmadı", error, t("actions.unexpected"));
  }

  // `redirect()` istisna atır — try blokundan kənarda çağırılır.
  if (joined) {
    revalidatePath(localizePath("/kabinet/profil", locale));
    redirect(`${localizePath("/kabinet/profil", locale)}?qosuldu=1`);
  }
  return failure(t("actions.unexpected"));
}
