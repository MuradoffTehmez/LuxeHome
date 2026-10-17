"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  AGENCY_EMPLOYEE_SOURCES,
  AGENCY_EMPLOYEE_STATUSES,
  LISTING_HANDOVER,
  MAX_AGENCY_EMPLOYEES,
  isLeadRoutingMode,
  type Locale,
  MEMBERSHIP_END_REASONS,
  AGENCY_ACTIVITY_ACTIONS,
} from "@/lib/constants";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { recordDomainEvent } from "@/lib/admin/events";
import { type ActionState, failure, success, toFieldErrors, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { localizePath } from "@/i18n/path-locale";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import {
  commitMembershipDecision,
  hasFreeApprovedSeat,
  hasOtherApprovedMembership,
  linkAgentProfileToAgency,
  occupiedAgencySeats,
} from "@/lib/accounts/agency-membership";
import { noticeAgencyDecision, noticeListingsHandedOver } from "@/lib/accounts/account-notices";
import { handOverListings, isListingHandover, resolveHandoverTarget } from "@/lib/accounts/agency-listings";
import { closeMembershipPeriod } from "@/lib/accounts/agency-ownership";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { generateInviteToken } from "@/lib/accounts/agency-invite";
import { releaseAgentLeads } from "@/lib/accounts/lead-routing";
import { validateLeadAlertConfig } from "@/lib/accounts/lead-alerts";

/**
 * Agentlik komandası — sahib (owner) idarə edir.
 *
 * Dəvət yalnız artıq qeydiyyatdan keçmiş hesaba göndərilir: sıfırdan hesab yaratmaq
 * bu axından kənardır, çünki dəvət alan şəxs öz parolunu təyin etməli olacaqdı.
 * PRD-dəki "admin approval" LuxeHome heyəti tərəfindən `/admin/agentlikler`-də edilir.
 *
 * Agentin qeydiyyatda göndərdiyi qoşulma sorğusunu (`source = REQUEST`) isə sahib özü
 * təsdiqləyir — agentin həqiqətən onun əməkdaşı olduğunu ən yaxşı sahib bilir.
 */

async function requireAgencyOwner(
  locale: Locale,
  messages: { agencyOnly: string; agencyProfileRequired: string },
) {
  // `requireAccount()` tək başına kifayət deyildi: mənbə yoxlaması və yazma sürət
  // limiti yalnız `requirePublicAction()`-dadır və kabinetdəki bütün digər yazılar
  // ondan keçir. Bu iki action istisna qalmamalıdır.
  const user = await requirePublicAction("team", locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) {
    throw new AdminGuardError(messages.agencyOnly);
  }
  const agency = await prisma.agency.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, slug: true },
  });
  if (!agency) {
    throw new AdminGuardError(messages.agencyProfileRequired);
  }
  return { user, agency };
}

