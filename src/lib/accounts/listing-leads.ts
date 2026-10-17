import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, ACTIVE_OFFER_STATUSES, AGENCY_MEMBER_PERMISSIONS, PUBLIC_PROPERTY_STATUSES } from "@/lib/constants";
import { ACTIVE_MEMBER_WHERE, effectivePermissions } from "@/lib/accounts/agency-access";

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
  /**
   * Satılıb və ya kirayəyə verilib (#202, PRD 5.3): elan ictimai qalır, amma müraciət qəbul etmir.
   * Çağıran belə müraciəti rədd edir — `null` qaytarmaq onu səssizcə ofisə yönəldərdi.
   */
  closed: boolean;
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
      status: true,
      author: { select: { accountType: true, isActive: true } },
    },
  });
  if (!property) return null;
  const listerId =
    property.authorId && property.author && property.author.isActive && property.author.accountType !== ACCOUNT_TYPES.STAFF
      ? property.authorId
      : null;
  return {
    id: property.id,
    title: property.title,
    listerId,
    districtId: property.districtId ?? null,
    cityId: property.cityId ?? null,
    closed: !(ACTIVE_OFFER_STATUSES as string[]).includes(property.status),
  };
}

/**
 * Hesabın gördüyü müraciətlər (#161): ona yönləndirilənlər, elanlarına gələnlər (elan ona
 * təhvil verilibsə köhnə müraciətlər də) və agentlik sahibidirsə agentliyin bütün müraciətləri.
 */
/**
 * Müraciətə baxan kimi görmək üçün: müraciət agentliyə aid deyilsə, və ya baxan həmin
 * agentliyin hələ də təsdiqlənmiş üzvüdür. Komandadan çıxan agent agentlik müraciətlərinin
 * (müştərinin adı, nömrəsi, mesajı) sahibi olaraq qalmamalıdır — onlar agentliyindir.
 */
function ownAgencyLeadWhere(userId: string): Prisma.LeadWhereInput[] {
  return [
    { agencyId: null },
    // Girişi dayandırılmış üzv (#218) agentlik müraciətlərini görmür.
    { agency: { employees: { some: { userId, ...ACTIVE_MEMBER_WHERE } } } },
    { agency: { userId } },
  ];
}

function currentHandlerWhere(userId: string): Prisma.LeadWhereInput {
  return { handlerId: userId, OR: ownAgencyLeadWhere(userId) };
}

export type ManagedLeadAgency = { id: string; name: string; ownerUserId: string };

/**
 * Agentliyin bütün müraciətlərini idarə edən: sahib və ya `LEADS_MANAGE` səlahiyyətli aktiv üzv (#218).
 */
async function managedLeadAgency(userId: string): Promise<ManagedLeadAgency | null> {
  const [owned, membership] = await Promise.all([
    prisma.agency.findUnique({ where: { userId }, select: { id: true, name: true, userId: true } }),
    prisma.agencyEmployee.findFirst({
      where: { userId, ...ACTIVE_MEMBER_WHERE },
      select: { role: true, permissions: true, agency: { select: { id: true, name: true, userId: true } } },
    }),
  ]);
  if (owned) return { id: owned.id, name: owned.name, ownerUserId: owned.userId };
  if (membership && effectivePermissions(membership.role, membership.permissions).has(AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE)) {
    return { id: membership.agency.id, name: membership.agency.name, ownerUserId: membership.agency.userId };
  }
  return null;
}

export async function leadScope(userId: string): Promise<{ where: Prisma.LeadWhereInput; agency: ManagedLeadAgency | null }> {
  const agency = await managedLeadAgency(userId);
  // Elanın müəllifi olmaq başqa agentliyə bağlı müraciəti açmır (#212, PRD 6.4): agentliklər arası
  // köçürmədən sonra köhnə müştəri məlumatı əvvəlki agentlikdə qalır.
  const or: Prisma.LeadWhereInput[] = [
    currentHandlerWhere(userId),
    { property: { authorId: userId }, OR: ownAgencyLeadWhere(userId) },
  ];
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
      stage: true,
      nextContactAt: true,
      handler: { select: { name: true } },
      property: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: options.take ?? 100,
  });
  return { leads, agency };
}

/** Müraciəti verə biləcəyi şəxslər: agentliyin sahibi + aktiv (dayandırılmamış) agentlər. */
export async function getLeadAssignees(agency: ManagedLeadAgency) {
  const [owner, employees] = await Promise.all([
    prisma.user.findUnique({ where: { id: agency.ownerUserId }, select: { name: true } }),
    prisma.agencyEmployee.findMany({
      where: { agencyId: agency.id, ...ACTIVE_MEMBER_WHERE, user: { isActive: true } },
      select: { userId: true, user: { select: { name: true } } },
      orderBy: { approvedAt: "asc" },
    }),
  ]);
  return [{ userId: agency.ownerUserId, name: owner?.name ?? agency.name }, ...employees.map((item) => ({ userId: item.userId, name: item.user.name }))];
}

/**
 * Müraciət üzərində əməliyyat haqqı: ona baxan, elanın müəllifi və ya müraciətin
 * agentliyinin sahibi. Başqa hesabın müraciət id-si ilə gələn sorğu `null` alır.
 */
export async function findManageableLead(userId: string, leadId: string) {
  if (!leadId || leadId.length > 64) return null;
  const { where, agency: managed } = await leadScope(userId);
  const lead = await prisma.lead.findFirst({
    where: { AND: [{ id: leadId }, where] },
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
  return {
    ...lead,
    isOwner: lead.agency?.userId === userId,
    // Agentlik müraciətini başqa agentə vermək haqqı: sahib və ya `LEADS_MANAGE` (#218).
    canManage: Boolean(lead.agency && managed && lead.agency.id === managed.id),
  };
}
