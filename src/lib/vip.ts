import { prisma } from "@/lib/prisma";
import {
  PROPERTY_STATUSES,
  VIP_DECISION_NOTE_MAX,
  VIP_DURATIONS_DAYS,
  VIP_REQUEST_SOURCES,
  VIP_REQUEST_STATUSES,
} from "@/lib/constants";
import { findManyInChunks } from "@/lib/d1-chunks";
import { bakuDay } from "@/lib/listing-stats";
import { getFeatureFlags } from "@/lib/feature-flags";
import { noticeVipDecision, noticeVipRevoked } from "@/lib/accounts/account-notices";

/**
 * VIP elanlar (#248, PRD Modul 12). Tanıtım mərhələsində VIP ödənişsizdir, amma yalnız admin təsdiqi ilə
 * verilir (`ADMIN_APPROVAL_FOR_VIP`). İstisna: `VIP_SELF_SERVICE_ENABLED` açıq və təsdiq bayrağı bağlıdırsa
 * sorğu dərhal təsdiqlənir.
 *
 * Təsdiqlənmiş `VipRequest` VIP dövrüdür; elanın `isFeatured`/`featuredUntil` sahələri ictimai görünüşü verir
 * (nişan, kart, ana səhifə bölməsi, siyahıda üstünlük). D1-də tranzaksiya yoxdur — hər keçid şərti
 * `updateMany` ilə götürülür, elan yazılmasa sorğu əvvəlki statusa qaytarılır. Müddət bitəndə gündəlik iş
 * dövrü `EXPIRED` edir, elanın `isFeatured`-ini isə mövcud baxım işi söndürür.
 */

const DAY = 86_400_000;

export function isVipDuration(value: unknown): value is (typeof VIP_DURATIONS_DAYS)[number] {
  return typeof value === "number" && (VIP_DURATIONS_DAYS as readonly number[]).includes(value);
}

function cleanNote(value: string | null | undefined): string | null {
  const text = (value ?? "").trim().replace(/\s+/g, " ").slice(0, VIP_DECISION_NOTE_MAX);
  return text || null;
}

/** Elanın hazırda aktiv VIP dövrü (təsdiqlənmiş və bitməmiş). */
async function activeGrant(propertyId: string, now: Date) {
  return prisma.vipRequest.findFirst({
    where: { propertyId, status: VIP_REQUEST_STATUSES.APPROVED, endsAt: { gt: now } },
    orderBy: { endsAt: "desc" },
    select: { id: true, endsAt: true },
  });
}

/** Elanın VIP görünüşünü dövrün sonuna uyğunlaşdırır (uzun olan qalır). */
async function applyToProperty(propertyId: string, endsAt: Date): Promise<boolean> {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { featuredUntil: true, isFeatured: true } });
  if (!property) return false;
  const until = property.isFeatured && property.featuredUntil && property.featuredUntil > endsAt ? property.featuredUntil : endsAt;
  await prisma.property.update({ where: { id: propertyId }, data: { isFeatured: true, featuredUntil: until } });
  return true;
}

export type VipRequestResult =
  | { ok: true; requestId: string; approved: boolean }
  | { ok: false; reason: "disabled" | "duration" | "listing" | "active" | "pending" };

