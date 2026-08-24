"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, AGENCY_EMPLOYEE_STATUSES, MAX_AGENCY_EMPLOYEES, type Locale } from "@/lib/constants";
import { requireAccount } from "@/lib/auth/guard";
import { recordDomainEvent } from "@/lib/admin/events";
import { type ActionState, failure, success, toFieldErrors, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { localizePath } from "@/i18n/path-locale";

/**
 * Agentlik komandası — sahib (owner) idarə edir.
 *
 * Dəvət yalnız artıq qeydiyyatdan keçmiş hesaba göndərilir: sıfırdan hesab yaratmaq
 * bu axından kənardır, çünki dəvət alan şəxs öz parolunu təyin etməli olacaqdı.
 * PRD-dəki "admin approval" LuxeHome heyəti tərəfindən `/admin/agentlikler`-də edilir.
 */

async function requireAgencyOwner(
  locale: Locale,
  messages: { agencyOnly: string; agencyProfileRequired: string },
) {
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) {
    throw new Error(messages.agencyOnly);
  }
  const agency = await prisma.agency.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  if (!agency) {
    throw new Error(messages.agencyProfileRequired);
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
    return failure(error instanceof Error ? error.message : t("actions.actionUnavailable"));
  }

  const inviteSchema = z.object({
    email: z.string().trim().toLowerCase().email(t("actions.invalidEmail")),
  });
  const parsed = inviteSchema.safeParse({ email: form.text(formData, "email") });
  if (!parsed.success) return failure(t("actions.invalidForm"), toFieldErrors(parsed.error));

  try {
    const activeCount = await prisma.agencyEmployee.count({
      where: {
        agencyId: owner.agency.id,
        status: { in: [AGENCY_EMPLOYEE_STATUSES.PENDING, AGENCY_EMPLOYEE_STATUSES.APPROVED] },
      },
    });
    if (activeCount >= MAX_AGENCY_EMPLOYEES) {
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
          data: { status: AGENCY_EMPLOYEE_STATUSES.PENDING, invitedAt: new Date(), approvedAt: null },
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
    return failure(error instanceof Error ? error.message : t("actions.actionUnavailable"));
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
    await recordDomainEvent("agency.employee_removed", "AgencyEmployee", id, {
      agencyId: owner.agency.id,
    });

    revalidatePath(localizePath("/kabinet/komanda", locale));
    return success(t("actions.employeeRemoved"));
  } catch (error) {
    return unexpected("əməkdaş çıxarılmadı", error, t("actions.unexpected"));
  }
}
