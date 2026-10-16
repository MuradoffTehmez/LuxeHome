"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  ACTIVE_REPORT_STATUSES,
  LISTING_TYPES,
  PERMISSIONS,
  PROPERTY_STATUSES,
  REJECTION_REASON_MAX,
  REJECTION_REASON_MIN,
  REPORT_NOTE_MAX,
  REPORT_NOTE_MIN,
  REPORT_RESOLUTIONS,
  REPORT_STATUSES,
  type ReportResolution,
} from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { recordDomainEvent } from "@/lib/admin/events";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg, type ServerMessageKey } from "@/lib/admin/server-message";
import { propertyLifecycleData } from "@/lib/admin/property-input";
import { propertyRetentionDays } from "@/lib/property-publish-validation";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { queuePropertyVectorSync } from "@/lib/semantic-search";
import {
  noticeListingInfoRequested,
  noticeListingReportDecision,
  noticeReportOutcome,
  type ReportOutcome,
} from "@/lib/accounts/account-notices";
import {
  activeReporterIds,
  addReportNote,
  assignActiveReports,
  parseReportCycleId,
  reopenDecidedReports,
  requestReportInfo,
  revertReportInfoRequest,
} from "@/lib/listing-reports";
import { reportModeratorWhere } from "@/lib/admin/report-moderators";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Elan şikayətlərinin admin iş axını (#159, #195). Qərar elan üzrədir: həmin elanın bütün
 * aktiv (yeni / yoxlanılan / məlumat gözləyən) şikayətləri birlikdə hərəkət edir.
 *
 * D1-də tranzaksiya olmadığı üçün qərar verəndə aktiv şikayətlər əvvəl şərti `updateMany` ilə
 * **götürülür**: yalnız onları götürən sorğu elanı dəyişir, sahibə bildiriş və audit yazır.
 * Gecikmiş/eyni anda gələn ikinci sorğu heç nə götürmür və dayanır; elan yazılmasa götürülmüş
 * şikayətlər «Yoxlanılır» mərhələsinə qaytarılır.
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

type DecisionStatus = typeof REPORT_STATUSES.RESOLVED | typeof REPORT_STATUSES.DISMISSED | typeof REPORT_STATUSES.CLOSED;

const OUTCOME: Record<DecisionStatus, ReportOutcome> = {
  RESOLVED: "confirmed",
  DISMISSED: "dismissed",
  CLOSED: "closed",
};

function normalizeNote(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function noteLengthError(note: string): ActionState | null {
  if (note.length >= REJECTION_REASON_MIN && note.length <= REJECTION_REASON_MAX) return null;
  return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
}

async function claimActiveReports(
  actor: AuthUser,
  propertyId: string,
  status: DecisionStatus,
  resolution: ReportResolution,
  note: string | null,
  decidedAt: Date,
): Promise<number> {
  const { count } = await prisma.listingReport.updateMany({
    where: { propertyId, status: { in: [...ACTIVE_REPORT_STATUSES] } },
    data: { status, resolution, resolutionNote: note, resolvedById: actor.id, resolvedAt: decidedAt },
  });
  return count;
}

/** Kompensasiya: elan yazılmadısa bu sorğunun götürdüyü şikayətlər yoxlamaya qaytarılır. */
async function releaseClaimedReports(actor: AuthUser, propertyId: string, decidedAt: Date): Promise<void> {
  await prisma.listingReport.updateMany({
    where: { propertyId, status: REPORT_STATUSES.RESOLVED, resolvedById: actor.id, resolvedAt: decidedAt },
    data: { status: REPORT_STATUSES.IN_REVIEW, resolution: null, resolutionNote: null, resolvedById: null, resolvedAt: null },
  });
}

/** Aktiv şikayətləri götürür, sonra elanı dəyişir; elan yazılmasa götürüləni geri qaytarır. */
async function claimThenUpdate(
  actor: AuthUser,
  propertyId: string,
  resolution: ReportResolution,
  note: string | null,
  decidedAt: Date,
  apply: () => Promise<unknown>,
): Promise<boolean> {
  const claimed = await claimActiveReports(actor, propertyId, REPORT_STATUSES.RESOLVED, resolution, note, decidedAt);
  if (claimed === 0) return false;
  try {
    await apply();
  } catch (error) {
    await releaseClaimedReports(actor, propertyId, decidedAt).catch(() => undefined);
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

/** Şikayətçilərə nəticə bildirilir; bildiriş xətası qərarı sındırmır (`notifyAccount` atmır). */
async function notifyReporters(
  reporterIds: readonly string[],
  property: { id: string; title: string },
  status: DecisionStatus,
  decidedAt: Date,
): Promise<void> {
  await Promise.all(reporterIds.map((userId) =>
    noticeReportOutcome({ userId, propertyId: property.id, propertyTitle: property.title, decidedAt, outcome: OUTCOME[status] })));
}

function afterChange(slug?: string) {
  revalidatePath(LIST_PATH);
  revalidatePath("/admin/moderation");
  if (!slug) return;
  revalidatePath("/emlaklar");
  revalidatePublicContent("property", slug);
}

// ─── Mərhələ keçidləri ───────────────────────────────────────────────────────────────

/** «Mənə götür»: aktiv şikayətlər cari moderatora təyin olunur, yenilər «Yoxlanılır»-a keçir. */
export async function takeListingReports(propertyId: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  return assign(actor, propertyId, actor.id, actor.name);
}

/** Aktiv şikayətləri başqa moderatora təyin edir. Yalnız `property:manage` icazəli aktiv əməkdaş seçilə bilər. */
export async function assignListingReports(propertyId: string, assigneeId: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  try {
    const assignee = await prisma.user.findFirst({
      where: { ...reportModeratorWhere(), id: String(assigneeId).slice(0, 40) },
      select: { id: true, name: true },
    });
    if (!assignee) return failure(msg("server.reports.moderatorTapilmadi"));
    return await assign(actor, propertyId, assignee.id, assignee.name);
  } catch (error) {
    return unexpected("şikayət moderatora təyin edilmədi", error, msg("server.common.unexpected"));
  }
}

async function assign(actor: AuthUser, propertyId: string, assigneeId: string, assigneeName: string): Promise<ActionState> {
  try {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, title: true } });
    if (!property) return failure(msg("server.reports.elanTapilmadi"));
    const count = await assignActiveReports(property.id, assigneeId);
    if (count === 0) return failure(msg("server.reports.acikSikayetYoxdur"));
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — şikayətlər ${assigneeName} adlı moderatora təyin edildi`);
    afterChange();
    return success(msg("server.reports.teyinEdildi", { name: assigneeName }));
  } catch (error) {
    return unexpected("şikayət moderatora təyin edilmədi", error, msg("server.common.unexpected"));
  }
}

/** Elan sahibindən izahat istənilir — şikayətlər «Əlavə məlumat gözlənilir»-ə keçir, sahibə sual gedir. */
export async function requestListingInfo(propertyId: string, question: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const note = normalizeNote(question);
  const invalid = noteLengthError(note);
  if (invalid) return invalid;

  try {
    const property = await loadProperty(propertyId);
    if (!property) return failure(msg("server.reports.elanTapilmadi"));
    const requestedAt = new Date();
    const { count, previous } = await requestReportInfo({ propertyId: property.id, actorId: actor.id, note, now: requestedAt });
    if (count === 0) return failure(msg("server.reports.acikSikayetYoxdur"));
    const owner = property.author && property.author.accountType !== ACCOUNT_TYPES.STAFF ? property.author : null;
    if (owner) {
      const delivered = await noticeListingInfoRequested({
        userId: owner.id,
        propertyId: property.id,
        propertyTitle: property.title,
        requestedAt,
        note,
      });
      // Sual sahibə çatmadısa növbə ona cavab gözləməməlidir — keçid geri alınır, moderator təkrar cəhd edir.
      if (!delivered) {
        await revertReportInfoRequest(property.id, requestedAt, previous);
        return failure(msg("server.reports.izahatGonderilmedi"));
      }
    }
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — şikayət üzrə sahibdən izahat istənildi: ${note}`);
    afterChange();
    return success(owner ? msg("server.reports.izahatIstenildi") : msg("server.reports.izahatQeydEdildi"));
  } catch (error) {
    return unexpected("şikayət üzrə izahat istənilmədi", error, msg("server.common.unexpected"));
  }
}

