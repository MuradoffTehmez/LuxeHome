import { prisma } from "@/lib/prisma";
import {
  PLAN_CODES,
  isPlanAudience,
  isPlanCode,
  isPlanDuration,
  parsePlanCapabilities,
  parsePlanDescription,
  parsePlanLimits,
  type PlanAudience,
  type PlanCapabilities,
  type PlanCode,
  type PlanDescription,
  type PlanDuration,
  type PlanLimits,
} from "@/lib/subscriptions/plan-policy";

/**
 * Abunə planlarının oxunması (#244). Naməlum kod/auditoriya (əl ilə yazılmış sətir) atılır,
 * imkan və limit JSON-u `plan-policy.ts` ilə bərpa olunur. Planlar `PLAN_CODES` sırası ilə gəlir.
 */

export type SubscriptionPlanView = {
  id: string;
  code: PlanCode;
  audience: PlanAudience;
  description: Partial<PlanDescription>;
  capabilities: PlanCapabilities;
  limits: PlanLimits;
  trialDays: number;
  isActive: boolean;
  prices: { months: PlanDuration; priceMinor: number; currency: string; isActive: boolean }[];
};

export async function getSubscriptionPlans(input: { audience?: PlanAudience; includeInactive?: boolean } = {}): Promise<SubscriptionPlanView[]> {
  const rows = await prisma.subscriptionPlan.findMany({
    where: { ...(input.audience ? { audience: input.audience } : {}), ...(input.includeInactive ? {} : { isActive: true }) },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    select: {
      id: true, code: true, audience: true, description: true, capabilities: true, limits: true, trialDays: true, isActive: true,
      prices: { select: { months: true, priceMinor: true, currency: true, isActive: true } },
    },
  });
  return rows
    .filter((row): row is typeof row & { code: PlanCode; audience: PlanAudience } => isPlanCode(row.code) && isPlanAudience(row.audience))
    .map((row) => ({
      id: row.id,
      code: row.code,
      audience: row.audience,
      description: parsePlanDescription(row.description),
      capabilities: parsePlanCapabilities(row.capabilities, row.code),
      limits: parsePlanLimits(row.limits),
      trialDays: row.trialDays,
      isActive: row.isActive,
      prices: row.prices
        .filter((price): price is typeof price & { months: PlanDuration } => isPlanDuration(price.months))
        .filter((price) => input.includeInactive || price.isActive)
        .sort((a, b) => a.months - b.months),
    }))
    .sort((a, b) => a.audience.localeCompare(b.audience) || PLAN_CODES.indexOf(a.code) - PLAN_CODES.indexOf(b.code));
}
