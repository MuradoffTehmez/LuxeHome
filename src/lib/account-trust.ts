import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_RESTRICTION_KINDS,
  ACCOUNT_TYPES,
  POSTING_LIMIT_PER_DAY,
  PROPERTY_STATUSES,
  REPORT_RESOLUTIONS,
  REPORT_STATUSES,
  TRUST_REASON_MAX,
  TRUST_REASON_MIN,
  type AccountRestrictionKind,
  type Locale,
} from "@/lib/constants";
import { findManyInChunks } from "@/lib/d1-chunks";
import { noticeAccountRestriction } from "@/lib/accounts/account-notices";
import {
  TRUST_THRESHOLDS,
  maxDuplicateCount,
  scoreTrust,
  type TrustFlag,
} from "@/lib/moderation/trust-signals";

/**
 * Hesab etibarlılığı və tədbirlər (#258, PRD Modul 18).
 *
 * Siqnallar bazadan toplanır (`assessAccountTrust`), bal `User.trustScore`-a yazılır və moderatora göstərilir.
 * Tədbiri həmişə insan tətbiq edir, səbəb məcburidir və tarixçə saxlanılır (sətir silinmir, `liftedAt`).
 * `BLOCK` yalnız `user:manage` icazəsi ilə (action səviyyəsində yoxlanılır). Tədbirlər:
 * - `TEMP_SUSPENSION` / `BLOCK` — ictimai yazma action-ları bağlanır (`assertAccountWritable`);
 * - `POSTING_LIMIT` — 24 saatda `POSTING_LIMIT_PER_DAY` yeni elan;
 * - `MODERATION_REVIEW` — yeni elan dərc olunmur, moderasiya növbəsinə düşür;
 * - `EXTRA_VERIFICATION` — elan yerləşdirmək üçün təsdiqlənmiş telefon tələb olunur;
 * - `WARNING` — yalnız bildiriş.
 * Etirazı tədbiri tətbiq edəndən başqa əməkdaş həll edir (PRD 20.4).
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function isRestrictionKind(value: unknown): value is AccountRestrictionKind {
  return typeof value === "string" && (ACCOUNT_RESTRICTION_KINDS as readonly string[]).includes(value);
}

/** Davranış siqnalları (PRD 20.2). Heç vaxt atmır — xəta siqnalsız nəticə verir. */
export async function assessAccountTrust(userId: string, now = new Date()): Promise<TrustFlag[] | null> {
  try {
    const [recentListings, rejections, ownListingIds, reviewsDay, suspiciousAgent, suspiciousAgency] = await Promise.all([
      prisma.property.findMany({ where: { authorId: userId, createdAt: { gte: new Date(now.getTime() - DAY) } }, select: { title: true, createdAt: true } }),
      prisma.propertyStatusHistory.count({
        where: { property: { authorId: userId }, toStatus: { in: [PROPERTY_STATUSES.REJECTED, PROPERTY_STATUSES.SUSPENDED] }, changedAt: { gte: new Date(now.getTime() - 30 * DAY) } },
      }),
      prisma.property.findMany({ where: { authorId: userId }, select: { id: true, description: true }, take: 300 }),
      Promise.all([
        prisma.agentReview.count({ where: { customerId: userId, createdAt: { gte: new Date(now.getTime() - DAY) } } }),
        prisma.agencyReview.count({ where: { customerId: userId, createdAt: { gte: new Date(now.getTime() - DAY) } } }),
      ]).then(([agent, agency]) => agent + agency),
      prisma.agentReview.count({ where: { customerId: userId, suspicionFlags: { not: null } } }),
      prisma.agencyReview.count({ where: { customerId: userId, suspicionFlags: { not: null } } }),
    ]);
    const flags: TrustFlag[] = [];

    const duplicates = maxDuplicateCount(recentListings.map((row) => row.title));
    if (duplicates >= TRUST_THRESHOLDS.duplicateTitles) flags.push({ code: "DUPLICATE_BURST", value: duplicates });

    if (rejections >= TRUST_THRESHOLDS.rejections) flags.push({ code: "REJECTION_STREAK", value: rejections });

    const hourAgo = now.getTime() - HOUR;
    const lastHour = recentListings.filter((row) => row.createdAt.getTime() >= hourAgo).length;
    if (lastHour >= TRUST_THRESHOLDS.automationListings) flags.push({ code: "AUTOMATION", value: lastHour });

    const ids = ownListingIds.map((row) => row.id);
    const confirmed = ids.length === 0 ? 0 : (await findManyInChunks(ids, 2, (chunk) =>
      prisma.listingReport.findMany({
        where: {
          propertyId: { in: chunk },
          status: REPORT_STATUSES.RESOLVED,
          resolution: { not: REPORT_RESOLUTIONS.NO_ACTION },
          resolvedAt: { gte: new Date(now.getTime() - 90 * DAY) },
        },
        select: { propertyId: true },
      }))).length;
    if (confirmed >= TRUST_THRESHOLDS.confirmedReports) flags.push({ code: "CONFIRMED_REPORTS", value: confirmed });

    // Eyni təsvirin başqa hesablardan göndərilməsi — uzun mətnlər üzrə (qısa ümumi ifadələr sayılmır).
    const texts = [...new Set(ownListingIds.map((row) => row.description.trim()).filter((text) => text.length >= 120))].slice(0, 20);
    let crossProfile = 0;
    for (const text of texts) {
      crossProfile += await prisma.property.count({ where: { description: text, deletedAt: null, authorId: { not: userId } } });
    }
    if (crossProfile >= TRUST_THRESHOLDS.crossProfile) flags.push({ code: "CROSS_PROFILE_CONTENT", value: crossProfile });

    const suspiciousReviews = suspiciousAgent + suspiciousAgency;
    if (suspiciousReviews >= TRUST_THRESHOLDS.suspiciousReviews || reviewsDay >= 5) {
      flags.push({ code: "REVIEW_BURST", value: Math.max(suspiciousReviews, reviewsDay) });
    }
    return flags;
  } catch (error) {
    console.error("[trust] siqnallar hesablanmadı:", error instanceof Error ? error.message : error);
    // `null` — nəticə bilinmir; çağıran köhnə balı saxlayır (keçici xəta riskli hesabı «təmiz» göstərməsin).
    return null;
  }
}

