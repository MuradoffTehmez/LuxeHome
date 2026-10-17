import type { Prisma } from "@prisma/client/wasm.js";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, SUBSCRIPTION_SOURCES, SUBSCRIPTION_STATUSES, type SubscriptionStatus } from "@/lib/constants";
import { findManyInChunks } from "@/lib/d1-chunks";
import { isPlanDuration } from "@/lib/subscriptions/plan-policy";
import { effectiveSubscriptionStatus, parseCampaignMessage, subscriptionEndsAt, trialEndsAt, type CampaignMessage } from "@/lib/subscriptions/subscription-policy";

/**
 * Abunələrin idarəsi və hesabatı (#246, PRD 16.5). Tanıtım mərhələsində abunəni yalnız panel təyin
 * edir (`ADMIN`) — ödəniş yaranmır. Bir hesabın eyni anda bir aktiv abunəsi olur: yeni təyinat
 * köhnə aktiv abunəni ləğv edir (şərti `updateMany`, D1-də tranzaksiya yoxdur).
 */

export type GrantResult = { ok: true; subscriptionId: string } | { ok: false; reason: "user" | "plan" | "audience" };

export async function grantSubscription(input: {
  actorId: string;
  email: string;
  planId: string;
  months: number;
  withTrial: boolean;
  note?: string | null;
  now?: Date;
}): Promise<GrantResult> {
  const now = input.now ?? new Date();
  if (!isPlanDuration(input.months)) return { ok: false, reason: "plan" };
  const [user, plan] = await Promise.all([
    prisma.user.findFirst({
      where: { email: input.email.trim().toLowerCase(), accountType: { not: ACCOUNT_TYPES.STAFF }, isActive: true },
      select: { id: true, accountType: true, agency: { select: { id: true } } },
    }),
    prisma.subscriptionPlan.findUnique({ where: { id: input.planId }, select: { id: true, code: true, audience: true, trialDays: true } }),
  ]);
  if (!user) return { ok: false, reason: "user" };
  if (!plan) return { ok: false, reason: "plan" };
  // Agentlik planı yalnız agentlik hesabına (agentlik mühitinə bağlanır).
  if (plan.audience === "AGENCY" && !user.agency) return { ok: false, reason: "audience" };

  const trialEnd = input.withTrial ? trialEndsAt(now, plan.trialDays) : null;
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      agencyId: plan.audience === "AGENCY" ? user.agency!.id : null,
      planId: plan.id,
      planCode: plan.code,
      audience: plan.audience,
      months: input.months,
      status: trialEnd ? SUBSCRIPTION_STATUSES.TRIALING : SUBSCRIPTION_STATUSES.ACTIVE,
      source: SUBSCRIPTION_SOURCES.ADMIN,
      startsAt: now,
      endsAt: subscriptionEndsAt(now, input.months),
      trialEndsAt: trialEnd,
      note: input.note?.trim().slice(0, 300) || null,
      createdById: input.actorId,
    },
    select: { id: true },
  });
  // Yeni abunə yazılandan sonra köhnə aktivlər ləğv olunur — yaratma alınmasa hesab abunəsiz qalmır.
  await prisma.subscription.updateMany({
    where: { userId: user.id, id: { not: subscription.id }, status: { in: [SUBSCRIPTION_STATUSES.TRIALING, SUBSCRIPTION_STATUSES.ACTIVE, SUBSCRIPTION_STATUSES.PAST_DUE] } },
    data: { status: SUBSCRIPTION_STATUSES.CANCELLED, cancelledAt: now },
  });
  return { ok: true, subscriptionId: subscription.id };
}

export async function cancelSubscription(id: string, now = new Date()): Promise<boolean> {
  const { count } = await prisma.subscription.updateMany({
    where: { id, status: { notIn: [SUBSCRIPTION_STATUSES.CANCELLED, SUBSCRIPTION_STATUSES.EXPIRED] } },
    data: { status: SUBSCRIPTION_STATUSES.CANCELLED, cancelledAt: now },
  });
  return count > 0;
}

/**
 * Abunə hesabatı: statuslar (vaxta görə effektiv), plan × auditoriya üzrə aktivlər, son abunələr. Saylar bazada
 * aqreqat edilir — siyahı limiti ümumi göstəriciləri kəsməsin; yalnız «son abunələr» cədvəli 50 sətirdir.
 */
export async function getSubscriptionReport(now = new Date()) {
  const live = { endsAt: { gt: now } };
  const trialOver = { trialEndsAt: { lte: now } };
  const where: Record<SubscriptionStatus, Prisma.SubscriptionWhereInput> = {
    TRIALING: { status: SUBSCRIPTION_STATUSES.TRIALING, ...live, OR: [{ trialEndsAt: null }, { trialEndsAt: { gt: now } }] },
    ACTIVE: { status: SUBSCRIPTION_STATUSES.ACTIVE, ...live },
    PAST_DUE: { ...live, OR: [{ status: SUBSCRIPTION_STATUSES.PAST_DUE }, { status: SUBSCRIPTION_STATUSES.TRIALING, ...trialOver }] },
    CANCELLED: { status: SUBSCRIPTION_STATUSES.CANCELLED },
    EXPIRED: {
      OR: [
        { status: SUBSCRIPTION_STATUSES.EXPIRED },
        { status: { in: [SUBSCRIPTION_STATUSES.TRIALING, SUBSCRIPTION_STATUSES.ACTIVE, SUBSCRIPTION_STATUSES.PAST_DUE] }, endsAt: { lte: now } },
      ],
    },
  };
  const statuses = Object.values(SUBSCRIPTION_STATUSES) as SubscriptionStatus[];
  const [total, counts, planRows, recentRows] = await Promise.all([
    prisma.subscription.count(),
    Promise.all(statuses.map((status) => prisma.subscription.count({ where: where[status] }))),
    prisma.subscription.groupBy({ by: ["audience", "planCode"], where: { OR: [where.ACTIVE, where.TRIALING] }, _count: { _all: true } }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, userId: true, planCode: true, audience: true, months: true, status: true, source: true, startsAt: true, endsAt: true, trialEndsAt: true },
    }),
  ]);
  const byStatus = Object.fromEntries(statuses.map((status, index) => [status, counts[index]])) as Record<SubscriptionStatus, number>;
  const recent = recentRows.map((row) => ({ ...row, effectiveStatus: effectiveSubscriptionStatus(row, now) }));
  const users = await findManyInChunks([...new Set(recent.map((row) => row.userId))], 0, (chunk) =>
    prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true, email: true } }));
  const userOf = new Map(users.map((user) => [user.id, user]));
  return {
    total,
    byStatus,
    byPlan: planRows.map((row) => ({ key: `${row.audience}:${row.planCode}`, count: row._count._all })).sort((a, b) => b.count - a.count),
    recent: recent.map((row) => ({ ...row, user: userOf.get(row.userId) ?? null })),
  };
}

/** Paket səhifəsindəki aktiv tanıtım kampaniyası (ən son başlayan). */
export async function getActivePromoCampaign(now = new Date()): Promise<{ id: string; message: CampaignMessage } | null> {
  const campaigns = await prisma.promoCampaign.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gt: now } },
    orderBy: { startsAt: "desc" },
    take: 5,
    select: { id: true, message: true },
  });
  for (const campaign of campaigns) {
    const message = parseCampaignMessage(campaign.message);
    if (message) return { id: campaign.id, message };
  }
  return null;
}
