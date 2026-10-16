import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  AGENCY_EMPLOYEE_STATUSES,
  LISTING_OWNERSHIP,
  type MembershipEndReason,
} from "@/lib/constants";

/**
 * Agentlik elan sahibliyi və üzvlük tarixçəsi (#210, PRD Modul 04).
 *
 * Qayda (PRD 6.2): agentlik adından yaradılan elan agentin şəxsi hesabına deyil, agentliyin
 * mühitinə aiddir (`Property.agencyId`). Agent ayrılanda belə elanlar agentlikdə qalır və sahibə
 * və ya başqa agentə təhvil verilir; agentin şəxsi elanları (`agencyId = null`) onunla qalır.
 * `authorId` elanı hazırda idarə edən hesabdır, `createdById` isə ilk yaradan — təhvildə dəyişmir.
 */

export function isListingOwnership(value: unknown): value is (typeof LISTING_OWNERSHIP)[keyof typeof LISTING_OWNERSHIP] {
  return value === LISTING_OWNERSHIP.AGENCY || value === LISTING_OWNERSHIP.PERSONAL;
}

/** Hesabın agentlik adından elan yerləşdirə biləcəyi agentlik (sahib və ya təsdiqlənmiş agent). */
export async function listingAgencyFor(user: { id: string; accountType: string }): Promise<{
  agencyId: string;
  agencyName: string;
  /** Sahib seçim etmir — onun elanı həmişə agentlikdir. */
  isOwner: boolean;
} | null> {
  if (user.accountType === ACCOUNT_TYPES.AGENCY) {
    const agency = await prisma.agency.findUnique({ where: { userId: user.id }, select: { id: true, name: true } });
    return agency ? { agencyId: agency.id, agencyName: agency.name, isOwner: true } : null;
  }
  const membership = await prisma.agencyEmployee.findFirst({
    where: { userId: user.id, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { agency: { select: { id: true, name: true } } },
  });
  return membership ? { agencyId: membership.agency.id, agencyName: membership.agency.name, isOwner: false } : null;
}

/**
 * Yeni elanın agentliyi: sahibin elanı həmişə agentlikdir; agent «Şəxsi» seçməyibsə agentlik
 * adındadır (PRD 6.2 defoltu). Etibarsız seçim agentlik sayılır — səhvən şəxsi elan yaranmasın.
 */
export async function resolveNewListingAgencyId(
  user: { id: string; accountType: string },
  choice: unknown,
): Promise<string | null> {
  const agency = await listingAgencyFor(user);
  if (!agency) return null;
  if (!agency.isOwner && choice === LISTING_OWNERSHIP.PERSONAL) return null;
  return agency.agencyId;
}

/**
 * Üzvlük dövrünü açır (təsdiqdə). İdempotentdir: eyni agentlikdə açıq dövr varsa yenisi yaranmır,
 * çünki təsdiq təkrar cəhd edilə bilər (`commitMembershipDecision` → `resumed`).
 * Tarixçə köməkçidir — xətası üzvlük qərarını sındırmamalıdır.
 */
export async function openMembershipPeriod(input: { userId: string; agencyId: string; role?: string; joinedAt?: Date }): Promise<void> {
  try {
    const open = await prisma.agencyMembershipHistory.findFirst({
      where: { userId: input.userId, agencyId: input.agencyId, leftAt: null },
      select: { id: true },
    });
    if (open) return;
    const [agency, employee] = await Promise.all([
      prisma.agency.findUnique({ where: { id: input.agencyId }, select: { name: true } }),
      prisma.agencyEmployee.findUnique({
        where: { agencyId_userId: { agencyId: input.agencyId, userId: input.userId } },
        select: { role: true, approvedAt: true },
      }),
    ]);
    if (!agency) return;
    await prisma.agencyMembershipHistory.create({
      data: {
        userId: input.userId,
        agencyId: input.agencyId,
        agencyName: agency.name,
        role: input.role ?? employee?.role ?? "AGENT",
        joinedAt: input.joinedAt ?? employee?.approvedAt ?? new Date(),
      },
    });
  } catch (error) {
    console.error("[agency] üzvlük tarixçəsi açılmadı", error);
  }
}

/**
 * Açıq üzvlük dövrünü bağlayır (ayrılma/dayandırma). Açıq dövr yoxdursa (miqrasiyadan əvvəlki
 * qeyd, tarixçə xətası) bağlanmış dövr yaradılır ki, ayrılma faktı itməsin.
 */
export async function closeMembershipPeriod(input: {
  userId: string;
  agencyId: string;
  reason: MembershipEndReason;
  handedOver: number;
  role?: string;
  joinedAt?: Date | null;
  leftAt?: Date;
}): Promise<void> {
  const leftAt = input.leftAt ?? new Date();
  try {
    const { count } = await prisma.agencyMembershipHistory.updateMany({
      where: { userId: input.userId, agencyId: input.agencyId, leftAt: null },
      data: { leftAt, endReason: input.reason, handedOver: input.handedOver },
    });
    if (count > 0) return;
    const agency = await prisma.agency.findUnique({ where: { id: input.agencyId }, select: { name: true } });
    if (!agency) return;
    await prisma.agencyMembershipHistory.create({
      data: {
        userId: input.userId,
        agencyId: input.agencyId,
        agencyName: agency.name,
        role: input.role ?? "AGENT",
        joinedAt: input.joinedAt ?? leftAt,
        leftAt,
        endReason: input.reason,
        handedOver: input.handedOver,
      },
    });
  } catch (error) {
    console.error("[agency] üzvlük tarixçəsi bağlanmadı", error);
  }
}

const HISTORY_LIMIT = 50;

/** Agentin öz üzvlük tarixçəsi (kabinet) — yalnız özünə göstərilir. */
export function getUserMembershipHistory(userId: string) {
  return prisma.agencyMembershipHistory.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    take: HISTORY_LIMIT,
    select: { id: true, agencyName: true, role: true, joinedAt: true, leftAt: true, endReason: true, handedOver: true },
  });
}

/**
 * Agentliyin keçmiş və hazırkı üzvləri (sahib və admin). Agentin başqa agentliklərdəki
 * dövrləri buraya düşmür — PRD 6.6: məxfi hissələr yalnız səlahiyyətli tərəfə.
 */
export function getAgencyMembershipHistory(agencyId: string) {
  return prisma.agencyMembershipHistory.findMany({
    where: { agencyId },
    orderBy: { joinedAt: "desc" },
    take: HISTORY_LIMIT,
    select: {
      id: true,
      role: true,
      joinedAt: true,
      leftAt: true,
      endReason: true,
      handedOver: true,
      user: { select: { id: true, name: true } },
    },
  });
}