/**
 * Qərar verilmiş şikayətləri yenidən nəzərdən keçirməyə qaytarır (elana görülmüş tədbir qalır).
 * `cycleId` = `reportCycleId(elan, qərar vaxtı)` — yalnız səhifədə göstərilən qərar dövrü açılır.
 */
export async function reopenListingReports(cycleId: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const cycle = parseReportCycleId(cycleId);
  if (!cycle) return failure(msg("server.reports.qerarYoxdur"));
  try {
    const property = await prisma.property.findUnique({ where: { id: cycle.propertyId }, select: { id: true, title: true } });
    if (!property) return failure(msg("server.reports.elanTapilmadi"));
    const count = await reopenDecidedReports(property.id, cycle.decidedAt, actor.id);
    if (count === 0) return failure(msg("server.reports.qerarYoxdur"));
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — ${count} şikayət yenidən nəzərdən keçirməyə qaytarıldı`);
    afterChange();
    return success(msg("server.reports.yenidenAcildi"));
  } catch (error) {
    return unexpected("şikayət yenidən açılmadı", error, msg("server.common.unexpected"));
  }
}

/** Moderatorun daxili qeydi (#197) — şikayətçiyə və elan sahibinə göstərilmir, audit jurnalına düşür. */
export async function addListingReportNote(propertyId: string, body: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const text = typeof body === "string" ? body.trim() : "";
  if (text.length < REPORT_NOTE_MIN || text.length > REPORT_NOTE_MAX) {
    return failure(msg("server.reports.qeydUzunlugu", { min: REPORT_NOTE_MIN, max: REPORT_NOTE_MAX }));
  }
  try {
    const property = await addReportNote({ propertyId: String(propertyId).slice(0, 40), authorId: actor.id, body: text });
    if (!property) return failure(msg("server.reports.elanTapilmadi"));
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — şikayət üzrə daxili qeyd əlavə edildi`);
    afterChange();
    return success(msg("server.reports.qeydElaveEdildi"));
  } catch (error) {
    return unexpected("şikayət qeydi yazılmadı", error, msg("server.common.unexpected"));
  }
}

