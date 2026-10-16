import { prisma } from "@/lib/prisma";
import { AGENCY_EMPLOYEE_SOURCES, AGENCY_EMPLOYEE_STATUSES, MAX_AGENCY_EMPLOYEES } from "@/lib/constants";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { openMembershipPeriod } from "@/lib/accounts/agency-ownership";

/**
 * Agentlik komandasının ortaq qaydaları — kabinet (sahib), panel (admin) və qeydiyyat.
 *
 * Yer limiti (`MAX_AGENCY_EMPLOYEES`) təsdiqlənmiş əməkdaşlara və sahibin göndərdiyi
 * gözləyən dəvətlərə aiddir. Agentin qoşulma sorğusu yer tutmur: əks halda kənar
 * şəxslər sorğu göndərib sahibin dəvət imkanını bağlaya bilərdi. Limit sorğu
 * təsdiqlənəndə yoxlanılır.
 */

/** Yer tutan qeydlər: təsdiqlənmiş + gözləyən dəvətlər. */
export async function occupiedAgencySeats(agencyId: string): Promise<number> {
  return prisma.agencyEmployee.count({
    where: {
      agencyId,
      OR: [
        { status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
        { status: AGENCY_EMPLOYEE_STATUSES.PENDING, source: AGENCY_EMPLOYEE_SOURCES.INVITE },
      ],
    },
  });
}

export async function approvedAgencySeats(agencyId: string): Promise<number> {
  return prisma.agencyEmployee.count({
    where: { agencyId, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
  });
}

export async function hasFreeApprovedSeat(agencyId: string): Promise<boolean> {
  return (await approvedAgencySeats(agencyId)) < MAX_AGENCY_EMPLOYEES;
}

export type MembershipDecisionResult = "done" | "resumed" | "conflict";

/**
 * Sahibin və adminin ortaq qərar yolu. D1-də tranzaksiya yoxdur, ona görə iki yazı
 * (status + agent profilinin bağlantısı) bərpa oluna bilən qaydada gedir:
 *
 * - status şərti `updateMany` ilə dəyişir — eyni anda baxan ikinci tərəf üzərinə yazmır;
 * - profil bağlantısı alınmasa status `PENDING`-ə qaytarılır və sorğu siyahıda qalır,
 *   yəni təkrar cəhd mümkündür (əks halda təsdiqlənmiş, amma bağlanmamış əməkdaş qalardı);
 * - artıq təsdiqlənmiş qeyd üçün təkrar təsdiq yalnız idempotent bağlantını tamamlayır.
 */
export async function commitMembershipDecision(input: {
  id: string;
  userId: string;
  agencyId: string;
  approved: boolean;
  currentStatus: string;
}): Promise<MembershipDecisionResult> {
  if (input.currentStatus === AGENCY_EMPLOYEE_STATUSES.APPROVED && input.approved) {
    await linkAgentProfileToAgency(input.userId, input.agencyId, true);
    await openMembershipPeriod({ userId: input.userId, agencyId: input.agencyId });
    return "resumed";
  }
  const { count } = await prisma.agencyEmployee.updateMany({
    where: { id: input.id, status: AGENCY_EMPLOYEE_STATUSES.PENDING },
    data: {
      status: input.approved ? AGENCY_EMPLOYEE_STATUSES.APPROVED : AGENCY_EMPLOYEE_STATUSES.REJECTED,
      approvedAt: input.approved ? new Date() : null,
    },
  });
  if (count === 0) return "conflict";
  if (!input.approved) return "done";
  try {
    await linkAgentProfileToAgency(input.userId, input.agencyId, true);
  } catch (error) {
    await prisma.agencyEmployee
      .updateMany({
        where: { id: input.id, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
        data: { status: AGENCY_EMPLOYEE_STATUSES.PENDING, approvedAt: null },
      })
      .catch(() => undefined);
    throw error;
  }
  // Üzvlük tarixçəsi (#210, PRD 6.6) — idempotent, xətası qərarı sındırmır.
  await openMembershipPeriod({ userId: input.userId, agencyId: input.agencyId });
  return "done";
}

/**
 * «Bir aktiv agentlik» invariantı: istifadəçi başqa agentlikdə artıq təsdiqlənibsə
 * ikinci agentlik onu nə dəvət, nə də təsdiq edə bilər. Sxem yalnız `(agencyId, userId)`
 * cütünü unikal saxlayır — iki təsdiq olsa kart və əlaqə hansı agentliyə aid olduğunu
 * birmənalı bilməzdi və agent profili son təsdiqlə üzərinə yazılardı.
 */
export async function hasOtherApprovedMembership(userId: string, agencyId: string): Promise<boolean> {
  const other = await prisma.agencyEmployee.findFirst({
    where: { userId, agencyId: { not: agencyId }, status: AGENCY_EMPLOYEE_STATUSES.APPROVED },
    select: { id: true },
  });
  return other != null;
}

/**
 * Agentin ictimai profilini agentliyə bağlayır (təsdiqdə) və ya ayırır (çıxarılanda).
 * Bağlama olmadan təsdiqlənmiş agent agentlik səhifəsinin «Agentlər» bölməsinə düşmürdü.
 * Ayırma yalnız profil məhz bu agentliyə bağlıdırsa edilir.
 */
export async function linkAgentProfileToAgency(userId: string, agencyId: string, linked: boolean): Promise<void> {
  const profiles = await prisma.agentProfile.findMany({
    where: linked ? { userId } : { userId, agencyId },
    select: { id: true, slug: true },
  });
  if (profiles.length === 0) return;
  await prisma.agentProfile.updateMany({
    where: { id: { in: profiles.map((profile) => profile.id) } },
    data: { agencyId: linked ? agencyId : null },
  });
  for (const profile of profiles) revalidatePublicContent("agent", profile.slug);
}
