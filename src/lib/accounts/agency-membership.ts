import { prisma } from "@/lib/prisma";
import { AGENCY_EMPLOYEE_SOURCES, AGENCY_EMPLOYEE_STATUSES, MAX_AGENCY_EMPLOYEES } from "@/lib/constants";
import { revalidatePublicContent } from "@/lib/revalidate-public";

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