export async function inviteAgencyEmployee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  const messages = {
    agencyOnly: t("actions.agencyOnly"),
    agencyProfileRequired: t("actions.agencyProfileRequired"),
  };
  let owner;
  try {
    owner = await requireAgencyOwner(locale, messages);
  } catch (error) {
    // Yalnız qapı xətası mesaja çevrilir. `redirect()` də istisna kimi atılır —
    // onu udmaq sessiyası bitmiş istifadəçini giriş səhifəsinə buraxmazdı.
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const inviteSchema = z.object({
    email: z.string().trim().toLowerCase().email(t("actions.invalidEmail")),
  });
  const parsed = inviteSchema.safeParse({ email: form.text(formData, "email") });
  if (!parsed.success) return failure(t("actions.invalidForm"), toFieldErrors(parsed.error));

  try {
    // Gözləyən qoşulma sorğuları yer tutmur — yalnız təsdiqlənmişlər və dəvətlər.
    if ((await occupiedAgencySeats(owner.agency.id)) >= MAX_AGENCY_EMPLOYEES) {
      return failure(t("actions.employeeLimit", { count: MAX_AGENCY_EMPLOYEES }));
    }

    const invitee = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, accountType: true, name: true },
    });
    if (!invitee) {
      return failure(t("actions.accountNotFound"), { email: t("actions.accountNotFoundField") });
    }
    if (invitee.id === owner.user.id) {
      return failure(t("actions.selfInvite"), { email: t("actions.selfInviteField") });
    }
    // Bir aktiv agentlik: agentlik hesabı və başqa agentliyin təsdiqlənmiş əməkdaşı dəvət olunmur.
    if (invitee.accountType === ACCOUNT_TYPES.AGENCY || (await hasOtherApprovedMembership(invitee.id, owner.agency.id))) {
      return failure(t("actions.employeeOtherAgency"), { email: t("actions.employeeOtherAgency") });
    }

    const existing = await prisma.agencyEmployee.findUnique({
      where: { agencyId_userId: { agencyId: owner.agency.id, userId: invitee.id } },
      select: { id: true, status: true },
    });
    if (existing && existing.status !== AGENCY_EMPLOYEE_STATUSES.REJECTED) {
      return failure(t("actions.alreadyInvited"), { email: t("actions.alreadyInvitedField") });
    }

    const employee = existing
      ? await prisma.agencyEmployee.update({
          where: { id: existing.id },
          data: {
            status: AGENCY_EMPLOYEE_STATUSES.PENDING,
            source: AGENCY_EMPLOYEE_SOURCES.INVITE,
            invitedAt: new Date(),
            approvedAt: null,
          },
        })
      : await prisma.agencyEmployee.create({
          data: { agencyId: owner.agency.id, userId: invitee.id },
        });

    await recordDomainEvent("agency.employee_invited", "AgencyEmployee", employee.id, {
      agencyId: owner.agency.id,
      userEmail: parsed.data.email,
    });
    await recordAgencyActivity({
      agencyId: owner.agency.id, actor: owner.user, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_INVITED,
      entityType: "AgencyEmployee", entityId: employee.id, entityLabel: invitee.name,
    });

    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(t("actions.invitationSent"));
  } catch (error) {
    return unexpected("dəvət göndərilmədi", error, t("actions.unexpected"));
  }
}

/**
 * Əməkdaşı komandadan çıxarır (#159): sahib onun elanlarının taleyini seçir — agentdə
 * qalır (`KEEP`), agentliyə (`AGENCY`) və ya başqa təsdiqlənmiş agentə (`AGENT`) keçir.
 */
