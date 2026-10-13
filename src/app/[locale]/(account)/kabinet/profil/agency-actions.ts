"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  AGENCY_EMPLOYEE_SOURCES,
  AGENCY_EMPLOYEE_STATUSES,
  MAX_PENDING_AGENCY_REQUESTS,
  type Locale,
} from "@/lib/constants";
import { requireAccount } from "@/lib/auth/guard";
import { systemModeBlock } from "@/lib/admin/guard";
import { recordDomainEvent } from "@/lib/admin/events";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { localizePath } from "@/i18n/path-locale";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { linkAgentProfileToAgency } from "@/lib/accounts/agency-membership";
import { noticeAgencyJoinRequest } from "@/lib/accounts/account-notices";

/**
 * Agentin özü: agentliyə qoşulma sorğusu (qeydiyyatda seçməyibsə), sorğunu ləğv
 * etmək və agentlikdən çıxmaq. Bir agent eyni anda yalnız bir agentlikdə ola bilər —
 * elan kartında hansı agentliyin adı görünəcəyi birmənalı olmalıdır.
 */

async function requireAgent(locale: Locale) {
  const user = await requireAccount(locale);
  return user.accountType === ACCOUNT_TYPES.AGENT ? user : null;
}

export async function requestAgencyJoin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  const user = await requireAgent(locale);
  if (!user) return failure(t("actions.agentOnly"));
  const blocked = await systemModeBlock();
  if (blocked) return blocked;

  const slug = form.optionalText(formData, "agencySlug");
  if (!slug) return failure(t("actions.agencyNotFound"), { agencySlug: t("actions.agencyNotFound") });

  try {
    const active = await prisma.agencyEmployee.findFirst({
      where: { userId: user.id, status: { in: [AGENCY_EMPLOYEE_STATUSES.PENDING, AGENCY_EMPLOYEE_STATUSES.APPROVED] } },
      select: { id: true },
    });
    if (active) return failure(t("actions.agencyAlreadyMember"));

    const agency = await prisma.agency.findFirst({
      where: { slug, isVerified: true, user: { isActive: true } },
      select: { id: true, name: true, userId: true },
    });
    if (!agency) return failure(t("actions.agencyNotFound"), { agencySlug: t("actions.agencyNotFound") });
    if (agency.userId === user.id) return failure(t("actions.agencyNotFound"));

    const pendingRequests = await prisma.agencyEmployee.count({
      where: { agencyId: agency.id, status: AGENCY_EMPLOYEE_STATUSES.PENDING, source: AGENCY_EMPLOYEE_SOURCES.REQUEST },
    });
    if (pendingRequests >= MAX_PENDING_AGENCY_REQUESTS) {
      return failure(t("actions.agencyRequestsFull"), { agencySlug: t("actions.agencyRequestsFull") });
    }

    // Əvvəl rədd edilmiş qeyd varsa yenidən açılır — `@@unique([agencyId, userId])`.
    const existing = await prisma.agencyEmployee.findUnique({
      where: { agencyId_userId: { agencyId: agency.id, userId: user.id } },
      select: { id: true },
    });
    const employee = existing
      ? await prisma.agencyEmployee.update({
          where: { id: existing.id },
          data: {
            status: AGENCY_EMPLOYEE_STATUSES.PENDING,
            source: AGENCY_EMPLOYEE_SOURCES.REQUEST,
            invitedAt: new Date(),
            approvedAt: null,
          },
          select: { id: true },
        })
      : await prisma.agencyEmployee.create({
          data: { agencyId: agency.id, userId: user.id, source: AGENCY_EMPLOYEE_SOURCES.REQUEST },
          select: { id: true },
        });

    await recordDomainEvent("agency.employee_requested", "AgencyEmployee", employee.id, { agencyId: agency.id });
    await noticeAgencyJoinRequest({
      ownerUserId: agency.userId,
      employeeId: employee.id,
      applicantName: user.name,
      agencyName: agency.name,
    });

    revalidatePath(localizePath("/kabinet/profil", locale));
    return success(t("actions.agencyRequestSent", { name: agency.name }));
  } catch (error) {
    return unexpected("qoşulma sorğusu göndərilmədi", error, t("actions.unexpected"));
  }
}

/** Gözləyən sorğunu ləğv edir və ya təsdiqlənmiş üzvlükdən çıxır. */
export async function leaveAgency(id: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  const user = await requireAgent(locale);
  if (!user) return failure(t("actions.agentOnly"));
  const blocked = await systemModeBlock();
  if (blocked) return blocked;

  try {
    const membership = await prisma.agencyEmployee.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, agency: { select: { id: true, slug: true } } },
    });
    if (!membership || membership.userId !== user.id || membership.status === AGENCY_EMPLOYEE_STATUSES.REJECTED) {
      return failure(t("actions.requestNotFound"));
    }

    await prisma.agencyEmployee.delete({ where: { id } });
    const wasMember = membership.status === AGENCY_EMPLOYEE_STATUSES.APPROVED;
    if (wasMember) {
      await linkAgentProfileToAgency(user.id, membership.agency.id, false);
      revalidatePublicContent("agency", membership.agency.slug);
      revalidatePublicContent("property");
    }
    await recordDomainEvent("agency.employee_left", "AgencyEmployee", id, { agencyId: membership.agency.id });

    revalidatePath(localizePath("/kabinet/profil", locale));
    return success(wasMember ? t("actions.agencyLeft") : t("actions.agencyRequestCancelled"));
  } catch (error) {
    return unexpected("agentlik üzvlüyü dəyişmədi", error, t("actions.unexpected"));
  }
}
