import { prisma } from "@/lib/prisma";
import {
  PROMOTION_COOLDOWN_DAYS,
  PROMOTION_DURATIONS_DAYS,
  PROMOTION_SOURCES,
  PROMOTION_STATUSES,
  PROPERTY_STATUSES,
  VIP_DECISION_NOTE_MAX,
} from "@/lib/constants";
import { findManyInChunks } from "@/lib/d1-chunks";
import { getFeatureFlags } from "@/lib/feature-flags";
import { bakuDay } from "@/lib/listing-stats";
import { noticePromotionDecision } from "@/lib/accounts/account-notices";

/**
 * Elanı irəli çəkmə (#250, PRD Modul 13). Tanıtım mərhələsində ödənişsizdir, kart məlumatı istənmir və
 * administrator idarə edir: sahib sorğu göndərir, admin təsdiqləyir/rədd edir/dayandırır və ya sorğusuz başladır.
 * `PROMOTION_SELF_SERVICE_ENABLED` açıqdırsa sorğu dərhal başlayır.
 *
 * Aktiv kampaniya elanın `promotedUntil` sahəsinə yazılır — defolt siyahı sıralaması (aktuallıq) onu birinci
 * nəzərə alır və kartda «İrəli çəkilib» nişanı göstərilir (ziyarətçi çaşmasın). Təkrar qaydası: elan başına bir
 * açıq sorğu və ya aktiv kampaniya; bitəndən sonra `PROMOTION_COOLDOWN_DAYS` gün fasilə. Bitmiş kampaniyanı
 * 10 dəqiqəlik cron təmizləyir (`expirePromotions`).
 */

const DAY = 86_400_000;

export function isPromotionDuration(value: unknown): value is (typeof PROMOTION_DURATIONS_DAYS)[number] {
  return typeof value === "number" && (PROMOTION_DURATIONS_DAYS as readonly number[]).includes(value);
}

function cleanNote(value: string | null | undefined): string | null {
  const text = (value ?? "").trim().replace(/\s+/g, " ").slice(0, VIP_DECISION_NOTE_MAX);
  return text || null;
}

export type PromotionRequestResult =
  | { ok: true; campaignId: string; started: boolean }
  | { ok: false; reason: "disabled" | "duration" | "listing" | "active" | "pending" | "cooldown"; availableAt?: Date };

