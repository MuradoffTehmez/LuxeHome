import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AGENCY_EMPLOYEE_STATUSES, REVIEW_STATUSES } from "@/lib/constants";

/**
 * Agentlik/agent təsdiq növbəsi (#155) — menyu sayğacı və «Təsdiq növbəsi» səhifəsi
 * eyni şərtləri işlədir ki, sayğacdakı rəqəm səhifədəki sətir sayı ilə üst-üstə düşsün.
 *
 * Nümunə (demo) qeydlər və deaktiv hesablar növbəyə düşmür.
 */
export const PENDING_AGENCY_WHERE: Prisma.AgencyWhereInput = { isVerified: false, isDemo: false, user: { isActive: true } };

/** Qeydiyyatdan keçmiş agentin profili hələ təsdiqlənməyib və ya dərc olunmayıb. */
export const PENDING_AGENT_WHERE: Prisma.AgentProfileWhereInput = {
  isDemo: false,
  user: { isActive: true },
  OR: [{ isPublic: false }, { isVerified: false }],
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
