import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { propertyLifecycleData } from "@/lib/admin/property-input";
import { propertyRetentionDays } from "@/lib/property-publish-validation";
import { recordPropertyStatusChange } from "@/lib/property-status-history";
import { getListingExpiryConfig } from "@/lib/settings";
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
 * **Etiraz konkret qərara bağlıdır** (`decisionHistoryId` — həmin keçidin tarixçə qeydi). Sahib elanı
 * redaktə edib yenidən rədd olunubsa, köhnə etiraz yeni qərara aid deyil: o, baxılmadan `CLOSED` olur.
 * Əks halda yeni qərarı verən moderator köhnə etiraz üzərindən öz qərarına baxa bilərdi.
 *
 * D1-də tranzaksiya yoxdur: «bir açıq etiraz» yazılışdan sonra yoxlanılır (ən köhnə qalır), qərar
 * əvvəl etirazı şərti `updateMany` ilə **götürür**, sonra elanı şərti dəyişir.
 */

/** Qəbulda bərpa oluna bilən əvvəlki statuslar; qalanlarında elan moderasiyaya gedir. */
const RESTORABLE_STATUSES: readonly string[] = [PROPERTY_STATUSES.PUBLISHED, PROPERTY_STATUSES.RESERVED];

/** Etiraz qəbul olunsa elanın keçəcəyi status — növbə səhifəsi də eyni qaydanı göstərir. */
export function appealRestoreStatus(previousStatus: string | null): string {
  return previousStatus && RESTORABLE_STATUSES.includes(previousStatus) ? previousStatus : PROPERTY_STATUSES.PENDING;
}

/** Elanın bu statusa son keçidi — qeyd, kim etdi və elan əvvəl hansı statusda idi. */
async function latestDecision(propertyId: string, status: string) {
  return prisma.propertyStatusHistory.findFirst({
    where: { propertyId, toStatus: status },
    select: { id: true, fromStatus: true, changedById: true },
    orderBy: { changedAt: "desc" },
  });
}

/** Etiraz hələ də qüvvədə olan qərara aiddirmi: elan həmin statusdadır və son qərar həmin qeyddir. */
function sameDecision(
  appeal: { appealedStatus: string; decisionHistoryId: string | null },
  property: { status: string; deletedAt: Date | null },
  latest: { id: string } | null,
): boolean {
  if (property.deletedAt || property.status !== appeal.appealedStatus) return false;
  return (latest?.id ?? null) === appeal.decisionHistoryId;
}

async function closeAppeal(id: string): Promise<void> {
  await prisma.listingAppeal.updateMany({
    where: { id, status: APPEAL_STATUSES.OPEN },
    data: { status: APPEAL_STATUSES.CLOSED, decidedAt: new Date() },
  });
}

export type AppealSubmission = "created" | "notAllowed" | "duplicate";

export async function submitListingAppeal(input: { propertyId: string; userId: string; message: string }): Promise<AppealSubmission> {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, authorId: input.userId, deletedAt: null, status: { in: [...APPEALABLE_STATUSES] } },
    select: { id: true, status: true, deletedAt: true },
  });
  if (!property) return "notAllowed";
  const decision = await latestDecision(property.id, property.status);

  // Köhnə qərar dövrünün açıq etirazı yenisinə mane olmamalıdır — baxılmadan bağlanır.
  const open = await prisma.listingAppeal.findMany({
    where: { propertyId: property.id, status: APPEAL_STATUSES.OPEN },
    select: { id: true, appealedStatus: true, decisionHistoryId: true },
  });
  for (const appeal of open) {
    if (!sameDecision(appeal, property, decision)) await closeAppeal(appeal.id);
  }
  if (open.some((appeal) => sameDecision(appeal, property, decision))) return "duplicate";

  const created = await prisma.listingAppeal.create({
    data: {
      propertyId: property.id,
      authorId: input.userId,
      appealedStatus: property.status,
      previousStatus: decision?.fromStatus ?? null,
      decidedById: decision?.changedById ?? null,
      decisionHistoryId: decision?.id ?? null,
      message: input.message,
    },
    select: { id: true },
  });

  // Eyni anda gələn ikinci göndəriş də yoxlamadan keçə bilər. Yazılışdan sonra açıq etirazlar
  // sabit sıra ilə müqayisə olunur: ən köhnəsi qalır, qalanları özünü silir — hər iki sorğu eyni
  // qalibi seçdiyi üçün heç vaxt sıfır etiraz qalmır.
  const contenders = await prisma.listingAppeal.findMany({
    where: { propertyId: property.id, status: APPEAL_STATUSES.OPEN },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  if (contenders.length > 1 && contenders[0].id !== created.id) {
    await prisma.listingAppeal.deleteMany({ where: { id: created.id, status: APPEAL_STATUSES.OPEN } });
    return "duplicate";
  }
  return "created";
}

/** Kabinet üçün: elanların son etirazı (elan başına ən yenisi). */
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

/**
 * Admin növbəsi. Əlaqələr iç-içə yüklənmir: 98-dən çox valideyndə Prisma-nın əlaqə sorğusu D1-in
 * 100 parametr həddini aşır (#74, #85). Etirazlar düz oxunur, elan və istifadəçilər hissə-hissə.
 */
export async function getAppealQueue(status: AppealStatus = APPEAL_STATUSES.OPEN) {
  const appeals = await prisma.listingAppeal.findMany({
    where: { status },
    select: {
      id: true,
      propertyId: true,
      authorId: true,
      reviewerId: true,
      appealedStatus: true,
      previousStatus: true,
      decidedById: true,
      message: true,
      status: true,
      decisionNote: true,
      decidedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: status === APPEAL_STATUSES.OPEN ? "asc" : "desc" },
    take: 200,
  });
  const [properties, users] = await Promise.all([
    findManyInChunks([...new Set(appeals.map((appeal) => appeal.propertyId))], 0, (chunk) =>
      prisma.property.findMany({
        where: { id: { in: chunk } },
        select: { id: true, title: true, slug: true, status: true, moderationNote: true },
      }),
    ),
    findManyInChunks(
      [...new Set(appeals.flatMap((appeal) => [appeal.authorId, appeal.reviewerId, appeal.decidedById]).filter((id): id is string => Boolean(id)))],
      0,
      (chunk) => prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true, email: true } }),
    ),
  ]);
  const userById = new Map(users.map((user) => [user.id, user]));
  const propertyById = new Map(properties.map((property) => [property.id, property]));

  return appeals.flatMap((appeal) => {
    const property = propertyById.get(appeal.propertyId);
    if (!property) return [];
    const author = appeal.authorId ? userById.get(appeal.authorId) : undefined;
    return [{
      ...appeal,
      property,
      author: author ? { name: author.name, email: author.email } : null,
      reviewer: appeal.reviewerId ? { name: userById.get(appeal.reviewerId)?.name ?? null } : null,
      decidedBy: appeal.decidedById ? userById.get(appeal.decidedById)?.name ?? null : null,
    }];
  });
}

