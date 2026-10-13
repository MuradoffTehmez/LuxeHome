import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, PUBLIC_PROPERTY_STATUSES } from "@/lib/constants";

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
};

/** Yalnız ictimai görünən elana müraciət bağlanır — gizli/silinmiş id qəbul olunmur. */
export async function resolveLeadProperty(propertyId: string | null | undefined): Promise<LeadProperty | null> {
  const id = propertyId?.trim();
  if (!id || id.length > 64) return null;
  const property = await prisma.property.findFirst({
    where: { id, deletedAt: null, status: { in: PUBLIC_PROPERTY_STATUSES } },
    select: { id: true, title: true, authorId: true, author: { select: { accountType: true, isActive: true } } },
  });
  if (!property) return null;
  const listerId =
    property.authorId && property.author && property.author.isActive && property.author.accountType !== ACCOUNT_TYPES.STAFF
      ? property.authorId
      : null;
  return { id: property.id, title: property.title, listerId };
}

/** Kabinet — hesabın elanlarına gələn müraciətlər (ən yenisi əvvəl). */
export async function getListerLeads(userId: string, take = 100) {
  return prisma.lead.findMany({
    where: { property: { authorId: userId } },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      message: true,
      createdAt: true,
      property: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