export async function removeAgencyEmployee(
  id: string,
  handover: string = LISTING_HANDOVER.AGENCY,
  targetUserId: string | null = null,
): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  const messages = {
    agencyOnly: t("actions.agencyOnly"),
    agencyProfileRequired: t("actions.agencyProfileRequired"),
  };
  let owner;
  try {
    owner = await requireAgencyOwner(locale, messages);
  } catch (error) {
    // Yalnız qapı xətası mesaja çevrilir. `redirect()` də istisna kimi atılır —
    // onu udmaq sessiyası bitmiş istifadəçini giriş səhifəsinə buraxmazdı.
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const employee = await prisma.agencyEmployee.findUnique({
      where: { id },
      select: { id: true, agencyId: true, userId: true, status: true, role: true, approvedAt: true, user: { select: { name: true } } },
    });
    if (!employee || employee.agencyId !== owner.agency.id) {
      return failure(t("actions.employeeNotFound"));
    }
    if (!isListingHandover(handover)) return failure(t("actions.invalidForm"));

    // Təhvil yalnız təsdiqlənmiş üzvün agentlik elanlarına aiddir (#210) — onlar agentdə qalmır.
    const target = employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED
      ? await resolveHandoverTarget({
          handover,
          agencyId: owner.agency.id,
          ownerUserId: owner.user.id,
          fromUserId: employee.userId,
          targetUserId,
        })
      : null;
    if (target && !target.ok) return failure(t("team.handover.invalidTarget"));

    // Əvvəl təhvil, sonra üzvlüyün silinməsi (D1-də tranzaksiya yoxdur): təhvil alınmasa
    // üzvlük qalır və sahib təkrar cəhd edə bilir; silmə alınmasa elanlar artıq keçib,
    // təkrar cəhd elansız üzvü adi qaydada çıxarır.
    const handedOver = target?.ok ? await handOverListings(employee.userId, target.userId, owner.agency.id) : 0;
    // Agentlik müraciətləri sahibə qayıdır (#161) — elan təhvilindən sonra, elanla keçənlər də daxil.
    await releaseAgentLeads({ agencyId: owner.agency.id, userId: employee.userId, ownerUserId: owner.user.id });
    await prisma.agencyEmployee.delete({ where: { id } });
    await linkAgentProfileToAgency(employee.userId, owner.agency.id, false);
    if (employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED) {
      await closeMembershipPeriod({
        userId: employee.userId,
        agencyId: owner.agency.id,
        reason: MEMBERSHIP_END_REASONS.REMOVED,
        handedOver,
        role: employee.role,
        joinedAt: employee.approvedAt,
      });
    }
    await recordDomainEvent("agency.employee_removed", "AgencyEmployee", id, {
      agencyId: owner.agency.id,
      handover: target?.ok && handover === LISTING_HANDOVER.AGENT ? LISTING_HANDOVER.AGENT : LISTING_HANDOVER.AGENCY,
      handedOver,
    });
    await recordAgencyActivity({
      agencyId: owner.agency.id, actor: owner.user, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_REMOVED,
      entityType: "AgencyEmployee", entityId: id, entityLabel: employee.user.name, details: { handedOver },
    });
    if (target?.ok && handedOver > 0 && target.userId !== owner.user.id) {
      await noticeListingsHandedOver({
        userId: target.userId,
        employeeId: id,
        handedAt: new Date(),
        count: handedOver,
        fromName: employee.user.name,
        agencyName: owner.agency.name,
      });
    }

    revalidatePublicContent("agency", owner.agency.slug);
    revalidatePath(localizePath("/kabinet/komanda", locale));
    revalidatePath(localizePath("/kabinet/elanlar", locale));
    return success(handedOver > 0 ? t("team.handover.done", { count: handedOver }) : t("actions.employeeRemoved"));
  } catch (error) {
    return unexpected("əməkdaş çıxarılmadı", error, t("actions.unexpected"));
  }
}

export async function approveAgencyRequest(id: string): Promise<ActionState> {
  return reviewAgencyRequest(id, AGENCY_EMPLOYEE_STATUSES.APPROVED);
}

export async function rejectAgencyRequest(id: string): Promise<ActionState> {
  return reviewAgencyRequest(id, AGENCY_EMPLOYEE_STATUSES.REJECTED);
}