/** Elan sahibinin VIP sorğusu (PRD 14.3, 1-ci addım). */
export async function requestVip(input: { userId: string; propertyId: string; days: number; message?: string | null; now?: Date }): Promise<VipRequestResult> {
  const now = input.now ?? new Date();
  const flags = await getFeatureFlags();
  if (!flags.VIP_REQUESTS) return { ok: false, reason: "disabled" };
  if (!isVipDuration(input.days)) return { ok: false, reason: "duration" };
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, authorId: input.userId, deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED },
    select: { id: true, title: true },
  });
  if (!property) return { ok: false, reason: "listing" };
  if (await activeGrant(property.id, now)) return { ok: false, reason: "active" };
  const pending = await prisma.vipRequest.count({ where: { propertyId: property.id, status: VIP_REQUEST_STATUSES.PENDING } });
  if (pending > 0) return { ok: false, reason: "pending" };

  const autoApprove = flags.VIP_SELF_SERVICE_ENABLED && !flags.ADMIN_APPROVAL_FOR_VIP;
  const created = await prisma.vipRequest.create({
    data: {
      propertyId: property.id,
      requesterId: input.userId,
      source: autoApprove ? VIP_REQUEST_SOURCES.SELF_SERVICE : VIP_REQUEST_SOURCES.OWNER,
      requestedDays: input.days,
      message: cleanNote(input.message),
    },
    select: { id: true },
  });
  // «Elan başına bir açıq sorğu» yazılışdan sonra yoxlanılır — eyni anda göndərilən ikinci sorğu ləğv olunur.
  const open = await prisma.vipRequest.findMany({
    where: { propertyId: property.id, status: VIP_REQUEST_STATUSES.PENDING },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (open[0]?.id !== created.id) {
    await prisma.vipRequest.updateMany({ where: { id: created.id, status: VIP_REQUEST_STATUSES.PENDING }, data: { status: VIP_REQUEST_STATUSES.CANCELLED } });
    return { ok: false, reason: "pending" };
  }
  if (autoApprove) {
    const decided = await approveVip({ actorId: null, requestId: created.id, days: input.days, note: null, now });
    return decided.ok ? { ok: true, requestId: created.id, approved: true } : { ok: true, requestId: created.id, approved: false };
  }
  return { ok: true, requestId: created.id, approved: false };
}

export type VipDecisionResult = { ok: true; title: string } | { ok: false; reason: "notFound" | "duration" | "note" | "listing" };

/** Admin təsdiqi (PRD 14.3, 4–5-ci addım): müddət təyin olunur, elan VIP olur. `actorId: null` — self-service. */
export async function approveVip(input: { actorId: string | null; requestId: string; days: number; note: string | null; now?: Date }): Promise<VipDecisionResult> {
  const now = input.now ?? new Date();
  if (!isVipDuration(input.days)) return { ok: false, reason: "duration" };
  const request = await prisma.vipRequest.findUnique({ where: { id: input.requestId }, select: { id: true, propertyId: true, requesterId: true, status: true } });
  if (!request || request.status !== VIP_REQUEST_STATUSES.PENDING) return { ok: false, reason: "notFound" };
  const property = await prisma.property.findFirst({ where: { id: request.propertyId, deletedAt: null }, select: { id: true, title: true, authorId: true } });
  if (!property) return { ok: false, reason: "listing" };

  // Elanın hələ aktiv dövrü varsa yeni dövr onun sonundan başlayır — müddət itmir.
  const current = await activeGrant(property.id, now);
  const startsAt = current?.endsAt && current.endsAt > now ? current.endsAt : now;
  const endsAt = new Date(startsAt.getTime() + input.days * DAY);
  const note = cleanNote(input.note);
  const claimed = await prisma.vipRequest.updateMany({
    where: { id: request.id, status: VIP_REQUEST_STATUSES.PENDING },
    data: { status: VIP_REQUEST_STATUSES.APPROVED, decidedById: input.actorId, decidedAt: now, decisionNote: note, startsAt, endsAt, requestedDays: input.days },
  });
  if (claimed.count === 0) return { ok: false, reason: "notFound" };
  try {
    if (!(await applyToProperty(property.id, endsAt))) throw new Error("listing");
  } catch {
    await prisma.vipRequest.updateMany({
      where: { id: request.id, status: VIP_REQUEST_STATUSES.APPROVED },
      data: { status: VIP_REQUEST_STATUSES.PENDING, decidedById: null, decidedAt: null, decisionNote: null, startsAt: null, endsAt: null },
    });
    return { ok: false, reason: "listing" };
  }
  const recipient = request.requesterId ?? property.authorId;
  if (recipient && input.actorId) await noticeVipDecision({ userId: recipient, requestId: request.id, title: property.title, approved: true, days: input.days, note });
  return { ok: true, title: property.title };
}

/** Admin rəddi — səbəb məcburidir (PRD 14.4 «təsdiq və rədd səbəbləri»). */
export async function rejectVip(input: { actorId: string; requestId: string; note: string; now?: Date }): Promise<VipDecisionResult> {
  const now = input.now ?? new Date();
  const note = cleanNote(input.note);
  if (!note || note.length < 5) return { ok: false, reason: "note" };
  const request = await prisma.vipRequest.findUnique({ where: { id: input.requestId }, select: { id: true, propertyId: true, requesterId: true, requestedDays: true } });
  if (!request) return { ok: false, reason: "notFound" };
  const claimed = await prisma.vipRequest.updateMany({
    where: { id: request.id, status: VIP_REQUEST_STATUSES.PENDING },
    data: { status: VIP_REQUEST_STATUSES.REJECTED, decidedById: input.actorId, decidedAt: now, decisionNote: note },
  });
  if (claimed.count === 0) return { ok: false, reason: "notFound" };
  const property = await prisma.property.findUnique({ where: { id: request.propertyId }, select: { title: true } });
  if (request.requesterId) {
    await noticeVipDecision({ userId: request.requesterId, requestId: request.id, title: property?.title ?? "—", approved: false, days: request.requestedDays, note });
  }
  return { ok: true, title: property?.title ?? "—" };
}

/** Admin birbaşa VIP verir (sorğusuz) — dövr `source = ADMIN` sətri kimi yazılır. */
export async function grantVip(input: { actorId: string; propertyId: string; days: number; note: string | null; now?: Date }): Promise<VipDecisionResult & { requestId?: string }> {
  if (!isVipDuration(input.days)) return { ok: false, reason: "duration" };
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, deletedAt: null, status: PROPERTY_STATUSES.PUBLISHED },
    select: { id: true },
  });
  if (!property) return { ok: false, reason: "listing" };
  const created = await prisma.vipRequest.create({
    data: { propertyId: property.id, source: VIP_REQUEST_SOURCES.ADMIN, requestedDays: input.days, message: null },
    select: { id: true },
  });
  const result = await approveVip({ actorId: input.actorId, requestId: created.id, days: input.days, note: input.note, now: input.now });
  if (!result.ok) await prisma.vipRequest.updateMany({ where: { id: created.id, status: VIP_REQUEST_STATUSES.PENDING }, data: { status: VIP_REQUEST_STATUSES.CANCELLED } });
  return { ...result, requestId: created.id };
}

