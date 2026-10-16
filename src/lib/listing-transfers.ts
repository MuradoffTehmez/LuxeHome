import { prisma } from "@/lib/prisma";
import {
  AGENCY_EMPLOYEE_STATUSES,
  OPEN_TRANSFER_STATUSES,
  TRANSFER_REASON_MAX,
  TRANSFER_REASON_MIN,
  TRANSFER_STATUSES,
} from "@/lib/constants";
import { listingAgencyFor } from "@/lib/accounts/agency-ownership";

/**
 * Agentliklər arası elan köçürməsi (#212, PRD 6.4).
 *
 * Axın: B agentliyinin sahibi və ya təsdiqlənmiş agenti A agentliyinə aid elanı istəyir →
 * A-nın sahibi təsdiqləyir (`PENDING_SOURCE` → `PENDING_ADMIN`) → admin hüquqi/müqavilə statusunu
 * yoxlayıb təsdiqləyir (`COMPLETED`). D1-də tranzaksiya yoxdur: hər keçid şərti `updateMany`-dir,
 * elanın özü yalnız `agencyId = A` olduqca dəyişir — köhnəlmiş sorğu yeni vəziyyətin üzərinə yazmır.
 *
 * Məxfilik (PRD 6.4 «Vacib»): A agentliyinin müştəri məlumatı yeni agentliyə keçmir. Elanın köhnə
 * müraciətləri A-ya bağlanır (`Lead.agencyId`), kabinet isə başqa agentliyə bağlı müraciəti elanın
 * yeni müəllifinə göstərmir (`leadScope`).
 */

type Requester = { id: string; accountType: string };

export type CreateTransferResult =
  | { result: "created"; id: string; fromAgencyId: string; fromOwnerId: string; propertyTitle: string; toAgencyName: string }
  | { result: "noAgency" | "notFound" | "sameAgency" | "notAgencyListing" | "duplicate" | "invalidTarget" | "invalidReason" | "noConsent" };

