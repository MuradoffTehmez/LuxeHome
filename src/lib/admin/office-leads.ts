import type { Prisma } from "@prisma/client";
import { ACCOUNT_TYPES } from "@/lib/constants";

/**
 * Ofisin işlədiyi müraciətlər.
 *
 * İctimai hesabın (sahib, agent, agentlik) elanına gələn müraciət sahibin kabinetinə
 * gedir (`resolveLeadProperty`) — ofisin işi deyil. O, `Lead` cədvəlində qalır və tam
 * siyahıda nəzarət üçün görünür, amma lövhə, menyu sayğacı, dashboard və huni yalnız
 * bu şərtlə sayır: əks halda ofisə aid olmayan «yeni» müraciətlər SLA xəbərdarlığı
 * yaradır və konversiya rəqəmlərini şişirdirdi.
 *
 * Qayda `resolveLeadProperty` ilə eynidir: müəllif yoxdursa, əməkdaşdırsa və ya
 * deaktivdirsə müraciət ofisə düşür. Agentlik profilindəki formadan gələn elansız müraciət
 * (#161) agentliyindir — agentlik silinəndə (`agencyId` boşalır) ofisə qayıdır.
 */
export const OFFICE_LEAD_WHERE: Prisma.LeadWhereInput = {
  OR: [
    { propertyId: null, agencyId: null },
    { property: { authorId: null } },
    { property: { author: { accountType: ACCOUNT_TYPES.STAFF } } },
    { property: { author: { isActive: false } } },
  ],
};