/** Aktiv dövrü uzadır (PRD 14.4 «uzadılması»). */
export async function extendVip(input: { actorId: string; requestId: string; days: number; now?: Date }): Promise<VipDecisionResult & { endsAt?: Date }> {
  const now = input.now ?? new Date();
  if (!isVipDuration(input.days)) return { ok: false, reason: "duration" };
  const request = await prisma.vipRequest.findUnique({ where: { id: input.requestId }, select: { id: true, propertyId: true, endsAt: true, extendedCount: true, status: true } });
  if (!request || request.status !== VIP_REQUEST_STATUSES.APPROVED || !request.endsAt || request.endsAt <= now) return { ok: false, reason: "notFound" };
  const endsAt = new Date(request.endsAt.getTime() + input.days * DAY);
  const claimed = await prisma.vipRequest.updateMany({
    where: { id: request.id, status: VIP_REQUEST_STATUSES.APPROVED, endsAt: request.endsAt },
    data: { endsAt, extendedCount: request.extendedCount + 1 },
  });
  if (claimed.count === 0) return { ok: false, reason: "notFound" };
  await applyToProperty(request.propertyId, endsAt);
  const property = await prisma.property.findUnique({ where: { id: request.propertyId }, select: { title: true } });
  return { ok: true, title: property?.title ?? "—", endsAt };
}

/** Aktiv dövrü dayandırır (PRD 14.4 «ləğvi») — səbəb məcburidir, elanın VIP görünüşü dərhal söndürülür. */
export async function revokeVip(input: { actorId: string; requestId: string; note: string; now?: Date }): Promise<VipDecisionResult> {
  const now = input.now ?? new Date();
  const note = cleanNote(input.note);
  if (!note || note.length < 5) return { ok: false, reason: "note" };
  const request = await prisma.vipRequest.findUnique({ where: { id: input.requestId }, select: { id: true, propertyId: true, requesterId: true } });
  if (!request) return { ok: false, reason: "notFound" };
  const claimed = await prisma.vipRequest.updateMany({
    where: { id: request.id, status: VIP_REQUEST_STATUSES.APPROVED },
    data: { status: VIP_REQUEST_STATUSES.REVOKED, decisionNote: note, decidedById: input.actorId, endsAt: now },
  });
  if (claimed.count === 0) return { ok: false, reason: "notFound" };
  // Başqa aktiv dövr yoxdursa elanın VIP görünüşü söndürülür.
  const other = await activeGrant(request.propertyId, now);
  await prisma.property.update({
    where: { id: request.propertyId },
    data: other?.endsAt ? { isFeatured: true, featuredUntil: other.endsAt } : { isFeatured: false, featuredUntil: null },
  });
  const property = await prisma.property.findUnique({ where: { id: request.propertyId }, select: { title: true, authorId: true } });
  const recipient = request.requesterId ?? property?.authorId;
  if (recipient) await noticeVipRevoked({ userId: recipient, requestId: request.id, title: property?.title ?? "—", note });
  return { ok: true, title: property?.title ?? "—" };
}

/** Gündəlik iş (PRD 14.3, 6-cı addım): bitmiş dövrlər `EXPIRED`. Elanın `isFeatured`-ini baxım işi söndürür. */
export async function expireVipGrants(now = new Date()): Promise<number> {
  const { count } = await prisma.vipRequest.updateMany({
    where: { status: VIP_REQUEST_STATUSES.APPROVED, endsAt: { lte: now } },
    data: { status: VIP_REQUEST_STATUSES.EXPIRED },
  });
  return count;
}