export async function refreshAccountTrust(userId: string, now = new Date()) {
  const flags = await assessAccountTrust(userId, now);
  if (flags === null) return null;
  const score = scoreTrust(flags);
  await prisma.user.update({ where: { id: userId }, data: { trustScore: score, trustFlags: flags.length ? JSON.stringify(flags) : null, trustCheckedAt: now } }).catch(() => undefined);
  return { score, flags };
}

/** Gündəlik baxım: son 7 gündə elan yaradan və ya rəy yazan ictimai hesabların balını yeniləyir (ən çox 200). */
export async function refreshActiveAccountsTrust(now = new Date()): Promise<number> {
  const since = new Date(now.getTime() - 7 * DAY);
  const [authors, reviewers] = await Promise.all([
    prisma.property.findMany({ where: { createdAt: { gte: since }, authorId: { not: null } }, select: { authorId: true }, distinct: ["authorId"], take: 200 }),
    prisma.agentReview.findMany({ where: { createdAt: { gte: since }, customerId: { not: null } }, select: { customerId: true }, distinct: ["customerId"], take: 100 }),
    prisma.agencyReview.findMany({ where: { createdAt: { gte: since }, customerId: { not: null } }, select: { customerId: true }, distinct: ["customerId"], take: 100 }),
  ]).then(([a, b, c]) => [a, [...b, ...c]] as const);
  const ids = [...new Set([...authors.map((row) => row.authorId!), ...reviewers.map((row) => row.customerId!)])].slice(0, 200);
  for (const id of ids) await refreshAccountTrust(id, now);
  return ids.length;
}

