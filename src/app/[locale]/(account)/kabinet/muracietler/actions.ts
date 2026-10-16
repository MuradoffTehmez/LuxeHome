"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AGENCY_ACTIVITY_ACTIONS, AGENCY_EMPLOYEE_STATUSES, LEAD_STATUSES, type Locale } from "@/lib/constants";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { localizePath } from "@/i18n/path-locale";
import { findManageableLead } from "@/lib/accounts/listing-leads";
import { noticeLeadRouted } from "@/lib/accounts/account-notices";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Kabinetdəki müraciət əməliyyatları (#161): «Əlaqə saxladım», bağlamaq və agentlik
 * sahibinin müraciəti başqa agentə verməsi. İlk cavab vaxtı (`respondedAt`) «Tez cavab
 * verir» nişanının mənbəyidir və yalnız bir dəfə yazılır (şərti `updateMany`).
 */

const LIST_PATH = "/kabinet/muracietler";

async function guard(): Promise<{ user: AuthUser; locale: Locale } | ActionState> {
  const locale = await getLocale() as Locale;
  try {
    return { user: await requirePublicAction("lead", locale), locale };
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}

const isFailure = (value: unknown): value is ActionState => typeof value === "object" && value !== null && "status" in value;

/** Müştəri ilə əlaqə saxlanıldı: ilk cavab vaxtı yazılır, yeni müraciət «əlaqə saxlanılıb» olur. */
export async function markLeadResponded(id: string): Promise<ActionState> {
  const context = await guard();
  if (isFailure(context)) return context;
  const t = await getTranslations("account.leads");
  try {
    const lead = await findManageableLead(context.user.id, id);
    if (!lead) return failure(t("actions.notFound"));
    const now = new Date();
    await prisma.lead.updateMany({ where: { id: lead.id, respondedAt: null }, data: { respondedAt: now } });
    await prisma.lead.updateMany({ where: { id: lead.id, status: LEAD_STATUSES.NEW }, data: { status: LEAD_STATUSES.CONTACTED } });
    revalidatePath(localizePath(LIST_PATH, context.locale));
    return success(t("actions.responded"));
  } catch (error) {
    return unexpected("müraciət cavablandırılmadı", error, t("actions.failed"));
  }
}

/**
 * Müraciəti bağlayır. Cavab qeyd olunmayıbsa bağlama da cavab sayılır — spam və ya
 * telefonla həll edilmiş müraciət «cavabsız» qalıb göstəricini korlamasın.
 */
export async function closeLead(id: string): Promise<ActionState> {
  const context = await guard();
  if (isFailure(context)) return context;
  const t = await getTranslations("account.leads");
  try {
    const lead = await findManageableLead(context.user.id, id);
    if (!lead) return failure(t("actions.notFound"));
    const now = new Date();
    await prisma.lead.updateMany({ where: { id: lead.id, respondedAt: null }, data: { respondedAt: now } });
    await prisma.lead.update({ where: { id: lead.id }, data: { status: LEAD_STATUSES.CLOSED } });
    revalidatePath(localizePath(LIST_PATH, context.locale));
    return success(t("actions.closed"));
  } catch (error) {
    return unexpected("müraciət bağlanmadı", error, t("actions.failed"));
  }
}

/** Agentlik sahibi müraciəti özünə və ya təsdiqlənmiş agentinə verir. */
export async function reassignLead(id: string, targetUserId: string): Promise<ActionState> {
  const context = await guard();
  if (isFailure(context)) return context;
  const t = await getTranslations("account.leads");
  try {
    const lead = await findManageableLead(context.user.id, id);
    if (!lead || !lead.isOwner || !lead.agency) return failure(t("actions.notFound"));
    if (typeof targetUserId !== "string" || !targetUserId) return failure(t("actions.invalidAgent"));

    const isOwnerTarget = targetUserId === lead.agency.userId;
    const member = isOwnerTarget
      ? null
      : await prisma.agencyEmployee.findFirst({
          where: { agencyId: lead.agency.id, userId: targetUserId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED, user: { isActive: true } },
          select: { id: true },
        });
    if (!isOwnerTarget && !member) return failure(t("actions.invalidAgent"));
    if (lead.handlerId === targetUserId) return success(t("actions.reassigned"));

    await prisma.lead.update({ where: { id: lead.id }, data: { handlerId: targetUserId } });
    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } });
    await recordAgencyActivity({
      agencyId: lead.agency.id, actor: context.user, action: AGENCY_ACTIVITY_ACTIONS.LEAD_REASSIGNED,
      entityType: "Lead", entityId: lead.id, entityLabel: lead.property?.title ?? lead.subject ?? lead.name,
      details: { to: target?.name ?? null },
    });
    if (member) {
      await prisma.agencyEmployee.update({ where: { id: member.id }, data: { lastLeadAt: new Date() } });
      await noticeLeadRouted({
        userId: targetUserId,
        leadId: lead.id,
        agencyName: lead.agency.name,
        subject: lead.property?.title ?? lead.subject ?? "",
        visitorName: lead.name,
      });
    }
    revalidatePath(localizePath(LIST_PATH, context.locale));
    return success(t("actions.reassigned"));
  } catch (error) {
    return unexpected("müraciət başqa agentə verilmədi", error, t("actions.failed"));
  }
}