export async function countOpenAppeals(): Promise<number> {
  return prisma.listingAppeal.count({ where: { status: APPEAL_STATUSES.OPEN } });
}

export type AppealDecision =
  | { result: "notFound" | "sameReviewer" | "stale" }
  | { result: "decided"; accepted: boolean; restoredStatus: string | null; property: { id: string; title: string; slug: string; authorId: string | null } };

/**
 * Etirazı həll edir. `sameReviewer` — qərarı verən moderator öz qərarına baxa bilməz (PRD 20.4).
 * `stale` — etiraz olunan qərar artıq qüvvədə deyil (sahib redaktə edib, yeni qərar verilib):
 * etiraz `CLOSED` olur, sahib yeni qərara ayrıca etiraz edə bilər.
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
      decisionHistoryId: true,
      property: {
        select: { id: true, title: true, slug: true, status: true, authorId: true, publishedAt: true, closedAt: true, listingExpiresAt: true, expiredAt: true, deletedAt: true },
      },
    },
  });
  if (!appeal) return { result: "notFound" };
  const latest = await latestDecision(appeal.property.id, appeal.appealedStatus);
  if (!sameDecision(appeal, appeal.property, latest)) {
    await closeAppeal(appeal.id);
    return { result: "stale" };
  }
  if (appeal.decidedById && appeal.decidedById === input.reviewerId) return { result: "sameReviewer" };

  const finalStatus = input.accept ? APPEAL_STATUSES.ACCEPTED : APPEAL_STATUSES.REJECTED;
  const claimed = await prisma.listingAppeal.updateMany({
    where: { id: appeal.id, status: APPEAL_STATUSES.OPEN },
    data: { status: finalStatus, reviewerId: input.reviewerId, decisionNote: input.note, decidedAt: now },
  });
  if (claimed.count === 0) return { result: "notFound" };

  const property = { id: appeal.property.id, title: appeal.property.title, slug: appeal.property.slug, authorId: appeal.property.authorId };
  if (!input.accept) return { result: "decided", accepted: false, restoredStatus: null, property };

  const target = appealRestoreStatus(appeal.previousStatus);
  const [retentionDays, expiry] = await Promise.all([propertyRetentionDays(), getListingExpiryConfig()]);
  let updated: number;
  try {
    const result = await prisma.property.updateMany({
      where: { id: appeal.property.id, status: appeal.appealedStatus, deletedAt: null },
      data: {
        status: target,
        moderationNote: null,
        // Panelin elan ömrü (#204): uzun dayandırılmış elanın köhnəlmiş müddəti düzgün uzansın.
        ...propertyLifecycleData(target, appeal.property, retentionDays, expiry.lifetimeDays),
      },
    });
    updated = result.count;
  } catch (error) {
    // Keçici xəta: etiraz yenidən açılır, moderator təkrar cəhd edə bilsin.
    await prisma.listingAppeal.updateMany({
      where: { id: appeal.id, status: finalStatus, reviewerId: input.reviewerId, decidedAt: now },
      data: { status: APPEAL_STATUSES.OPEN, reviewerId: null, decisionNote: null, decidedAt: null },
    });
    throw error;
  }
  if (updated === 0) {
    // Elan yoxlamadan sonra başqa yolla dəyişib — qərar dövrü bitib, etiraz bağlanır.
    await prisma.listingAppeal.updateMany({
      where: { id: appeal.id, status: finalStatus, reviewerId: input.reviewerId, decidedAt: now },
      data: { status: APPEAL_STATUSES.CLOSED, reviewerId: null, decisionNote: null },
    });
    return { result: "stale" };
  }

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
