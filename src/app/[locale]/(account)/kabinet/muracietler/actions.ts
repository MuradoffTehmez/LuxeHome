"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AGENCY_ACTIVITY_ACTIONS, LEAD_ACTIVITY_TYPES, LEAD_NOTE_MAX, LEAD_STAGES, type Locale } from "@/lib/constants";
import { isLeadStage, recordLeadActivity, stageData } from "@/lib/accounts/lead-pipeline";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { ACTIVE_MEMBER_WHERE } from "@/lib/accounts/agency-access";
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
    const first = await prisma.lead.updateMany({ where: { id: lead.id, respondedAt: null }, data: { respondedAt: now } });
    // Yeni və ya təyin edilmiş müraciət «əlaqə saxlanılıb» mərhələsinə keçir (#222).
    await prisma.lead.updateMany({
      where: { id: lead.id, stage: { in: [LEAD_STAGES.NEW, LEAD_STAGES.ASSIGNED] } },
      data: stageData(LEAD_STAGES.CONTACTED),
    });
    if (first.count > 0) await recordLeadActivity({ leadId: lead.id, actor: context.user, type: LEAD_ACTIVITY_TYPES.RESPONDED });
    revalidatePath(localizePath(LIST_PATH, context.locale));
    revalidatePath(localizePath(`${LIST_PATH}/${lead.id}`, context.locale));
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
    await prisma.lead.update({ where: { id: lead.id }, data: stageData(LEAD_STAGES.CLOSED) });
    await recordLeadActivity({ leadId: lead.id, actor: context.user, type: LEAD_ACTIVITY_TYPES.STAGE, details: { to: LEAD_STAGES.CLOSED } });
    revalidatePath(localizePath(LIST_PATH, context.locale));
    revalidatePath(localizePath(`${LIST_PATH}/${lead.id}`, context.locale));
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
    if (!lead || !lead.canManage || !lead.agency) return failure(t("actions.notFound"));
    if (typeof targetUserId !== "string" || !targetUserId) return failure(t("actions.invalidAgent"));

    const isOwnerTarget = targetUserId === lead.agency.userId;
    const member = isOwnerTarget
      ? null
      : await prisma.agencyEmployee.findFirst({
          where: { agencyId: lead.agency.id, userId: targetUserId, ...ACTIVE_MEMBER_WHERE, user: { isActive: true } },
          select: { id: true },
        });
    if (!isOwnerTarget && !member) return failure(t("actions.invalidAgent"));
    if (lead.handlerId === targetUserId) return success(t("actions.reassigned"));

    await prisma.lead.update({ where: { id: lead.id }, data: { handlerId: targetUserId } });
    await prisma.lead.updateMany({ where: { id: lead.id, stage: LEAD_STAGES.NEW }, data: stageData(LEAD_STAGES.ASSIGNED) });
    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } });
    await recordLeadActivity({ leadId: lead.id, actor: context.user, type: LEAD_ACTIVITY_TYPES.ASSIGNED, details: { to: target?.name ?? null } });
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
    revalidatePath(localizePath(`${LIST_PATH}/${lead.id}`, context.locale));
    return success(t("actions.reassigned"));
  } catch (error) {
    return unexpected("müraciət başqa agentə verilmədi", error, t("actions.failed"));
  }
}

/** Mərhələni dəyişir (#222, PRD 8.3): müraciətə baxa bilən hər kəs; ilk mərhələ dəyişikliyi cavab sayılır. */
export async function changeLeadStage(id: string, stage: string): Promise<ActionState> {
  const context = await guard();
  if (isFailure(context)) return context;
  const t = await getTranslations("account.leads");
  if (!isLeadStage(stage)) return failure(t("actions.failed"));
  try {
    const lead = await findManageableLead(context.user.id, id);
    if (!lead) return failure(t("actions.notFound"));
    const current = await prisma.lead.findUnique({ where: { id: lead.id }, select: { stage: true } });
    if (!current || current.stage === stage) return success(t("actions.stageSaved"));
    // Şərti yazılış: eyni anda iki dəyişiklik bir-birinin üzərinə səssizcə yazılmır.
    const { count } = await prisma.lead.updateMany({ where: { id: lead.id, stage: current.stage }, data: stageData(stage) });
    if (count === 0) return failure(t("actions.stale"));
    if (stage !== LEAD_STAGES.NEW && stage !== LEAD_STAGES.ASSIGNED) {
      await prisma.lead.updateMany({ where: { id: lead.id, respondedAt: null }, data: { respondedAt: new Date() } });
    }
    await recordLeadActivity({ leadId: lead.id, actor: context.user, type: LEAD_ACTIVITY_TYPES.STAGE, details: { from: current.stage, to: stage } });
  } catch (error) {
    return unexpected("müraciətin mərhələsi dəyişmədi", error, t("actions.failed"));
  }
  revalidatePath(localizePath(LIST_PATH, context.locale));
  revalidatePath(localizePath(`${LIST_PATH}/${id}`, context.locale));
  return success(t("actions.stageSaved"));
}

/** Daxili qeyd (PRD 8.6) — yalnız müraciətə baxa bilənlərə görünür. */
export async function addLeadNote(id: string, text: string): Promise<ActionState> {
  const context = await guard();
  if (isFailure(context)) return context;
  const t = await getTranslations("account.leads");
  const note = typeof text === "string" ? text.trim().slice(0, LEAD_NOTE_MAX) : "";
  if (note.length < 2) return failure(t("actions.noteEmpty"));
  try {
    const lead = await findManageableLead(context.user.id, id);
    if (!lead) return failure(t("actions.notFound"));
    // Qeydin yeganə nüsxəsi tarixçə sətridir — xətanı udan `recordLeadActivity()` burada işlədilmir.
    await prisma.leadActivity.create({
      data: { leadId: lead.id, actorId: context.user.id, actorName: context.user.name.slice(0, 200), type: LEAD_ACTIVITY_TYPES.NOTE, text: note },
    });
  } catch (error) {
    return unexpected("müraciət qeydi yazılmadı", error, t("actions.failed"));
  }
  revalidatePath(localizePath(`${LIST_PATH}/${id}`, context.locale));
  return success(t("actions.noteSaved"));
}

/** Növbəti əlaqə tarixi (`YYYY-MM-DDTHH:mm`, Bakı vaxtı) və ya boş — təmizləmək. */
export async function setLeadNextContact(id: string, value: string): Promise<ActionState> {
  const context = await guard();
  if (isFailure(context)) return context;
  const t = await getTranslations("account.leads");
  let next: Date | null = null;
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return failure(t("actions.invalidDate"));
    next = new Date(`${raw}:00+04:00`);
    if (Number.isNaN(next.getTime())) return failure(t("actions.invalidDate"));
  }
  try {
    const lead = await findManageableLead(context.user.id, id);
    if (!lead) return failure(t("actions.notFound"));
    await prisma.lead.update({ where: { id: lead.id }, data: { nextContactAt: next } });
    await recordLeadActivity({ leadId: lead.id, actor: context.user, type: LEAD_ACTIVITY_TYPES.NEXT_CONTACT, details: { at: next ? next.toISOString() : null } });
  } catch (error) {
    return unexpected("növbəti əlaqə tarixi saxlanmadı", error, t("actions.failed"));
  }
  revalidatePath(localizePath(LIST_PATH, context.locale));
  revalidatePath(localizePath(`${LIST_PATH}/${id}`, context.locale));
  return success(t("actions.nextSaved"));
}