/** Təkrar irəli çəkmə qaydası: aktiv/gözləyən varsa və ya son kampaniya fasilədən təzədirsə — rədd. */
async function repeatBlock(propertyId: string, now: Date): Promise<PromotionRequestResult | null> {
  const rows = await prisma.promotionCampaign.findMany({
    where: { propertyId, status: { in: [PROMOTION_STATUSES.PENDING, PROMOTION_STATUSES.ACTIVE, PROMOTION_STATUSES.EXPIRED, PROMOTION_STATUSES.REVOKED] } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { status: true, endsAt: true },
  });
  if (rows.some((row) => row.status === PROMOTION_STATUSES.PENDING)) return { ok: false, reason: "pending" };
  if (rows.some((row) => row.status === PROMOTION_STATUSES.ACTIVE && row.endsAt && row.endsAt > now)) return { ok: false, reason: "active" };
  const lastEnd = rows.map((row) => row.endsAt?.getTime() ?? 0).reduce((max, value) => Math.max(max, value), 0);
  if (lastEnd && now.getTime() < lastEnd + PROMOTION_COOLDOWN_DAYS * DAY) {
    return { ok: false, reason: "cooldown", availableAt: new Date(lastEnd + PROMOTION_COOLDOWN_DAYS * DAY) };
  }
  return null;
}

export async function requestPromotion(input: { userId: string; propertyId: string; days: number; message?: string | null; now?: Date }): Promise<PromotionRequestResult> {
  const now = input.now ?? new Date();
  const flags = await getFeatureFlags();
  if (!flags.PROMOTION) return { ok: false, reason: "disabled" };
  if (!isPromotionDuration(input.days)) return { ok: false, reason: "duration" };
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, authorId: input.userId, deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED },
    select: { id: true },
  });
  if (!property) return { ok: false, reason: "listing" };
  const blocked = await repeatBlock(property.id, now);
  if (blocked) return blocked;

  const selfService = flags.PROMOTION_SELF_SERVICE_ENABLED;
  const created = await prisma.promotionCampaign.create({
    data: {
      propertyId: property.id,
      requesterId: input.userId,
      source: selfService ? PROMOTION_SOURCES.SELF_SERVICE : PROMOTION_SOURCES.OWNER,
      days: input.days,
      message: cleanNote(input.message),
    },
    select: { id: true },
  });
  // Elan başına bir açıq sorğu — yazılışdan sonra yoxlanılır, eyni anda gələn ikincisi ləğv olunur.
  const open = await prisma.promotionCampaign.findMany({
    where: { propertyId: property.id, status: PROMOTION_STATUSES.PENDING },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (open[0]?.id !== created.id) {
    await prisma.promotionCampaign.updateMany({ where: { id: created.id, status: PROMOTION_STATUSES.PENDING }, data: { status: PROMOTION_STATUSES.CANCELLED } });
    return { ok: false, reason: "pending" };
  }
  if (selfService) {
    const started = await approvePromotion({ actorId: null, campaignId: created.id, days: input.days, note: null, now });
    return { ok: true, campaignId: created.id, started: started.ok };
  }
  return { ok: true, campaignId: created.id, started: false };
}

export type PromotionDecisionResult = { ok: true; title: string } | { ok: false; reason: "notFound" | "duration" | "note" | "listing" | "disabled" };

/** Təsdiq: kampaniya dərhal başlayır, elan `promotedUntil` alır. `actorId: null` — özünəxidmət. */
export async function approvePromotion(input: { actorId: string | null; campaignId: string; days: number; note: string | null; now?: Date }): Promise<PromotionDecisionResult> {
  const now = input.now ?? new Date();
  if (!isPromotionDuration(input.days)) return { ok: false, reason: "duration" };
  // Modul söndürülübsə (#242) heç bir aktivləşdirmə yolu kampaniya başlatmır — admin də daxil.
  if (!(await getFeatureFlags()).PROMOTION) return { ok: false, reason: "disabled" };
  const campaign = await prisma.promotionCampaign.findUnique({ where: { id: input.campaignId }, select: { id: true, propertyId: true, requesterId: true, status: true } });
  if (!campaign || campaign.status !== PROMOTION_STATUSES.PENDING) return { ok: false, reason: "notFound" };
  const property = await prisma.property.findFirst({
    where: { id: campaign.propertyId, deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED },
    select: { id: true, title: true, authorId: true },
  });
  if (!property) return { ok: false, reason: "listing" };
  const endsAt = new Date(now.getTime() + input.days * DAY);
  const note = cleanNote(input.note);
  const claimed = await prisma.promotionCampaign.updateMany({
    where: { id: campaign.id, status: PROMOTION_STATUSES.PENDING },
    data: { status: PROMOTION_STATUSES.ACTIVE, decidedById: input.actorId, decidedAt: now, decisionNote: note, startsAt: now, endsAt, days: input.days },
  });
  if (claimed.count === 0) return { ok: false, reason: "notFound" };
  try {
    await prisma.property.update({ where: { id: property.id }, data: { promotedUntil: endsAt } });
  } catch {
    await prisma.promotionCampaign.updateMany({
      where: { id: campaign.id, status: PROMOTION_STATUSES.ACTIVE },
      data: { status: PROMOTION_STATUSES.PENDING, decidedById: null, decidedAt: null, decisionNote: null, startsAt: null, endsAt: null },
    });
    return { ok: false, reason: "listing" };
  }
  const recipient = campaign.requesterId ?? property.authorId;
  if (recipient && input.actorId) {
    await noticePromotionDecision({ userId: recipient, campaignId: campaign.id, title: property.title, approved: true, days: input.days, note });
  }
  return { ok: true, title: property.title };
}

export async function rejectPromotion(input: { actorId: string; campaignId: string; note: string; now?: Date }): Promise<PromotionDecisionResult> {
  const now = input.now ?? new Date();
  const note = cleanNote(input.note);
  if (!note || note.length < 5) return { ok: false, reason: "note" };
  const campaign = await prisma.promotionCampaign.findUnique({ where: { id: input.campaignId }, select: { id: true, propertyId: true, requesterId: true, days: true } });
  if (!campaign) return { ok: false, reason: "notFound" };
  const claimed = await prisma.promotionCampaign.updateMany({
    where: { id: campaign.id, status: PROMOTION_STATUSES.PENDING },
    data: { status: PROMOTION_STATUSES.REJECTED, decidedById: input.actorId, decidedAt: now, decisionNote: note },
  });
  if (claimed.count === 0) return { ok: false, reason: "notFound" };
  const property = await prisma.property.findUnique({ where: { id: campaign.propertyId }, select: { title: true } });
  if (campaign.requesterId) {
    await noticePromotionDecision({ userId: campaign.requesterId, campaignId: campaign.id, title: property?.title ?? "—", approved: false, days: campaign.days, note });
  }
  return { ok: true, title: property?.title ?? "—" };
}

/** Admin sorğusuz başladır — təkrar qaydası admin üçün də keçərlidir (aktiv kampaniya ikiqat olmasın). */
export async function grantPromotion(input: { actorId: string; propertyId: string; days: number; note: string | null; now?: Date }): Promise<PromotionDecisionResult & { campaignId?: string; blocked?: "active" | "pending" | "cooldown" }> {
  const now = input.now ?? new Date();
  if (!isPromotionDuration(input.days)) return { ok: false, reason: "duration" };
  if (!(await getFeatureFlags()).PROMOTION) return { ok: false, reason: "disabled" };
  // Təkrar qaydası birbaşa verilməyə də aiddir: gözləyən sorğu, aktiv kampaniya və fasilə.
  const blocked = await repeatBlock(input.propertyId, now);
  if (blocked && !blocked.ok) {
    const reason = blocked.reason === "active" || blocked.reason === "pending" || blocked.reason === "cooldown" ? blocked.reason : "active";
    return { ok: false, reason: "notFound", blocked: reason };
  }
  const created = await prisma.promotionCampaign.create({
    data: { propertyId: input.propertyId, source: PROMOTION_SOURCES.ADMIN, days: input.days },
    select: { id: true },
  });
  const result = await approvePromotion({ actorId: input.actorId, campaignId: created.id, days: input.days, note: input.note, now });
  if (!result.ok) await prisma.promotionCampaign.updateMany({ where: { id: created.id, status: PROMOTION_STATUSES.PENDING }, data: { status: PROMOTION_STATUSES.CANCELLED } });
  return { ...result, campaignId: created.id };
}

/** Aktiv kampaniyanı dayandırır — səbəb məcburidir, elanın üstünlüyü dərhal götürülür. */
export async function revokePromotion(input: { actorId: string; campaignId: string; note: string; now?: Date }): Promise<PromotionDecisionResult> {
  const now = input.now ?? new Date();
  const note = cleanNote(input.note);
  if (!note || note.length < 5) return { ok: false, reason: "note" };
  const campaign = await prisma.promotionCampaign.findUnique({
    where: { id: input.campaignId },
    select: { id: true, propertyId: true, endsAt: true, decisionNote: true, decidedById: true },
  });
  if (!campaign) return { ok: false, reason: "notFound" };
  const claimed = await prisma.promotionCampaign.updateMany({
    where: { id: campaign.id, status: PROMOTION_STATUSES.ACTIVE },
    data: { status: PROMOTION_STATUSES.REVOKED, decisionNote: note, decidedById: input.actorId, endsAt: now },
  });
  if (claimed.count === 0) return { ok: false, reason: "notFound" };
  try {
    await prisma.property.update({ where: { id: campaign.propertyId }, data: { promotedUntil: null } });
  } catch (error) {
    // D1-də tranzaksiya yoxdur: elan yazılmasa kampaniya `ACTIVE`-ə qayıdır ki, dayandırma yenidən sınanıla bilsin
    // (əks halda `REVOKED` kampaniya ilə elan ilkin bitmə tarixinə qədər irəlidə qalardı).
    await prisma.promotionCampaign.updateMany({
      where: { id: campaign.id, status: PROMOTION_STATUSES.REVOKED, decidedById: input.actorId, endsAt: now },
      data: { status: PROMOTION_STATUSES.ACTIVE, endsAt: campaign.endsAt, decisionNote: campaign.decisionNote, decidedById: campaign.decidedById },
    }).catch(() => undefined);
    throw error;
  }
  const property = await prisma.property.findUnique({ where: { id: campaign.propertyId }, select: { title: true } });
  return { ok: true, title: property?.title ?? "—" };
}

/** Cron (10 dəq): bitmiş kampaniyalar `EXPIRED`, elanların `promotedUntil`-i təmizlənir. İdempotentdir. */
export async function expirePromotions(now = new Date()): Promise<{ campaigns: number; listings: number }> {
  const [campaigns, listings] = await Promise.all([
    prisma.promotionCampaign.updateMany({ where: { status: PROMOTION_STATUSES.ACTIVE, endsAt: { lte: now } }, data: { status: PROMOTION_STATUSES.EXPIRED } }),
    prisma.property.updateMany({ where: { promotedUntil: { lte: now } }, data: { promotedUntil: null } }),
  ]);
  return { campaigns: campaigns.count, listings: listings.count };
}

/** Kabinet: hər elanın son kampaniyası və növbəti icazəli tarix. */
export async function getOwnerPromotionState(propertyIds: string[], now = new Date()) {
  const rows = await findManyInChunks(propertyIds, 0, (chunk) =>
    prisma.promotionCampaign.findMany({
      where: { propertyId: { in: chunk } },
      select: { propertyId: true, status: true, endsAt: true, decisionNote: true, createdAt: true },
    }));
  const state = new Map<string, { status: string; endsAt: Date | null; note: string | null; availableAt: Date | null }>();
  for (const row of rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
    if (state.has(row.propertyId)) continue;
    const ended = row.endsAt && row.endsAt <= now;
    const status = row.status === PROMOTION_STATUSES.ACTIVE && ended ? PROMOTION_STATUSES.EXPIRED : row.status;
    const cooldownEnd = row.endsAt ? new Date(row.endsAt.getTime() + PROMOTION_COOLDOWN_DAYS * DAY) : null;
    state.set(row.propertyId, {
      status,
      endsAt: row.endsAt,
      note: row.decisionNote,
      availableAt: (status === PROMOTION_STATUSES.EXPIRED || status === PROMOTION_STATUSES.REVOKED) && cooldownEnd && cooldownEnd > now ? cooldownEnd : null,
    });
  }
  return state;
}

/** Admin paneli: gözləyən, aktiv və tarixçə + kampaniya statistikası (dövr günləri üzrə toplu oxu). */
export async function getPromotionDashboard(now = new Date()) {
  const [pending, active, past] = await Promise.all([
    prisma.promotionCampaign.findMany({ where: { status: PROMOTION_STATUSES.PENDING }, orderBy: { createdAt: "asc" }, take: 100 }),
    prisma.promotionCampaign.findMany({ where: { status: PROMOTION_STATUSES.ACTIVE, endsAt: { gt: now } }, orderBy: { endsAt: "asc" }, take: 200 }),
    prisma.promotionCampaign.findMany({
      where: {
        OR: [
          { status: { in: [PROMOTION_STATUSES.EXPIRED, PROMOTION_STATUSES.REVOKED, PROMOTION_STATUSES.REJECTED] } },
          { status: PROMOTION_STATUSES.ACTIVE, endsAt: { lte: now } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);
  const all = [...pending, ...active, ...past];
  const propertyIds = [...new Set(all.map((row) => row.propertyId))];
  const userIds = [...new Set(all.flatMap((row) => [row.requesterId, row.decidedById]).filter((id): id is string => Boolean(id)))];
  const [properties, users] = await Promise.all([
    findManyInChunks(propertyIds, 0, (chunk) => prisma.property.findMany({ where: { id: { in: chunk } }, select: { id: true, title: true, slug: true } })),
    findManyInChunks(userIds, 0, (chunk) => prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true, email: true } })),
  ]);
  const propertyOf = new Map(properties.map((row) => [row.id, row]));
  const userOf = new Map(users.map((row) => [row.id, row]));

  const periods = [...active, ...past].filter((row) => row.startsAt && row.endsAt);
  const stats = new Map<string, { views: number; uniqueViews: number; contactReveals: number; leads: number }>();
  if (periods.length > 0) {
    const ids = [...new Set(periods.map((row) => row.propertyId))];
    const from = new Date(Math.min(...periods.map((row) => row.startsAt!.getTime())));
    const [daily, leads] = await Promise.all([
      findManyInChunks(ids, 1, (chunk) =>
        prisma.propertyDailyStat.findMany({
          where: { propertyId: { in: chunk }, day: { gte: bakuDay(from) } },
          select: { propertyId: true, day: true, views: true, uniqueViews: true, contactReveals: true },
        })),
      findManyInChunks(ids, 1, (chunk) => prisma.lead.findMany({ where: { propertyId: { in: chunk }, createdAt: { gte: from } }, select: { propertyId: true, createdAt: true } })),
    ]);
    for (const row of periods) {
      const to = row.endsAt! < now ? row.endsAt! : now;
      const first = bakuDay(row.startsAt!);
      const last = bakuDay(to);
      const total = { views: 0, uniqueViews: 0, contactReveals: 0, leads: 0 };
      for (const stat of daily) {
        if (stat.propertyId !== row.propertyId || stat.day < first || stat.day > last) continue;
        total.views += stat.views;
        total.uniqueViews += stat.uniqueViews;
        total.contactReveals += stat.contactReveals;
      }
      total.leads = leads.filter((lead) => lead.propertyId === row.propertyId && lead.createdAt >= row.startsAt! && lead.createdAt <= to).length;
      stats.set(row.id, total);
    }
  }
  const view = (row: (typeof all)[number]) => ({
    ...row,
    property: propertyOf.get(row.propertyId) ?? null,
    requester: row.requesterId ? userOf.get(row.requesterId) ?? null : null,
    decidedBy: row.decidedById ? userOf.get(row.decidedById) ?? null : null,
    stats: stats.get(row.id) ?? null,
  });
  return { pending: pending.map(view), active: active.map(view), past: past.map(view) };
}
