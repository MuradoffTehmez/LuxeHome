"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  LISTING_TYPES,
  PERMISSIONS,
  PROPERTY_STATUSES,
  REJECTION_REASON_MAX,
  REJECTION_REASON_MIN,
  REPORT_RESOLUTIONS,
  REPORT_STATUSES,
} from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { recordDomainEvent } from "@/lib/admin/events";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { propertyLifecycleData } from "@/lib/admin/property-input";
import { propertyRetentionDays } from "@/lib/property-publish-validation";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { queuePropertyVectorSync } from "@/lib/semantic-search";
import { noticeListingReportDecision } from "@/lib/accounts/account-notices";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Elan şikayətlərinə admin qərarı (#159). Qərar elan üzrədir: həmin elanın bütün açıq
 * şikayətləri birlikdə bağlanır. D1-də tranzaksiya olmadığı üçün açıq şikayətlər əvvəl
 * şərti `updateMany` ilə **götürülür**: yalnız onları götürən sorğu elanı dəyişir, sahibə
 * bildiriş və audit yazır. Gecikmiş/eyni anda gələn ikinci sorğu heç nə götürmür və dayanır;
 * elan yazılmasa götürülmüş şikayətlər yenidən açılır.
 */

const LIST_PATH = "/admin/sikayetler";

async function guard(): Promise<AuthUser | ActionState> {
  try {
    return await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}

const isFailure = (value: AuthUser | ActionState): value is ActionState => "status" in value;

async function closeOpenReports(
  actor: AuthUser,
  propertyId: string,
  status: typeof REPORT_STATUSES.RESOLVED | typeof REPORT_STATUSES.DISMISSED,
  resolution: string,
  note: string | null,
  decidedAt = new Date(),
): Promise<number> {
  const { count } = await prisma.listingReport.updateMany({
    where: { propertyId, status: REPORT_STATUSES.OPEN },
    data: { status, resolution, resolutionNote: note, resolvedById: actor.id, resolvedAt: decidedAt },
  });
  return count;
}

/** Kompensasiya: elan yazılmadısa bu sorğunun götürdüyü şikayətlər yenidən açılır. */
async function reopenClaimedReports(actor: AuthUser, propertyId: string, decidedAt: Date): Promise<void> {
  await prisma.listingReport.updateMany({
    where: { propertyId, status: REPORT_STATUSES.RESOLVED, resolvedById: actor.id, resolvedAt: decidedAt },
    data: { status: REPORT_STATUSES.OPEN, resolution: null, resolutionNote: null, resolvedById: null, resolvedAt: null },
  });
}

/** Açıq şikayətləri götürür, sonra elanı dəyişir; elan yazılmasa götürüləni geri açır. */
async function claimThenUpdate(
  actor: AuthUser,
  propertyId: string,
  resolution: string,
  note: string | null,
  decidedAt: Date,
  apply: () => Promise<unknown>,
): Promise<boolean> {
  const claimed = await closeOpenReports(actor, propertyId, REPORT_STATUSES.RESOLVED, resolution, note, decidedAt);
  if (claimed === 0) return false;
  try {
    await apply();
  } catch (error) {
    await reopenClaimedReports(actor, propertyId, decidedAt).catch(() => undefined);
    throw error;
  }
  return true;
}

async function loadProperty(propertyId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      listingType: true,
      publishedAt: true,
      closedAt: true,
      listingExpiresAt: true,
      expiredAt: true,
      author: { select: { id: true, accountType: true } },
    },
  });
}

function afterChange(slug: string) {
  revalidatePath(LIST_PATH);
  revalidatePath("/admin/moderation");
  revalidatePath("/emlaklar");
  revalidatePublicContent("property", slug);
}