// ─── Qərarlar ────────────────────────────────────────────────────────────────────────

/** Elanı müvəqqəti dayandırır (SUSPENDED, #202) — səbəb sahibə bildiriş və e-poçt kimi gedir. */
export async function archiveReportedListing(propertyId: string, reason: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const note = normalizeNote(reason);
  const invalid = noteLengthError(note);
  if (invalid) return invalid;

  try {
    const property = await loadProperty(propertyId);
    if (!property) return failure(msg("server.reports.elanTapilmadi"));

    const decidedAt = new Date();
    const reporters = await activeReporterIds(property.id);
    const retentionDays = await propertyRetentionDays();
    const applied = await claimThenUpdate(actor, property.id, REPORT_RESOLUTIONS.ARCHIVED, note, decidedAt, () =>
      prisma.property.update({
        where: { id: property.id },
        data: {
          status: PROPERTY_STATUSES.SUSPENDED,
          ...propertyLifecycleData(PROPERTY_STATUSES.SUSPENDED, property, retentionDays),
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
    await notifyReporters(reporters, property, REPORT_STATUSES.RESOLVED, decidedAt);
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — şikayət əsasında gizlədildi: ${note}`);
    await recordDomainEvent("property.status_changed", "Property", property.id, {
      title: property.title,
      status: PROPERTY_STATUSES.SUSPENDED,
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
    const reporters = await activeReporterIds(property.id);
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
    await notifyReporters(reporters, property, REPORT_STATUSES.RESOLVED, decidedAt);
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — şikayət əsasında ${status} kimi bağlandı`);
    await recordDomainEvent("property.status_changed", "Property", property.id, { title: property.title, status });
    queuePropertyVectorSync([property.id]);
    afterChange(property.slug);
    return success(msg("server.reports.elanBaglandi"));
  } catch (error) {
    return unexpected("şikayət edilən elan bağlanmadı", error, msg("server.common.unexpected"));
  }
}

/** Şikayət təsdiqləndi, elan düzəldildi (sahib və ya moderator) — elanın statusu dəyişmir. */
export async function resolveListingReports(propertyId: string): Promise<ActionState> {
  return decideWithoutChange(propertyId, REPORT_STATUSES.RESOLVED, REPORT_RESOLUTIONS.LISTING_FIXED);
}

/** Şikayət əsassızdır — rədd edilir, elan dəyişmir. */
export async function dismissListingReports(propertyId: string): Promise<ActionState> {
  return decideWithoutChange(propertyId, REPORT_STATUSES.DISMISSED, REPORT_RESOLUTIONS.NO_ACTION);
}

/** Şikayət aktuallığını itirib (elan artıq yoxdur, təkrar şikayət) — qərarsız bağlanır. */
export async function closeListingReports(propertyId: string): Promise<ActionState> {
  return decideWithoutChange(propertyId, REPORT_STATUSES.CLOSED, REPORT_RESOLUTIONS.NO_ACTION);
}

const DECISION_MESSAGES: Record<DecisionStatus, { audit: string; message: ServerMessageKey }> = {
  RESOLVED: { audit: "təsdiqləndi, elan düzəldilib", message: "server.reports.hellEdildi" },
  DISMISSED: { audit: "rədd edildi", message: "server.reports.esassizSayildi" },
  CLOSED: { audit: "bağlandı", message: "server.reports.baglandi" },
};

async function decideWithoutChange(
  propertyId: string,
  status: DecisionStatus,
  resolution: ReportResolution,
): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;

  try {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true, title: true, slug: true } });
    if (!property) return failure(msg("server.reports.elanTapilmadi"));
    const decidedAt = new Date();
    const reporters = await activeReporterIds(property.id);
    const count = await claimActiveReports(actor, property.id, status, resolution, null, decidedAt);
    if (count === 0) return failure(msg("server.reports.acikSikayetYoxdur"));
    await notifyReporters(reporters, property, status, decidedAt);
    await recordAudit(actor, "UPDATE", "Property", property.id, `${property.title} — ${count} şikayət ${DECISION_MESSAGES[status].audit}`);
    afterChange(property.slug);
    return success(msg(DECISION_MESSAGES[status].message));
  } catch (error) {
    return unexpected("şikayət qərarı yazılmadı", error, msg("server.common.unexpected"));
  }
}
