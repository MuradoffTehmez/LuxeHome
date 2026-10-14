"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, MAX_AGENCY_OFFICES, type Locale } from "@/lib/constants";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { localizePath } from "@/i18n/path-locale";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { createAgencyOffice, deleteAgencyOffice, parseOfficeForm } from "@/lib/accounts/agency-offices";

/**
 * Agentlik sahibinin filialları (#157). Komanda action-ları kimi `requirePublicAction("team")`-dən
 * keçir: same-origin, yazma rejimi və istifadəçi üzrə sürət limiti.
 */
async function requireOwnAgency(locale: Locale, messages: { agencyOnly: string; agencyProfileRequired: string }) {
  const user = await requirePublicAction("team", locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) throw new AdminGuardError(messages.agencyOnly);
  const agency = await prisma.agency.findUnique({ where: { userId: user.id }, select: { id: true, slug: true } });
  if (!agency) throw new AdminGuardError(messages.agencyProfileRequired);
  return agency;
}

export async function addAgencyOffice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let agency;
  try {
    agency = await requireOwnAgency(locale, {
      agencyOnly: t("actions.agencyOnly"),
      agencyProfileRequired: t("actions.agencyProfileRequired"),
    });
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = parseOfficeForm(formData, {
    name: t("offices.errors.name"),
    address: t("offices.errors.address"),
    phone: t("actions.invalidPhone"),
    city: t("offices.errors.city"),
    invalid: t("actions.invalidField"),
  });
  if (!parsed.ok) return failure(t("actions.invalidForm"), parsed.fieldErrors);

  try {
    const result = await createAgencyOffice(agency.id, parsed.data);
    if (result === "limit") return failure(t("offices.errors.limit", { count: MAX_AGENCY_OFFICES }));
    if (result === "city") return failure(t("actions.invalidForm"), { officeCityId: t("offices.errors.city") });
    revalidatePath(localizePath("/kabinet/profil", locale));
    revalidatePublicContent("agency", agency.slug);
    return success(t("offices.added"));
  } catch (error) {
    return unexpected("filial əlavə olunmadı", error, t("actions.unexpected"));
  }
}

export async function removeAgencyOffice(id: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let agency;
  try {
    agency = await requireOwnAgency(locale, {
      agencyOnly: t("actions.agencyOnly"),
      agencyProfileRequired: t("actions.agencyProfileRequired"),
    });
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    if (!(await deleteAgencyOffice(agency.id, id))) return failure(t("offices.errors.notFound"));
    revalidatePath(localizePath("/kabinet/profil", locale));
    revalidatePublicContent("agency", agency.slug);
    return success(t("offices.removed"));
  } catch (error) {
    return unexpected("filial silinmədi", error, t("actions.unexpected"));
  }
}