/** Sahib agentin qoşulma sorğusunu təsdiqləyir və ya rədd edir. Dəvətə toxunmur. */
async function reviewAgencyRequest(
  id: string,
  decision: typeof AGENCY_EMPLOYEE_STATUSES.APPROVED | typeof AGENCY_EMPLOYEE_STATUSES.REJECTED,
): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let owner;
  try {
    owner = await requireAgencyOwner(locale, {
      agencyOnly: t("actions.agencyOnly"),
      agencyProfileRequired: t("actions.agencyProfileRequired"),
    });
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const request = await prisma.agencyEmployee.findUnique({
      where: { id },
      select: { id: true, agencyId: true, userId: true, status: true, source: true, invitedAt: true, user: { select: { name: true } } },
    });
    const approved = decision === AGENCY_EMPLOYEE_STATUSES.APPROVED;
    // Artıq təsdiqlənmiş sorğunun təkrar təsdiqi qalan addımı (profil bağlantısı) tamamlayır.
    const reviewable = request?.status === AGENCY_EMPLOYEE_STATUSES.PENDING
      || (approved && request?.status === AGENCY_EMPLOYEE_STATUSES.APPROVED);
    if (
      !request ||
      request.agencyId !== owner.agency.id ||
      request.source !== AGENCY_EMPLOYEE_SOURCES.REQUEST ||
      !reviewable
    ) {
      return failure(t("actions.requestNotFound"));
    }
    if (approved && request.status === AGENCY_EMPLOYEE_STATUSES.PENDING) {
      if (!(await hasFreeApprovedSeat(owner.agency.id))) {
        return failure(t("actions.employeeLimit", { count: MAX_AGENCY_EMPLOYEES }));
      }
      if (await hasOtherApprovedMembership(request.userId, owner.agency.id)) {
        return failure(t("actions.employeeOtherAgency"));
      }
    }

    const result = await commitMembershipDecision({
      id,
      userId: request.userId,
      agencyId: owner.agency.id,
      approved,
      currentStatus: request.status,
    });
    if (result === "conflict") return failure(t("actions.requestNotFound"));
    if (result === "resumed") {
      revalidatePublicContent("agency", owner.agency.slug);
      return success(t("actions.requestApproved"));
    }

    await recordDomainEvent(
      approved ? "agency.employee_approved" : "agency.employee_rejected",
      "AgencyEmployee",
      id,
      { agencyId: owner.agency.id, reviewer: "owner" },
    );
    await recordAgencyActivity({
      agencyId: owner.agency.id, actor: owner.user,
      action: approved ? AGENCY_ACTIVITY_ACTIONS.MEMBER_APPROVED : AGENCY_ACTIVITY_ACTIONS.MEMBER_REJECTED,
      entityType: "AgencyEmployee", entityId: id, entityLabel: request.user.name,
    });
    await noticeAgencyDecision({
      userId: request.userId,
      employeeId: id,
      attemptAt: request.invitedAt,
      agencyName: owner.agency.name,
      approved,
    });

    revalidatePublicContent("agency", owner.agency.slug);
    revalidatePublicContent("property");
    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(approved ? t("actions.requestApproved") : t("actions.requestRejected"));
  } catch (error) {
    return unexpected("qoşulma sorğusu yenilənmədi", error, t("actions.unexpected"));
  }
}

/**
 * Dəvət linkini yaradır və ya yeniləyir (#157). Yeni link köhnəsini dərhal öldürür —
 * link yanlış yerə paylaşılıbsa sahib onu bir kliklə etibarsız edə bilir. Link yalnız
 * təsdiqlənmiş agentlikdə işləyir; təsdiqdən əvvəl yaradılsa da açılmır.
 */
export async function regenerateInviteLink(): Promise<ActionState> {
  return setInviteLink(true);
}

/** Dəvət linkini söndürür — köhnə link ilə qoşulmaq mümkün olmur. */
export async function disableInviteLink(): Promise<ActionState> {
  return setInviteLink(false);
}

async function setInviteLink(enabled: boolean): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let owner;
  try {
    owner = await requireAgencyOwner(locale, {
      agencyOnly: t("actions.agencyOnly"),
      agencyProfileRequired: t("actions.agencyProfileRequired"),
    });
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    await prisma.agency.update({
      where: { id: owner.agency.id },
      data: enabled
        ? { inviteToken: generateInviteToken(), inviteTokenCreatedAt: new Date() }
        : { inviteToken: null, inviteTokenCreatedAt: null },
    });
    await recordDomainEvent("agency.invite_link_changed", "Agency", owner.agency.id, { enabled });
    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(enabled ? t("team.inviteLink.created") : t("team.inviteLink.disabled"));
  } catch (error) {
    return unexpected("dəvət linki dəyişmədi", error, t("actions.unexpected"));
  }
}

