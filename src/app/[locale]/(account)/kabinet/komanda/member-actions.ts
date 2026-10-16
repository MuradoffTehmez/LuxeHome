"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { localizePath } from "@/i18n/path-locale";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { queuePropertyVectorSync } from "@/lib/semantic-search";
import { recordAgencyActivity } from "@/lib/accounts/agency-activity";
import { noticeListingAssigned, noticeMemberAccess } from "@/lib/accounts/account-notices";
import {
  ACTIVE_MEMBER_WHERE,
  getAgencyAccess,
  hasAgencyPermission,
  isAgencyEmployeeRole,
  isAgencyMemberPermission,
  serializeMemberPermissions,
  type AgencyAccess,
} from "@/lib/accounts/agency-access";
import {
  AGENCY_ACTIVITY_ACTIONS,
  AGENCY_EMPLOYEE_STATUSES,
  AGENCY_MEMBER_PERMISSIONS,
  LEAD_STATUSES,
  SUSPENSION_REASON_MAX,
  type AgencyMemberPermission,
  type Locale,
} from "@/lib/constants";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Agentlərin idarə edilməsi (#218, PRD 7.2): rol və səlahiyyətlər, girişin dayandırılması/bərpası
 * (yalnız sahib) və agentlik elanının təyini (sahib və ya `LISTINGS_ASSIGN`). Hər dəyişiklik agentlik
 * jurnalına yazılır, agentə bildiriş gedir. Status keçidləri şərti `updateMany` ilədir.
 */

type Context = { user: AuthUser; access: AgencyAccess; locale: Locale; t: Awaited<ReturnType<typeof getTranslations<"account">>> };

async function context(): Promise<Context | ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  try {
    const user = await requirePublicAction("team", locale);
    const access = await getAgencyAccess(user);
    if (!access) return failure(t("actions.agencyOnly"));
    return { user, access, locale, t };
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}

const isFailure = (value: Context | ActionState): value is ActionState => "status" in value;

async function ownerContext(): Promise<Context | ActionState> {
  const ctx = await context();
  if (isFailure(ctx)) return ctx;
  return ctx.access.isOwner ? ctx : failure(ctx.t("actions.agencyOnly"));
}

function loadMember(id: string, agencyId: string) {
  return prisma.agencyEmployee.findFirst({
    where: { id: String(id).slice(0, 40), agencyId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { id: true, userId: true, role: true, permissions: true, suspendedAt: true, user: { select: { name: true } } },
  });
}

/** Sahib üzvün rolunu və səlahiyyətlərini dəyişir. */
export async function updateMemberAccess(id: string, role: string, permissions: string[]): Promise<ActionState> {
  const ctx = await ownerContext();
  if (isFailure(ctx)) return ctx;
  const { t, access, user } = ctx;
  if (!isAgencyEmployeeRole(role) || !Array.isArray(permissions)) return failure(t("actions.invalidForm"));
  const chosen = permissions.filter(isAgencyMemberPermission) as AgencyMemberPermission[];
  try {
    const member = await loadMember(id, access.agencyId);
    if (!member) return failure(t("actions.employeeNotFound"));
    const serialized = serializeMemberPermissions(role, chosen);
    if (member.role === role && member.permissions === serialized) return success(t("team.access.saved"));
    await prisma.agencyEmployee.update({ where: { id: member.id }, data: { role, permissions: serialized } });

    const activity = { agencyId: access.agencyId, actor: user, entityType: "AgencyEmployee" as const, entityId: member.id, entityLabel: member.user.name };
    if (member.role !== role) {
      await recordAgencyActivity({ ...activity, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_ROLE_CHANGED, details: { from: member.role, to: role } });
    }
    if (member.permissions !== serialized) {
      await recordAgencyActivity({ ...activity, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_RIGHTS_CHANGED, details: { permissions: chosen.join(",") || "—" } });
    }
    await noticeMemberAccess({ userId: member.userId, employeeId: member.id, stage: "access", agencyName: access.agencyName, at: new Date() });
  } catch (error) {
    return unexpected("üzvün hüquqları saxlanmadı", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath("/kabinet/komanda", ctx.locale));
  return success(t("team.access.saved"));
}

/**
 * Agentin agentlik mühitinə girişini dayandırır. Açıq agentlik müraciətləri sahibə qayıdır — dayandırılmış
 * agent onları görə bilmir, cavabsız qalmamalıdır. Agentlik elanları sahib onları təyin edənə qədər agentdə qalır.
 */
export async function suspendMember(id: string, reason: string): Promise<ActionState> {
  const ctx = await ownerContext();
  if (isFailure(ctx)) return ctx;
  const { t, access, user } = ctx;
  const note = typeof reason === "string" ? reason.trim().replace(/\s+/g, " ").slice(0, SUSPENSION_REASON_MAX) : "";
  try {
    const member = await loadMember(id, access.agencyId);
    if (!member) return failure(t("actions.employeeNotFound"));
    const at = new Date();
    const { count } = await prisma.agencyEmployee.updateMany({
      where: { id: member.id, status: AGENCY_EMPLOYEE_STATUSES.APPROVED, suspendedAt: null },
      data: { suspendedAt: at, suspendedReason: note || null },
    });
    if (count === 0) return failure(t("team.access.alreadySuspended"));
    const released = await prisma.lead.updateMany({
      where: { agencyId: access.agencyId, handlerId: member.userId, status: { notIn: [LEAD_STATUSES.COMPLETED, LEAD_STATUSES.CLOSED] } },
      data: { handlerId: access.ownerUserId },
    });
    await recordAgencyActivity({
      agencyId: access.agencyId, actor: user, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_SUSPENDED,
      entityType: "AgencyEmployee", entityId: member.id, entityLabel: member.user.name,
      details: { releasedLeads: released.count, reason: note || null },
    });
    await noticeMemberAccess({ userId: member.userId, employeeId: member.id, stage: "suspended", agencyName: access.agencyName, at, reason: note || null });
  } catch (error) {
    return unexpected("agentin girişi dayandırılmadı", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath("/kabinet/komanda", ctx.locale));
  return success(t("team.access.suspended"));
}

export async function resumeMember(id: string): Promise<ActionState> {
  const ctx = await ownerContext();
  if (isFailure(ctx)) return ctx;
  const { t, access, user } = ctx;
  try {
    const member = await loadMember(id, access.agencyId);
    if (!member) return failure(t("actions.employeeNotFound"));
    const { count } = await prisma.agencyEmployee.updateMany({
      where: { id: member.id, suspendedAt: { not: null } },
      data: { suspendedAt: null, suspendedReason: null },
    });
    if (count === 0) return failure(t("team.access.notSuspended"));
    await recordAgencyActivity({
      agencyId: access.agencyId, actor: user, action: AGENCY_ACTIVITY_ACTIONS.MEMBER_RESUMED,
      entityType: "AgencyEmployee", entityId: member.id, entityLabel: member.user.name,
    });
    await noticeMemberAccess({ userId: member.userId, employeeId: member.id, stage: "resumed", agencyName: access.agencyName, at: new Date() });
  } catch (error) {
    return unexpected("agentin girişi bərpa olunmadı", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath("/kabinet/komanda", ctx.locale));
  return success(t("team.access.resumed"));
}

/** Agentlik elanını başqa məsula təyin edir: sahib və ya `LISTINGS_ASSIGN` səlahiyyətli aktiv üzv. */
export async function assignAgencyListing(propertyId: string, targetUserId: string): Promise<ActionState> {
  const ctx = await context();
  if (isFailure(ctx)) return ctx;
  const { t, access, user } = ctx;
  if (!hasAgencyPermission(access, AGENCY_MEMBER_PERMISSIONS.LISTINGS_ASSIGN)) return failure(t("actions.actionUnavailable"));
  if (typeof targetUserId !== "string" || !targetUserId) return failure(t("assignments.invalidTarget"));
  try {
    const property = await prisma.property.findFirst({
      where: { id: String(propertyId).slice(0, 40), agencyId: access.agencyId, deletedAt: null },
      select: { id: true, title: true, slug: true, authorId: true, author: { select: { name: true } } },
    });
    if (!property) return failure(t("actions.propertyNotFound"));
    if (property.authorId === targetUserId) return success(t("assignments.assigned"));
    const isOwnerTarget = targetUserId === access.ownerUserId;
    const member = isOwnerTarget
      ? null
      : await prisma.agencyEmployee.findFirst({
          where: { agencyId: access.agencyId, userId: targetUserId, ...ACTIVE_MEMBER_WHERE, user: { isActive: true } },
          select: { user: { select: { name: true } } },
        });
    if (!isOwnerTarget && !member) return failure(t("assignments.invalidTarget"));

    // Şərti yazılış: arada elan başqa agentliyə köçürülübsə və ya silinibsə toxunulmur.
    const { count } = await prisma.property.updateMany({
      where: { id: property.id, agencyId: access.agencyId, deletedAt: null },
      data: { authorId: targetUserId, assignedAgentId: null },
    });
    if (count === 0) return failure(t("actions.propertyNotFound"));
    const target = member?.user.name ?? (await prisma.user.findUnique({ where: { id: targetUserId }, select: { name: true } }))?.name ?? null;
    await recordAgencyActivity({
      agencyId: access.agencyId, actor: user, action: AGENCY_ACTIVITY_ACTIONS.LISTING_ASSIGNED,
      entityType: "Property", entityId: property.id, entityLabel: property.title,
      details: { from: property.author?.name ?? null, to: target },
    });
    if (targetUserId !== user.id) {
      await noticeListingAssigned({ userId: targetUserId, propertyId: property.id, propertyTitle: property.title, agencyName: access.agencyName, at: new Date() });
    }
    queuePropertyVectorSync([property.id]);
    revalidatePublicContent("property", property.slug);
  } catch (error) {
    return unexpected("elan təyin edilmədi", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath("/kabinet/agentlik/elanlar", ctx.locale));
  return success(t("assignments.assigned"));
}