/** `/az/emlaklar/<slug>`, tam link və ya sadəcə slug — elanın slug-ı. */
export function parseListingReference(input: string): string | null {
  const value = input.trim();
  if (!value || value.length > 500) return null;
  const match = value.match(/\/emlaklar\/([^/?#\s]+)/);
  const slug = (match ? match[1] : value).trim();
  return /^[a-z0-9-]{1,200}$/i.test(slug) ? slug.toLowerCase() : null;
}

/** Təhvil alan B tərəfindəndir: agentliyin sahibi və ya təsdiqlənmiş agenti. */
async function isAgencyParticipant(agencyId: string, userId: string): Promise<boolean> {
  const agency = await prisma.agency.findUnique({ where: { id: agencyId }, select: { userId: true } });
  if (!agency) return false;
  if (agency.userId === userId) return true;
  const member = await prisma.agencyEmployee.findFirst({
    where: { agencyId, userId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { id: true },
  });
  return Boolean(member);
}

export async function createTransferRequest(input: {
  requester: Requester;
  listingReference: string;
  targetUserId: string | null;
  reason: string;
  ownerConsent: boolean;
  ownerConsentNote: string | null;
}): Promise<CreateTransferResult> {
  const own = await listingAgencyFor(input.requester);
  if (!own) return { result: "noAgency" };

  const reason = input.reason.trim().replace(/\s+/g, " ");
  if (reason.length < TRANSFER_REASON_MIN || reason.length > TRANSFER_REASON_MAX) return { result: "invalidReason" };
  if (!input.ownerConsent) return { result: "noConsent" };

  // Agent yalnız özünə istəyə bilər; başqa agenti seçmək sahibin işidir.
  const targetUserId = own.isOwner ? input.targetUserId || input.requester.id : input.requester.id;
  if (!(await isAgencyParticipant(own.agencyId, targetUserId))) return { result: "invalidTarget" };

  const slug = parseListingReference(input.listingReference);
  if (!slug) return { result: "notFound" };
  const property = await prisma.property.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, title: true, agencyId: true, agency: { select: { userId: true } } },
  });
  if (!property) return { result: "notFound" };
  if (!property.agencyId || !property.agency) return { result: "notAgencyListing" };
  if (property.agencyId === own.agencyId) return { result: "sameAgency" };

  const open = await prisma.listingTransfer.findFirst({
    where: { propertyId: property.id, status: { in: [...OPEN_TRANSFER_STATUSES] } },
    select: { id: true },
  });
  if (open) return { result: "duplicate" };

  const created = await prisma.listingTransfer.create({
    data: {
      propertyId: property.id,
      fromAgencyId: property.agencyId,
      toAgencyId: own.agencyId,
      requestedById: input.requester.id,
      targetUserId,
      reason,
      ownerConsent: true,
      ownerConsentNote: input.ownerConsentNote?.trim().slice(0, TRANSFER_REASON_MAX) || null,
    },
    select: { id: true },
  });
  // Yoxlama ilə yazı arasında ikinci sorğu yarana bilər (D1-də unikal şərti indeks yoxdur):
  // ən köhnə açıq sorğu qalır, sonrakılar ləğv olunur.
  const opens = await prisma.listingTransfer.findMany({
    where: { propertyId: property.id, status: { in: [...OPEN_TRANSFER_STATUSES] } },
    select: { id: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  if (opens[0]?.id !== created.id) {
    await prisma.listingTransfer.update({ where: { id: created.id }, data: { status: TRANSFER_STATUSES.CANCELLED } });
    return { result: "duplicate" };
  }
  return {
    result: "created",
    id: created.id,
    fromAgencyId: property.agencyId,
    fromOwnerId: property.agency.userId,
    propertyTitle: property.title,
    toAgencyName: own.agencyName,
  };
}

const transferNotifySelect = {
  id: true,
  propertyId: true,
  fromAgencyId: true,
  toAgencyId: true,
  requestedById: true,
  targetUserId: true,
  property: { select: { title: true, slug: true } },
  fromAgency: { select: { name: true, userId: true } },
  toAgency: { select: { name: true, userId: true } },
} as const;

export type TransferDecisionResult =
  | { result: "decided"; transfer: NonNullable<Awaited<ReturnType<typeof loadTransfer>>> }
  | { result: "notFound" | "stale" };

function loadTransfer(id: string) {
  return prisma.listingTransfer.findUnique({ where: { id }, select: transferNotifySelect });
}

/** A agentliyinin sahibi: təsdiq sorğunu admin növbəsinə göndərir, rədd bağlayır. */
export async function decideTransferAsSource(input: {
  transferId: string;
  ownerUserId: string;
  approve: boolean;
  note: string | null;
  now?: Date;
}): Promise<TransferDecisionResult> {
  const transfer = await loadTransfer(input.transferId);
  if (!transfer || transfer.fromAgency.userId !== input.ownerUserId) return { result: "notFound" };
  const { count } = await prisma.listingTransfer.updateMany({
    where: { id: transfer.id, status: TRANSFER_STATUSES.PENDING_SOURCE },
    data: {
      status: input.approve ? TRANSFER_STATUSES.PENDING_ADMIN : TRANSFER_STATUSES.REJECTED,
      sourceDecidedById: input.ownerUserId,
      sourceDecidedAt: input.now ?? new Date(),
      sourceNote: input.note,
    },
  });
  return count === 0 ? { result: "stale" } : { result: "decided", transfer };
}

/** Sorğunu yaradan və ya B agentliyinin sahibi açıq sorğunu geri çəkir. */
export async function cancelTransferRequest(input: { transferId: string; userId: string }): Promise<boolean> {
  const transfer = await loadTransfer(input.transferId);
  if (!transfer || (transfer.requestedById !== input.userId && transfer.toAgency.userId !== input.userId)) return false;
  const { count } = await prisma.listingTransfer.updateMany({
    where: { id: transfer.id, status: { in: [...OPEN_TRANSFER_STATUSES] } },
    data: { status: TRANSFER_STATUSES.CANCELLED },
  });
  return count > 0;
}

export type AdminTransferResult =
  | { result: "completed" | "rejected"; transfer: NonNullable<Awaited<ReturnType<typeof loadTransfer>>> }
  | { result: "notFound" | "stale" | "targetGone" | "listingChanged" };

/**
 * Admin qərarı. Təsdiqdə: təhvil alan hələ də B-dədirmi və elan hələ də A-dadırmı yoxlanılır,
 * sorğu götürülür, köhnə müraciətlər A-ya bağlanır, sonra elan şərti olaraq B-yə keçir.
 * Elan yazılmasa (arada silinib/köçüb) sorğu `CANCELLED` olur — admin köhnə vəziyyəti təsdiqləməsin.
 */
export async function decideTransferAsAdmin(input: {
  transferId: string;
  adminId: string;
  approve: boolean;
  note: string | null;
  now?: Date;
}): Promise<AdminTransferResult> {
  const transfer = await loadTransfer(input.transferId);
  if (!transfer) return { result: "notFound" };
  const now = input.now ?? new Date();
  const decision = { adminDecidedById: input.adminId, adminDecidedAt: now, adminNote: input.note };

  if (!input.approve) {
    const { count } = await prisma.listingTransfer.updateMany({
      where: { id: transfer.id, status: TRANSFER_STATUSES.PENDING_ADMIN },
      data: { status: TRANSFER_STATUSES.REJECTED, ...decision },
    });
    return count === 0 ? { result: "stale" } : { result: "rejected", transfer };
  }

  if (!(await isAgencyParticipant(transfer.toAgencyId, transfer.targetUserId))) return { result: "targetGone" };
  const { count } = await prisma.listingTransfer.updateMany({
    where: { id: transfer.id, status: TRANSFER_STATUSES.PENDING_ADMIN },
    data: { status: TRANSFER_STATUSES.COMPLETED, ...decision },
  });
  if (count === 0) return { result: "stale" };

  let moved: { count: number };
  try {
    // Köhnə müraciətlər A agentliyində qalır — yeni müəllif onları görməməlidir.
    await prisma.lead.updateMany({
      where: { propertyId: transfer.propertyId, agencyId: null },
      data: { agencyId: transfer.fromAgencyId },
    });
    moved = await prisma.property.updateMany({
      where: { id: transfer.propertyId, agencyId: transfer.fromAgencyId, deletedAt: null },
      data: { agencyId: transfer.toAgencyId, authorId: transfer.targetUserId, assignedAgentId: null },
    });
  } catch (error) {
    // Keçici xətada sorğu admin növbəsinə qaytarılır — təkrar cəhd mümkün qalsın, tarixçə isə
    // köçmədiyi halda «köçürülüb» göstərməsin. Müraciətlərin A-ya bağlanması idempotentdir.
    await prisma.listingTransfer
      .updateMany({
        where: { id: transfer.id, status: TRANSFER_STATUSES.COMPLETED },
        data: { status: TRANSFER_STATUSES.PENDING_ADMIN, adminDecidedById: null, adminDecidedAt: null, adminNote: null },
      })
      .catch(() => undefined);
    throw error;
  }
  if (moved.count === 0) {
    await prisma.listingTransfer.updateMany({
      where: { id: transfer.id, status: TRANSFER_STATUSES.COMPLETED },
      data: { status: TRANSFER_STATUSES.CANCELLED },
    });
    return { result: "listingChanged" };
  }
  return { result: "completed", transfer };
}

const listSelect = {
  id: true,
  status: true,
  reason: true,
  ownerConsentNote: true,
  sourceNote: true,
  adminNote: true,
  createdAt: true,
  sourceDecidedAt: true,
  adminDecidedAt: true,
  requestedById: true,
  property: { select: { title: true, slug: true } },
  fromAgency: { select: { name: true, slug: true } },
  toAgency: { select: { name: true, slug: true } },
  requestedBy: { select: { name: true } },
} as const;

const LIST_LIMIT = 50;

/**
 * Açıq sorğular tarixçədən ayrıca və həmişə tam oxunur — köhnə gözləyən sorğu yeni qərarlar
 * arxasında limitdən kənarda qalıb itməsin (sahib onu təsdiqləyə bilməzdi).
 */
async function transferList(where: { fromAgencyId: string } | { toAgencyId: string }) {
  const [open, history] = await Promise.all([
    prisma.listingTransfer.findMany({
      where: { ...where, status: { in: [...OPEN_TRANSFER_STATUSES] } },
      select: listSelect,
      orderBy: { createdAt: "asc" },
    }),
    prisma.listingTransfer.findMany({
      where: { ...where, status: { notIn: [...OPEN_TRANSFER_STATUSES] } },
      select: listSelect,
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
    }),
  ]);
  return [...open, ...history];
}

/** Kabinet: agentliyin gələn (A kimi) və göndərdiyi (B kimi) sorğuları — açıqlar əvvəldə. */
export async function getAgencyTransfers(agencyId: string) {
  const [incoming, outgoing] = await Promise.all([
    transferList({ fromAgencyId: agencyId }),
    transferList({ toAgencyId: agencyId }),
  ]);
  return { incoming, outgoing };
}

/** Admin növbəsi: defolt A-nın təsdiqlədiyi və admin qərarı gözləyən sorğular. */
export function getTransferQueue(status: string) {
  return prisma.listingTransfer.findMany({
    where: { status },
    select: { ...listSelect, ownerConsent: true, targetUserId: true },
    orderBy: { createdAt: status === TRANSFER_STATUSES.PENDING_ADMIN ? "asc" : "desc" },
    take: 100,
  });
}

export function countPendingAdminTransfers(): Promise<number> {
  return prisma.listingTransfer.count({ where: { status: TRANSFER_STATUSES.PENDING_ADMIN } });
}