/** Elanı dayandırır (ARCHIVED) — səbəb sahibə bildiriş və e-poçt kimi gedir. */
export async function archiveReportedListing(propertyId: string, reason: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const note = typeof reason === "string" ? reason.trim().replace(/\s+/g, " ") : "";
  if (note.length < REJECTION_REASON_MIN || note.length > REJECTION_REASON_MAX) {
    return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }

  try {
    const property = await loadProperty(propertyId);
    if (!property) return failure(msg("server.reports.elanTapilmadi"));

    const decidedAt = new Date();
    const retentionDays = await propertyRetentionDays();
    const applied = await claimThenUpdate(actor, property.id, REPORT_RESOLUTIONS.ARCHIVED, note, decidedAt, () =>
      prisma.property.update({
        where: { id: property.id },
        data: {
          status: PROPERTY_STATUSES.ARCHIVED,
          ...propertyLifecycleData(PROPERTY_STATUSES.ARCHIVED, property, retentionDays),
          moderationNote: note,
        },
      }),
    );
    if (!applied) return failure(msg("server.reports.acikSikayetYoxdur"));
    if (property.author && property.author.accountType !== ACCOUNT_TYPES.STAFF) {
      await noticeListingReportDecision({
        userId: property.author.id,
        propertyId: property.id,
        propertyTitle: property.title,
        decision: "archived",
        decidedAt,
        reason: note,
      });
    }
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — şikayət əsasında dayandırıldı: ${note}`);
    await recordDomainEvent("property.status_changed", "Property", property.id, {
      title: property.title,
      status: PROPERTY_STATUSES.ARCHIVED,
      reason: note,
    });
    queuePropertyVectorSync([property.id]);
    afterChange(property.slug);
    return success(msg("server.reports.elanDayandirildi"));
  } catch (error) {
    return unexpected("şikayət edilən elan dayandırılmadı", error, msg("server.common.unexpected"));
  }
}

/** «Artıq satılıb / kirayəyə verilib» şikayəti təsdiqləndi — elan SOLD və ya RENTED olur. */
export async function closeReportedListing(propertyId: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;

  try {
    const property = await loadProperty(propertyId);
    if (!property) return failure(msg("server.reports.elanTapilmadi"));

    const status = property.listingType === LISTING_TYPES.RENT ? PROPERTY_STATUSES.RENTED : PROPERTY_STATUSES.SOLD;
    const decidedAt = new Date();
    const retentionDays = await propertyRetentionDays();
    const applied = await claimThenUpdate(actor, property.id, REPORT_RESOLUTIONS.MARKED_CLOSED, null, decidedAt, () =>
      prisma.property.update({
        where: { id: property.id },
        data: { status, ...propertyLifecycleData(status, property, retentionDays) },
      }),
    );
    if (!applied) return failure(msg("server.reports.acikSikayetYoxdur"));
    if (property.author && property.author.accountType !== ACCOUNT_TYPES.STAFF) {
      await noticeListingReportDecision({
        userId: property.author.id,
        propertyId: property.id,
        propertyTitle: property.title,
        decision: "closed",
        decidedAt,
      });
    }
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — şikayət əsasında ${status} kimi bağlandı`);
    await recordDomainEvent("property.status_changed", "Property", property.id, { title: property.title, status });
    queuePropertyVectorSync([property.id]);
    afterChange(property.slug);
    return success(msg("server.reports.elanBaglandi"));
  } catch (error) {
    return unexpected("şikayət edilən elan bağlanmadı", error, msg("server.common.unexpected"));
  }
}

/** Şikayət əsassızdır — elan dəyişmir. */
export async function dismissListingReports(propertyId: string): Promise<ActionState> {
  return decideWithoutChange(propertyId, REPORT_STATUSES.DISMISSED);
}

/** Problem başqa yolla həll edilib (məs. moderator elanı özü düzəldib) — elan dəyişmir. */
export async function resolveListingReports(propertyId: string): Promise<ActionState> {
  return decideWithoutChange(propertyId, REPORT_STATUSES.RESOLVED);
}

async function decideWithoutChange(
  propertyId: string,
  status: typeof REPORT_STATUSES.RESOLVED | typeof REPORT_STATUSES.DISMISSED,
): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;

  try {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, title: true, slug: true } });
    if (!property) return failure(msg("server.reports.elanTapilmadi"));
    const count = await closeOpenReports(actor, property.id, status, REPORT_RESOLUTIONS.NO_ACTION, null);
    if (count === 0) return failure(msg("server.reports.acikSikayetYoxdur"));
    await recordAudit(
      actor,
      "UPDATE",
      "Property",
      property.id,
      `${property.title} — ${count} şikayət ${status === REPORT_STATUSES.DISMISSED ? "əsassız sayıldı" : "həll edildi"}`,
    );
    afterChange(property.slug);
    return success(status === REPORT_STATUSES.DISMISSED ? msg("server.reports.esassizSayildi") : msg("server.reports.hellEdildi"));
  } catch (error) {
    return unexpected("şikayət qərarı yazılmadı", error, msg("server.common.unexpected"));
  }
}
