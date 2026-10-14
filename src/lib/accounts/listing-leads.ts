import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, AGENCY_EMPLOYEE_STATUSES, PUBLIC_PROPERTY_STATUSES } from "@/lib/constants";

/**
 * Elan səhifəsindən gələn müraciətin ünvanı.
 *
 * Əvvəl elan səhifəsindəki forma `propertyId` göndərmirdi: müraciət ümumi «Əlaqə»
 * lead-i kimi yazılır, hansı elana aid olduğu bilinmirdi və sahibin elanına gələn
 * müraciət ofisə düşürdü. İndi müraciət elana bağlanır; elan ictimai hesabındırsa
 * (sahib, agent, agentlik) müraciət sahibin kabinetinə gedir.
 */

export type LeadProperty = {
  id: string;
  title: string;
  /** Müraciəti alacaq ictimai hesab; şirkət (STAFF) elanında null — ofis baxır. */
  listerId: string | null;
  /** Agentlikdə ərazi üzrə bölgü üçün (#161). */
  districtId: string | null;
  cityId: string | null;
};

/** Yalnız ictimai görünən elana müraciət bağlanır — gizli/silinmiş id qəbul olunmur. */
export async function resolveLeadProperty(propertyId: string | null | undefined): Promise<LeadProperty | null> {
  const id = propertyId?.trim();
  if (!id || id.length > 64) return null;
  const property = await prisma.property.findFirst({
    where: { id, deletedAt: null, status: { in: PUBLIC_PROPERTY_STATUSES } },
    select: {
      id: true,
      title: true,
      authorId: true,
      districtId: true,
      cityId: true,
      author: { select: { accountType: true, isActive: true } },
    },
  });
  if (!property) return null;
  const listerId =
    property.authorId && property.author && property.author.isActive && property.author.accountType !== ACCOUNT_TYPES.STAFF
      ? property.authorId
      : null;
  return { id: property.id, title: property.title, listerId, districtId: property.districtId ?? null, cityId: property.cityId ?? null };
}

/**
 * Hesabın gördüyü müraciətlər (#161): ona yönləndirilənlər, elanlarına gələnlər (elan ona
 * təhvil verilibsə köhnə müraciətlər də) və agentlik sahibidirsə agentliyin bütün müraciətləri.
 */
export async function leadScope(userId: string): Promise<{ where: Prisma.LeadWhereInput; agency: { id: string; name: string } | null }> {
  const agency = await prisma.agency.findUnique({ where: { userId }, select: { id: true, name: true } });
  const or: Prisma.LeadWhereInput[] = [{ handlerId: userId }, { property: { authorId: userId } }];
  if (agency) or.push({ agencyId: agency.id });
  return { where: { OR: or }, agency };
}

/** Kabinet — hesabın müraciətləri (ən yenisi əvvəl). */
export async function getAccountLeads(userId: string, options: { unanswered?: boolean; take?: number } = {}) {
  const { where, agency } = await leadScope(userId);
  const leads = await prisma.lead.findMany({
    where: options.unanswered ? { AND: [where, { respondedAt: null }] } : where,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      subject: true,
      message: true,
      source: true,
      status: true,
      createdAt: true,
      respondedAt: true,
      escalatedAt: true,
      handlerId: true,
      agencyId: true,
      handler: { select: { name: true } },
      property: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: options.take ?? 100,
  });
  return { leads, agency };
}

/** Agentlik sahibinin müraciəti verə biləcəyi şəxslər: özü + təsdiqlənmiş agentlər. */
export async function getLeadAssignees(agency: { id: string }, ownerUserId: string, ownerName: string) {
  const employees = await prisma.agencyEmployee.findMany({
    where: { agencyId: agency.id, status: AGENCY_EMPLOYEE_STATUSES.APPROVED, user: { isActive: true } },
    select: { userId: true, user: { select: { name: true } } },
    orderBy: { approvedAt: "asc" },
  });
  return [{ userId: ownerUserId, name: ownerName }, ...employees.map((item) => ({ userId: item.userId, name: item.user.name }))];
}

/**
 * Müraciət üzərində əməliyyat haqqı: ona baxan, elanın müəllifi və ya müraciətin
 * agentliyinin sahibi. Başqa hesabın müraciət id-si ilə gələn sorğu `null` alır.
 */
export async function findManageableLead(userId: string, leadId: string) {
  if (!leadId || leadId.length > 64) return null;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      name: true,
      subject: true,
      status: true,
      handlerId: true,
      respondedAt: true,
      agency: { select: { id: true, name: true, userId: true } },
      property: { select: { title: true, authorId: true } },
    },
  });
  if (!lead) return null;
  const isOwner = lead.agency?.userId === userId;
  if (lead.handlerId !== userId && lead.property?.authorId !== userId && !isOwner) return null;
  return { ...lead, isOwner };
}