/** Aktiv tədbirlər (götürülməmiş, müddəti bitməmiş). */
export async function activeRestrictions(userId: string, now = new Date()) {
  return prisma.accountRestriction.findMany({
    where: { userId, liftedAt: null, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, reason: true, endsAt: true, createdAt: true },
  });
}

const BLOCKED_MESSAGE: Record<Locale, string> = {
  az: "Hesabınıza məhdudiyyət tətbiq olunub. Ətraflı məlumat və etiraz üçün kabinetdə «Məhdudiyyətlər» bölməsinə baxın.",
  en: "A restriction has been applied to your account. See “Restrictions” in your account to learn more or appeal.",
  ru: "К вашему аккаунту применено ограничение. Подробности и обжалование — в разделе «Ограничения» кабинета.",
};

/** Yazma qapısı: müvəqqəti məhdudiyyət və ya blok varsa mesaj qaytarır (`null` — icazə var). */
export async function accountWriteBlock(userId: string, locale: Locale, now = new Date()): Promise<string | null> {
  // Oxuma xətası yazmanı bağlayır (fail-closed) — keçici D1 xətası bloku yan keçməsin.
  const active = await activeRestrictions(userId, now);
  return active.some((row) => row.kind === "TEMP_SUSPENSION" || row.kind === "BLOCK") ? BLOCKED_MESSAGE[locale] : null;
}

export type PostingGate = { ok: true; review: boolean } | { ok: false; reason: "limit" | "verification" | "blocked" };

/** Yeni elan qapısı (PRD 20.3): paylaşım limiti, əlavə təsdiq və moderator yoxlaması. */
export async function postingGate(userId: string, now = new Date()): Promise<PostingGate> {
  const active = await activeRestrictions(userId, now);
  const kinds = new Set(active.map((row) => row.kind));
  if (kinds.has("TEMP_SUSPENSION") || kinds.has("BLOCK")) return { ok: false, reason: "blocked" };
  if (kinds.has("EXTRA_VERIFICATION")) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { verifiedPhone: true } });
    if (!user?.verifiedPhone) return { ok: false, reason: "verification" };
  }
  if (kinds.has("POSTING_LIMIT")) {
    const created = await prisma.property.count({ where: { authorId: userId, createdAt: { gte: new Date(now.getTime() - DAY) } } });
    if (created >= POSTING_LIMIT_PER_DAY) return { ok: false, reason: "limit" };
  }
  return { ok: true, review: kinds.has("MODERATION_REVIEW") };
}

export type RestrictionResult = { ok: true; id: string } | { ok: false; reason: "user" | "kind" | "reason" | "dates" };

export async function applyRestriction(input: {
  staffId: string;
  userId: string;
  kind: string;
  reason: string;
  endsAt?: Date | null;
  now?: Date;
}): Promise<RestrictionResult> {
  const now = input.now ?? new Date();
  if (!isRestrictionKind(input.kind)) return { ok: false, reason: "kind" };
  const reason = input.reason.trim().replace(/\s+/g, " ").slice(0, TRUST_REASON_MAX);
  if (reason.length < TRUST_REASON_MIN) return { ok: false, reason: "reason" };
  if (input.endsAt && input.endsAt <= now) return { ok: false, reason: "dates" };
  const user = await prisma.user.findFirst({
    where: { id: input.userId, accountType: { not: ACCOUNT_TYPES.STAFF } },
    select: { id: true, trustFlags: true },
  });
  if (!user) return { ok: false, reason: "user" };
  const created = await prisma.accountRestriction.create({
    data: { userId: user.id, kind: input.kind, reason, evidence: user.trustFlags, endsAt: input.endsAt ?? null, createdById: input.staffId, startsAt: now },
    select: { id: true },
  });
  await noticeAccountRestriction({ userId: user.id, restrictionId: created.id, kind: input.kind, reason, lifted: false });
  return { ok: true, id: created.id };
}

