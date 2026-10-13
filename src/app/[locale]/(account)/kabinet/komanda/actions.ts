"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  AGENCY_EMPLOYEE_SOURCES,
  AGENCY_EMPLOYEE_STATUSES,
  MAX_AGENCY_EMPLOYEES,
  type Locale,
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
import { noticeAgencyDecision } from "@/lib/accounts/account-notices";

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
      select: { id: true, accountType: true },
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

    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(t("actions.invitationSent"));
  } catch (error) {
    return unexpected("dəvət göndərilmədi", error, t("actions.unexpected"));
  }
}

export async function removeAgencyEmployee(id: string): Promise<ActionState> {
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
      select: { id: true, agencyId: true, userId: true },
    });
    if (!employee || employee.agencyId !== owner.agency.id) {
      return failure(t("actions.employeeNotFound"));
    }

    await prisma.agencyEmployee.delete({ where: { id } });
    await linkAgentProfileToAgency(employee.userId, owner.agency.id, false);
    await recordDomainEvent("agency.employee_removed", "AgencyEmployee", id, {
      agencyId: owner.agency.id,
    });

    revalidatePublicContent("agency", owner.agency.slug);
    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(t("actions.employeeRemoved"));
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
      select: { id: true, agencyId: true, userId: true, status: true, source: true, invitedAt: true },
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
