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
  AGENCY_ACTIVITY_ACTIONS,
  MEMBERSHIP_END_REASONS,
} from "@/lib/constants";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { recordDomainEvent } from "@/lib/admin/events";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { localizePath } from "@/i18n/path-locale";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { linkAgentProfileToAgency } from "@/lib/accounts/agency-membership";
import { noticeAgencyJoinRequest, noticeAgentLeft } from "@/lib/accounts/account-notices";
import { handOverListings } from "@/lib/accounts/agency-listings";
import { closeMembershipPeriod } from "@/lib/accounts/agency-ownership";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { releaseAgentLeads } from "@/lib/accounts/lead-routing";

/**
 * Agentin özü: agentliyə qoşulma sorğusu (qeydiyyatda seçməyibsə), sorğunu ləğv
 * etmək və agentlikdən çıxmaq. Bir agent eyni anda yalnız bir agentlikdə ola bilər —
 * elan kartında hansı agentliyin adı görünəcəyi birmənalı olmalıdır.
 */

/**
 * Kabinetin digər yazıları kimi `requirePublicAction("team")`-dən keçir: same-origin,
 * yazma rejimi və istifadəçi üzrə sürət limiti. Bu action-lar sahibə bildiriş/e-poçt
 * göndərdiyi üçün limitsiz çağırıla bilməməlidir.
 */
async function requireAgent(locale: Locale, agentOnly: string) {
  const user = await requirePublicAction("team", locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENT) throw new AdminGuardError(agentOnly);
  return user;
}

export async function requestAgencyJoin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let user;
  try {
    user = await requireAgent(locale, t("actions.agentOnly"));
  } catch (error) {
    // `redirect()` də istisna kimi atılır — yalnız qapı xətası mesaja çevrilir.
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

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
          select: { id: true, invitedAt: true },
        })
      : await prisma.agencyEmployee.create({
          data: { agencyId: agency.id, userId: user.id, source: AGENCY_EMPLOYEE_SOURCES.REQUEST },
          select: { id: true, invitedAt: true },
        });

    await recordDomainEvent("agency.employee_requested", "AgencyEmployee", employee.id, { agencyId: agency.id });
    await noticeAgencyJoinRequest({
      ownerUserId: agency.userId,
      employeeId: employee.id,
      attemptAt: employee.invitedAt,
      applicantName: user.name,
      agencyName: agency.name,
    });

    revalidatePath(localizePath("/kabinet/profil", locale));
    return success(t("actions.agencyRequestSent", { name: agency.name }));
  } catch (error) {
    return unexpected("qoşulma sorğusu göndərilmədi", error, t("actions.unexpected"));
  }
}

/**
 * Gözləyən sorğunu ləğv edir və ya təsdiqlənmiş üzvlükdən çıxır. Agentlik elanları agentlə getmir
 * (#210, PRD 6.2) — həmişə agentlik sahibinə təhvil verilir; şəxsi elanlar agentdə qalır.
 */
export async function leaveAgency(id: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let user;
  try {
    user = await requireAgent(locale, t("actions.agentOnly"));
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const membership = await prisma.agencyEmployee.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, role: true, approvedAt: true, agency: { select: { id: true, slug: true, name: true, userId: true } } },
    });
    if (!membership || membership.userId !== user.id || membership.status === AGENCY_EMPLOYEE_STATUSES.REJECTED) {
      return failure(t("actions.requestNotFound"));
    }

    const wasMember = membership.status === AGENCY_EMPLOYEE_STATUSES.APPROVED;
    // Agentlik elanları sahibə keçir — başqa agenti yalnız sahib seçə bilər. Təhvil üzvlük
    // silinməzdən əvvəldir: alınmasa üzvlük qalır və agent təkrar cəhd edə bilir.
    const handedOver = wasMember
      ? await handOverListings(user.id, membership.agency.userId, membership.agency.id)
      : 0;
    // Agentlik müraciətləri sahibə qayıdır (#161); agentdə qalan elanlarına gələnlər onundur.
    if (wasMember) await releaseAgentLeads({ agencyId: membership.agency.id, userId: user.id, ownerUserId: membership.agency.userId });
    await prisma.agencyEmployee.delete({ where: { id } });
    if (wasMember) {
      await linkAgentProfileToAgency(user.id, membership.agency.id, false);
      await recordAgencyActivity({
        agencyId: membership.agency.id, actor: user, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_LEFT,
        entityType: "AgencyEmployee", entityId: id, entityLabel: user.name, details: { handedOver },
      });
      await closeMembershipPeriod({
        userId: user.id,
        agencyId: membership.agency.id,
        reason: MEMBERSHIP_END_REASONS.LEFT,
        handedOver,
        role: membership.role,
        joinedAt: membership.approvedAt,
      });
      revalidatePublicContent("agency", membership.agency.slug);
      revalidatePublicContent("property");
      await noticeAgentLeft({
        ownerUserId: membership.agency.userId,
        employeeId: id,
        leftAt: new Date(),
        agentName: user.name,
        agencyName: membership.agency.name,
        handedOver,
      });
    }
    await recordDomainEvent("agency.employee_left", "AgencyEmployee", id, { agencyId: membership.agency.id, handedOver });

    revalidatePath(localizePath("/kabinet/profil", locale));
    revalidatePath(localizePath("/kabinet/elanlar", locale));
    return success(
      !wasMember
        ? t("actions.agencyRequestCancelled")
        : handedOver > 0
          ? t("team.handover.leftHanded", { count: handedOver })
          : t("actions.agencyLeft"),
    );
  } catch (error) {
    return unexpected("agentlik üzvlüyü dəyişmədi", error, t("actions.unexpected"));
  }
}
