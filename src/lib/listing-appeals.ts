import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { propertyLifecycleData } from "@/lib/admin/property-input";
import { propertyRetentionDays } from "@/lib/property-publish-validation";
import { recordPropertyStatusChange } from "@/lib/property-status-history";
import {
  APPEALABLE_STATUSES,
  APPEAL_STATUSES,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_SOURCES,
  type AppealStatus,
} from "@/lib/constants";

/**
 * Moderasiya qərarına etiraz (#206, PRD 20.4, AC-02).
 *
 * Sahib rədd edilmiş və ya dayandırılmış elanına etiraz edir. Etirazı qərarı verən moderatordan
 * **başqa** səlahiyyətli şəxs həll edir — qərarı kimin verdiyi status tarixçəsindən (#204) götürülür.
 * Qəbulda elan qərardan əvvəlki statusa qayıdır: dayandırılmış dərc elanı yenidən dərc olunur, rədd
 * edilmiş elan moderasiya növbəsinə (`PENDING`) düşür. Rəddə status dəyişmir.
 *
 * D1-də tranzaksiya yoxdur: qərar əvvəl etirazı şərti `updateMany` ilə **götürür**, sonra elanı
 * şərti dəyişir; elan arada başqa yolla dəyişibsə etiraz yenidən açılır.
 */

/** Qəbulda bərpa oluna bilən əvvəlki statuslar; qalanlarında elan moderasiyaya gedir. */
const RESTORABLE_STATUSES: readonly string[] = [PROPERTY_STATUSES.PUBLISHED, PROPERTY_STATUSES.RESERVED];

/** Etiraz qəbul olunsa elanın keçəcəyi status — növbə səhifəsi də eyni qaydanı göstərir. */
export function appealRestoreStatus(previousStatus: string | null): string {
  return previousStatus && RESTORABLE_STATUSES.includes(previousStatus) ? previousStatus : PROPERTY_STATUSES.PENDING;
}

/** Elanın bu statusa son keçidi — kim etdi və elan əvvəl hansı statusda idi. */
async function latestDecision(propertyId: string, status: string) {
  return prisma.propertyStatusHistory.findFirst({
    where: { propertyId, toStatus: status },
    select: { fromStatus: true, changedById: true },
    orderBy: { changedAt: "desc" },
  });
}

export type AppealSubmission = "created" | "notAllowed" | "duplicate";

export async function submitListingAppeal(input: { propertyId: string; userId: string; message: string }): Promise<AppealSubmission> {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, authorId: input.userId, deletedAt: null, status: { in: [...APPEALABLE_STATUSES] } },
    select: { id: true, status: true },
  });
  if (!property) return "notAllowed";

  const open = await prisma.listingAppeal.findFirst({
    where: { propertyId: property.id, status: APPEAL_STATUSES.OPEN },
    select: { id: true },
  });
  if (open) return "duplicate";

  const decision = await latestDecision(property.id, property.status);
  await prisma.listingAppeal.create({
    data: {
      propertyId: property.id,
      authorId: input.userId,
      appealedStatus: property.status,
      previousStatus: decision?.fromStatus ?? null,
      decidedById: decision?.changedById ?? null,
      message: input.message,
    },
  });
  return "created";
}

/** Kabinet üçün: elanların açıq və son qərarlı etirazları (elan başına ən yenisi). */
export async function getOwnerAppeals(propertyIds: readonly string[]) {
  const rows = await findManyInChunks([...propertyIds], 0, (chunk) =>
    prisma.listingAppeal.findMany({
      where: { propertyId: { in: chunk } },
      select: { propertyId: true, status: true, decisionNote: true, createdAt: true, decidedAt: true },
      orderBy: { createdAt: "desc" },
    }),
  );
  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) if (!latest.has(row.propertyId)) latest.set(row.propertyId, row);
  return latest;
}

export type AppealQueueItem = Awaited<ReturnType<typeof getAppealQueue>>[number];