/** Kabinet: sahibin elanları üzrə son VIP sorğusu/dövrü. */
export async function getOwnerVipState(propertyIds: string[], now = new Date()) {
  const rows = await findManyInChunks(propertyIds, 0, (chunk) =>
    prisma.vipRequest.findMany({
      where: { propertyId: { in: chunk } },
      orderBy: { createdAt: "desc" },
      select: { id: true, propertyId: true, status: true, endsAt: true, decisionNote: true, createdAt: true },
    }));
  const state = new Map<string, { status: string; endsAt: Date | null; note: string | null }>();
  for (const row of rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
    if (state.has(row.propertyId)) continue;
    const status = row.status === VIP_REQUEST_STATUSES.APPROVED && row.endsAt && row.endsAt <= now ? VIP_REQUEST_STATUSES.EXPIRED : row.status;
    state.set(row.propertyId, { status, endsAt: row.endsAt, note: row.decisionNote });
  }
  return state;
}

/**
 * Admin VIP paneli (PRD 14.4): gözləyən sorğular, aktiv və bitmiş dövrlər, verən administrator, səbəblər və
 * performans (dövr ərzində baxış, unikal baxış, nömrə açılması və müraciət).
 */
export async function getVipDashboard(now = new Date()) {
  const [pending, active, past] = await Promise.all([
    prisma.vipRequest.findMany({ where: { status: VIP_REQUEST_STATUSES.PENDING }, orderBy: { createdAt: "asc" }, take: 100 }),
    prisma.vipRequest.findMany({ where: { status: VIP_REQUEST_STATUSES.APPROVED, endsAt: { gt: now } }, orderBy: { endsAt: "asc" }, take: 200 }),
    prisma.vipRequest.findMany({
      where: {
        OR: [
          { status: { in: [VIP_REQUEST_STATUSES.EXPIRED, VIP_REQUEST_STATUSES.REVOKED, VIP_REQUEST_STATUSES.REJECTED] } },
          { status: VIP_REQUEST_STATUSES.APPROVED, endsAt: { lte: now } },
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
    findManyInChunks(propertyIds, 0, (chunk) =>
      prisma.property.findMany({ where: { id: { in: chunk } }, select: { id: true, title: true, slug: true, status: true, price: true, currency: true, viewCount: true } })),
    findManyInChunks(userIds, 0, (chunk) => prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, name: true, email: true } })),
  ]);
  const propertyOf = new Map(properties.map((row) => [row.id, row]));
  const userOf = new Map(users.map((row) => [row.id, row]));

  // Performans yalnız dövrü olan sətirlər üçün. Statistika və müraciətlər elanlar üzrə bir dəfə oxunur
  // (dövr başına sorğu Worker subrequest limitini aşardı), dövr günlərinə görə JS-də cəmlənir.
  const periods = [...active, ...past].filter((row) => row.startsAt && row.endsAt);
  const performance = new Map<string, { views: number; uniqueViews: number; contactReveals: number; leads: number }>();
  if (periods.length > 0) {
    const ids = [...new Set(periods.map((row) => row.propertyId))];
    const from = new Date(Math.min(...periods.map((row) => row.startsAt!.getTime())));
    const [stats, leads] = await Promise.all([
      findManyInChunks(ids, 1, (chunk) =>
        prisma.propertyDailyStat.findMany({
          where: { propertyId: { in: chunk }, day: { gte: bakuDay(from) } },
          select: { propertyId: true, day: true, views: true, uniqueViews: true, contactReveals: true },
        })),
      findManyInChunks(ids, 1, (chunk) =>
        prisma.lead.findMany({ where: { propertyId: { in: chunk }, createdAt: { gte: from } }, select: { propertyId: true, createdAt: true } })),
    ]);
    for (const row of periods) {
      const to = row.endsAt! < now ? row.endsAt! : now;
      const firstDay = bakuDay(row.startsAt!);
      const lastDay = bakuDay(to);
      const total = { views: 0, uniqueViews: 0, contactReveals: 0, leads: 0 };
      for (const stat of stats) {
        if (stat.propertyId !== row.propertyId || stat.day < firstDay || stat.day > lastDay) continue;
        total.views += stat.views;
        total.uniqueViews += stat.uniqueViews;
        total.contactReveals += stat.contactReveals;
      }
      total.leads = leads.filter((lead) => lead.propertyId === row.propertyId && lead.createdAt >= row.startsAt! && lead.createdAt <= to).length;
      performance.set(row.id, total);
    }
  }
  const view = (row: (typeof all)[number]) => ({
    ...row,
    property: propertyOf.get(row.propertyId) ?? null,
    requester: row.requesterId ? userOf.get(row.requesterId) ?? null : null,
    decidedBy: row.decidedById ? userOf.get(row.decidedById) ?? null : null,
    performance: performance.get(row.id) ?? null,
  });
  return { pending: pending.map(view), active: active.map(view), past: past.map(view) };
}