export async function liftRestriction(input: { staffId: string; restrictionId: string; reason: string; canLiftBlock?: boolean; now?: Date }): Promise<{ ok: boolean; reason?: "reason" | "notFound" | "blockPermission" }> {
  const reason = input.reason.trim().slice(0, TRUST_REASON_MAX);
  if (reason.length < 5) return { ok: false, reason: "reason" };
  const row = await prisma.accountRestriction.findUnique({ where: { id: input.restrictionId }, select: { id: true, userId: true, kind: true } });
  if (!row) return { ok: false, reason: "notFound" };
  // Bloku yalnız onu qoya bilən (`user:manage`) götürür.
  if (row.kind === "BLOCK" && !input.canLiftBlock) return { ok: false, reason: "blockPermission" };
  const { count } = await prisma.accountRestriction.updateMany({
    where: { id: row.id, liftedAt: null },
    data: { liftedAt: input.now ?? new Date(), liftedById: input.staffId, liftReason: reason },
  });
  if (count === 0) return { ok: false, reason: "notFound" };
  await noticeAccountRestriction({ userId: row.userId, restrictionId: row.id, kind: row.kind, reason, lifted: true });
  return { ok: true };
}

export type AppealResult = { ok: true } | { ok: false; reason: "notFound" | "message" | "open" };

/** İstifadəçinin etirazı — tədbir başına bir açıq etiraz. */
export async function appealRestriction(input: { userId: string; restrictionId: string; message: string }): Promise<AppealResult> {
  const message = input.message.trim().slice(0, TRUST_REASON_MAX);
  if (message.length < TRUST_REASON_MIN) return { ok: false, reason: "message" };
  const restriction = await prisma.accountRestriction.findFirst({ where: { id: input.restrictionId, userId: input.userId, liftedAt: null }, select: { id: true } });
  if (!restriction) return { ok: false, reason: "notFound" };
  const open = await prisma.accountRestrictionAppeal.count({ where: { restrictionId: restriction.id, status: "OPEN" } });
  if (open > 0) return { ok: false, reason: "open" };
  await prisma.accountRestrictionAppeal.create({ data: { restrictionId: restriction.id, userId: input.userId, message } });
  return { ok: true };
}

export type AppealDecision = { ok: true } | { ok: false; reason: "notFound" | "sameReviewer" | "note" | "blockPermission" };

/** Etirazın həlli (PRD 20.4): tədbiri tətbiq edən əməkdaş öz qərarına baxa bilməz. Qəbul tədbiri götürür. */
export async function decideAppeal(input: { staffId: string; appealId: string; accept: boolean; note: string; canLiftBlock?: boolean; now?: Date }): Promise<AppealDecision> {
  const now = input.now ?? new Date();
  const note = input.note.trim().slice(0, TRUST_REASON_MAX);
  if (note.length < 5) return { ok: false, reason: "note" };
  const appeal = await prisma.accountRestrictionAppeal.findUnique({ where: { id: input.appealId }, select: { id: true, restrictionId: true, status: true } });
  if (!appeal || appeal.status !== "OPEN") return { ok: false, reason: "notFound" };
  const restriction = await prisma.accountRestriction.findUnique({ where: { id: appeal.restrictionId }, select: { createdById: true, kind: true } });
  if (restriction?.createdById === input.staffId) return { ok: false, reason: "sameReviewer" };
  if (input.accept && restriction?.kind === "BLOCK" && !input.canLiftBlock) return { ok: false, reason: "blockPermission" };
  // Qəbulda əvvəl tədbir götürülür: o alınmasa etiraz açıq qalır və yenidən cəhd mümkündür.
  if (input.accept) {
    const lifted = await liftRestriction({ staffId: input.staffId, restrictionId: appeal.restrictionId, reason: note, now, canLiftBlock: input.canLiftBlock });
    if (!lifted.ok && lifted.reason !== "notFound") return { ok: false, reason: "note" };
  }
  const { count } = await prisma.accountRestrictionAppeal.updateMany({
    where: { id: appeal.id, status: "OPEN" },
    data: { status: input.accept ? "ACCEPTED" : "REJECTED", decidedById: input.staffId, decidedAt: now, decisionNote: note },
  });
  if (count === 0) return { ok: false, reason: "notFound" };
  return { ok: true };
}
