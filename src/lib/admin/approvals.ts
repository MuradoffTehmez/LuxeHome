import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AGENCY_EMPLOYEE_STATUSES, REVIEW_STATUSES } from "@/lib/constants";

/**
 * Agentlik/agent təsdiq növbəsi (#155) — menyu sayğacı və «Təsdiq növbəsi» səhifəsi
 * eyni şərtləri işlədir ki, sayğacdakı rəqəm səhifədəki sətir sayı ilə üst-üstə düşsün.
 *
 * Nümunə (demo) qeydlər və deaktiv hesablar növbəyə düşmür.
 */
/**
 * Rədd edilmiş agentlik (`rejectedAt`) sahib profili yeniləyənə qədər növbəyə qayıtmır (#157) —
 * əks halda eyni müraciət hər gün yenidən baxılardı.
 */
export const PENDING_AGENCY_WHERE: Prisma.AgencyWhereInput = {
  isVerified: false,
  isDemo: false,
  rejectedAt: null,
  user: { isActive: true },
};

/**
 * Heç vaxt təsdiqlənməmiş agent profili. Gizli (`isPublic: false`), amma təsdiqlənmiş
 * profil növbəyə düşmür: admin onu qəsdən gizlədib, «Təsdiqlə və dərc et» onu
 * yenidən dərc edərdi və sayğac heç vaxt sıfırlanmazdı.
 */
export const PENDING_AGENT_WHERE: Prisma.AgentProfileWhereInput = {
  isDemo: false,
  user: { isActive: true },
  isVerified: false,
  rejectedAt: null,
};

export type ApprovalCounts = {
  agencies: number;
  agents: number;
  employees: number;
  reviews: number;
  total: number;
};

export async function getApprovalCounts(): Promise<ApprovalCounts> {
  const [agencies, agents, employees, reviews] = await Promise.all([
    prisma.agency.count({ where: PENDING_AGENCY_WHERE }),
    prisma.agentProfile.count({ where: PENDING_AGENT_WHERE }),
    prisma.agencyEmployee.count({ where: { status: AGENCY_EMPLOYEE_STATUSES.PENDING } }),
    prisma.agentReview.count({ where: { status: REVIEW_STATUSES.PENDING } }),
  ]);
  return { agencies, agents, employees, reviews, total: agencies + agents + employees + reviews };
}