/** Müraciət bölgüsü rejimi (#161, #224 — PRD 8.4): birbaşa, növbə, yüklənmə, manual və ya ərazi. */
export async function updateLeadRouting(mode: string): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let owner;
  try {
    owner = await requireAgencyOwner(locale, {
      agencyOnly: t("actions.agencyOnly"),
      agencyProfileRequired: t("actions.agencyProfileRequired"),
    });
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  if (!isLeadRoutingMode(mode)) return failure(t("actions.invalidForm"));
  try {
    await prisma.agency.update({ where: { id: owner.agency.id }, data: { leadRouting: mode } });
    await recordDomainEvent("agency.lead_routing_changed", "Agency", owner.agency.id, { mode });
    await recordAgencyActivity({
      agencyId: owner.agency.id, actor: owner.user, action: AGENCY_ACTIVITY_ACTIONS.LEAD_ROUTING_CHANGED,
      entityType: "Agency", entityId: owner.agency.id, entityLabel: owner.agency.name, details: { mode },
    });
    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(t("team.routing.saved"));
  } catch (error) {
    return unexpected("müraciət bölgüsü saxlanmadı", error, t("actions.unexpected"));
  }
}

/**
 * Cavabsız müraciət pillələri (#224, PRD 8.5): xatırlatma, menecerə bildiriş və təkrar təyinat
 * təklifi (dəqiqə). Yalnız sahib dəyişir; yeni müddət artıq gözləyən müraciətlərə də aiddir.
 */
export async function updateLeadAlerts(input: { reminder: unknown; alert: unknown; reassign: unknown }): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let owner;
  try {
    owner = await requireAgencyOwner(locale, {
      agencyOnly: t("actions.agencyOnly"),
      agencyProfileRequired: t("actions.agencyProfileRequired"),
    });
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  const result = validateLeadAlertConfig(input);
  if (!result.ok) return failure(t(result.error === "order" ? "team.alerts.order" : "team.alerts.range"));
  const { config } = result;
  try {
    await prisma.agency.update({
      where: { id: owner.agency.id },
      data: { leadReminderMinutes: config.reminder, leadAlertMinutes: config.alert, leadReassignMinutes: config.reassign },
    });
    await recordAgencyActivity({
      agencyId: owner.agency.id, actor: owner.user, action: AGENCY_ACTIVITY_ACTIONS.LEAD_ALERTS_CHANGED,
      entityType: "Agency", entityId: owner.agency.id, entityLabel: owner.agency.name, details: { ...config },
    });
    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(t("team.alerts.saved"));
  } catch (error) {
    return unexpected("müraciət xəbərdarlıqları saxlanmadı", error, t("actions.unexpected"));
  }
}

/** Agentin müraciət növbəsində olub-olmaması (#161) — məsələn, məzuniyyətdə olan agent. */
export async function setEmployeeReceivesLeads(id: string, receives: boolean): Promise<ActionState> {
  const locale = await getLocale() as Locale;
  const t = await getTranslations("account");
  let owner;
  try {
    owner = await requireAgencyOwner(locale, {
      agencyOnly: t("actions.agencyOnly"),
      agencyProfileRequired: t("actions.agencyProfileRequired"),
    });
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  try {
    const { count } = await prisma.agencyEmployee.updateMany({
      where: { id, agencyId: owner.agency.id, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
      data: { receivesLeads: receives === true },
    });
    if (count === 0) return failure(t("actions.employeeNotFound"));
    const member = await prisma.agencyEmployee.findUnique({ where: { id }, select: { user: { select: { name: true } } } });
    await recordAgencyActivity({
      agencyId: owner.agency.id, actor: owner.user, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_RIGHTS_CHANGED,
      entityType: "AgencyEmployee", entityId: id, entityLabel: member?.user.name ?? null, details: { receivesLeads: receives === true },
    });
    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(receives ? t("team.routing.memberOn") : t("team.routing.memberOff"));
  } catch (error) {
    return unexpected("agentin növbə ayarı saxlanmadı", error, t("actions.unexpected"));
  }
}