export async function getAppealQueue(status: AppealStatus = APPEAL_STATUSES.OPEN) {
  const appeals = await prisma.listingAppeal.findMany({
    where: { status },
    select: {
      id: true,
      propertyId: true,
      appealedStatus: true,
      previousStatus: true,
      decidedById: true,
      message: true,
      status: true,
      decisionNote: true,
      decidedAt: true,
      createdAt: true,
      author: { select: { name: true, email: true } },
      reviewer: { select: { name: true } },
      property: { select: { title: true, slug: true, status: true, moderationNote: true } },
    },
    orderBy: { createdAt: status === APPEAL_STATUSES.OPEN ? "asc" : "desc" },
    take: 200,
  });
  const deciderIds = [...new Set(appeals.flatMap((appeal) => (appeal.decidedById ? [appeal.decidedById] : [])))];
  const deciders = deciderIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: deciderIds } }, select: { id: true, name: true } })
    : [];
  return appeals.map((appeal) => ({
    ...appeal,
    decidedBy: deciders.find((user) => user.id === appeal.decidedById)?.name ?? null,
  }));
}

export async function countOpenAppeals(): Promise<number> {
  return prisma.listingAppeal.count({ where: { status: APPEAL_STATUSES.OPEN } });
}

export type AppealDecision =
  | { result: "notFound" | "sameReviewer" | "stale" }
  | { result: "decided"; accepted: boolean; restoredStatus: string | null; property: { id: string; title: string; slug: string; authorId: string | null } };

/**
 * Etirazı həll edir. `sameReviewer` — qərarı verən moderator öz qərarına baxa bilməz (PRD 20.4).
 * `stale` — elan artıq etiraz olunan statusda deyil (sahib redaktə edib, başqa moderator dəyişib).
 */
export async function decideListingAppeal(input: {
  appealId: string;
  reviewerId: string;
  accept: boolean;
  note: string | null;
  now?: Date;
}): Promise<AppealDecision> {
  const now = input.now ?? new Date();
  const appeal = await prisma.listingAppeal.findFirst({
    where: { id: input.appealId, status: APPEAL_STATUSES.OPEN },
    select: {
      id: true,
      appealedStatus: true,
      previousStatus: true,
      decidedById: true,
      property: {
        select: { id: true, title: true, slug: true, status: true, authorId: true, publishedAt: true, closedAt: true, listingExpiresAt: true, expiredAt: true, deletedAt: true },
      },
    },
  });
  if (!appeal) return { result: "notFound" };
  if (appeal.decidedById && appeal.decidedById === input.reviewerId) return { result: "sameReviewer" };
  if (appeal.property.deletedAt || appeal.property.status !== appeal.appealedStatus) return { result: "stale" };

  const finalStatus = input.accept ? APPEAL_STATUSES.ACCEPTED : APPEAL_STATUSES.REJECTED;
  const claimed = await prisma.listingAppeal.updateMany({
    where: { id: appeal.id, status: APPEAL_STATUSES.OPEN },
    data: { status: finalStatus, reviewerId: input.reviewerId, decisionNote: input.note, decidedAt: now },
  });
  if (claimed.count === 0) return { result: "notFound" };

  const property = { id: appeal.property.id, title: appeal.property.title, slug: appeal.property.slug, authorId: appeal.property.authorId };
  if (!input.accept) return { result: "decided", accepted: false, restoredStatus: null, property };

  const target = appealRestoreStatus(appeal.previousStatus);
  let updated = 0;
  try {
    const result = await prisma.property.updateMany({
      where: { id: appeal.property.id, status: appeal.appealedStatus, deletedAt: null },
      data: {
        status: target,
        moderationNote: null,
        ...propertyLifecycleData(target, appeal.property, await propertyRetentionDays()),
      },
    });
    updated = result.count;
  } finally {
    if (updated === 0) {
      // Elan arada dəyişib və ya yazılış alınmadı — etiraz yenidən açılır, başqa cəhd mümkün olsun.
      await prisma.listingAppeal.updateMany({
        where: { id: appeal.id, status: finalStatus, reviewerId: input.reviewerId, decidedAt: now },
        data: { status: APPEAL_STATUSES.OPEN, reviewerId: null, decisionNote: null, decidedAt: null },
      });
    }
  }
  if (updated === 0) return { result: "stale" };

  await recordPropertyStatusChange({
    propertyId: appeal.property.id,
    from: appeal.appealedStatus,
    to: target,
    source: PROPERTY_STATUS_SOURCES.MODERATION,
    changedById: input.reviewerId,
    note: input.note ? `Etiraz qəbul edildi: ${input.note}` : "Etiraz qəbul edildi",
  });
  return { result: "decided", accepted: true, restoredStatus: target, property };
}
