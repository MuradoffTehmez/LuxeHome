"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { prisma } from "@/lib/prisma";
import {
  PLAN_CAPABILITIES,
  PLAN_DESCRIPTION_MAX,
  PLAN_DURATIONS,
  PLAN_LIMITS,
  TRIAL_DAYS_MAX,
  isCapabilityLevel,
  isPlanCode,
  parseLimitInput,
  parsePlanCapabilities,
  parsePriceInput,
  type PlanLimits,
} from "@/lib/subscriptions/plan-policy";

/**
 * Abunə planının saxlanması (#244, PRD 16.5). Plan dəsti sabitdir (Basic/Pro/Premium × auditoriya),
 * panel təsviri, aktivliyi, sınaq günlərini, imkan səviyyələrini, limitləri və tarifləri dəyişir.
 * Boş tarif sahəsi həmin müddətin təklif olunmadığını bildirir (sətir silinir). Hər saxlama audit olunur.
 */
export async function saveSubscriptionPlan(_state: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.BILLING_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  const id = String(formData.get("id") ?? "").slice(0, 60);
  try {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      select: {
        id: true, code: true, audience: true, description: true, isActive: true, trialDays: true, capabilities: true, limits: true,
        prices: { select: { months: true, priceMinor: true, currency: true, isActive: true } },
      },
    });
    if (!plan || !isPlanCode(plan.code)) return failure(msg("server.finance.notFound"));

    const trialText = String(formData.get("trialDays") ?? "").trim();
    const trialDays = /^\d+$/.test(trialText) ? Number(trialText) : NaN;
    if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > TRIAL_DAYS_MAX) {
      return failure(msg("server.finance.invalidTrial"), { trialDays: msg("server.finance.invalidTrial") });
    }

    const capabilities = parsePlanCapabilities(plan.capabilities, plan.code);
    for (const capability of PLAN_CAPABILITIES) {
      const level = formData.get(`cap_${capability}`);
      if (isCapabilityLevel(level)) capabilities[capability] = level;
    }

    const limits = {} as PlanLimits;
    for (const limit of PLAN_LIMITS) {
      const value = parseLimitInput(formData.get(`limit_${limit}`));
      if (value === undefined) return failure(msg("server.finance.invalidLimit"), { [`limit_${limit}`]: msg("server.finance.invalidLimit") });
      limits[limit] = value;
    }

    const prices: { months: number; priceMinor: number | null }[] = [];
    for (const months of PLAN_DURATIONS) {
      const value = parsePriceInput(formData.get(`price_${months}`));
      if (value === undefined) return failure(msg("server.finance.invalidPrice"), { [`price_${months}`]: msg("server.finance.invalidPrice") });
      prices.push({ months, priceMinor: value });
    }

    const descriptions: Record<string, string> = {};
    for (const locale of ["az", "en", "ru"] as const) {
      const text = String(formData.get(`description_${locale}`) ?? "").trim().slice(0, PLAN_DESCRIPTION_MAX);
      if (text) descriptions[locale] = text;
    }
    const description = Object.keys(descriptions).length ? JSON.stringify(descriptions) : null;
    const isActive = formData.get("isActive") === "on";
    const hasLimits = PLAN_LIMITS.some((limit) => limits[limit] != null);

    // D1-də tranzaksiya yoxdur: plan və tariflər ardıcıl yazılır, hər hansı addım alınmasa əvvəlki vəziyyət
    // (planın sahələri və bütün tariflər) bərpa olunur — yarımçıq qiymət cədvəli ictimai səhifəyə düşməsin.
    try {
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: { description, isActive, trialDays, capabilities: JSON.stringify(capabilities), limits: hasLimits ? JSON.stringify(limits) : null },
      });
      for (const price of prices) {
        if (price.priceMinor == null) {
          await prisma.subscriptionPlanPrice.deleteMany({ where: { planId: plan.id, months: price.months } });
        } else {
          await prisma.subscriptionPlanPrice.upsert({
            where: { planId_months: { planId: plan.id, months: price.months } },
            create: { planId: plan.id, months: price.months, priceMinor: price.priceMinor },
            update: { priceMinor: price.priceMinor, isActive: true },
          });
        }
      }
    } catch (error) {
      await restorePlan(plan).catch((restoreError: unknown) => console.error("[finance] plan bərpa olunmadı:", restoreError));
      throw error;
    }

    await recordAudit(user, "UPDATE", "SubscriptionPlan", plan.id, `${plan.code} · ${plan.audience}`, {
      oldValue: { capabilities: plan.capabilities, prices: plan.prices },
      newValue: { description, isActive, trialDays, capabilities, limits, prices },
    });
    revalidatePath("/admin/maliyye");
    revalidatePath("/[locale]/paketler", "page");
    return success(msg("server.finance.saved"));
  } catch (error) {
    return unexpected("abunə planı saxlanmadı", error, msg("server.common.unexpected"));
  }
}

type PlanSnapshot = {
  id: string;
  description: string | null;
  isActive: boolean;
  trialDays: number;
  capabilities: string;
  limits: string | null;
  prices: { months: number; priceMinor: number; currency: string; isActive: boolean }[];
};

/** Uğursuz saxlamadan sonra planı və tarifləri saxlamadan əvvəlki vəziyyətə qaytarır (idempotent). */
async function restorePlan(snapshot: PlanSnapshot): Promise<void> {
  await prisma.subscriptionPlan.update({
    where: { id: snapshot.id },
    data: { description: snapshot.description, isActive: snapshot.isActive, trialDays: snapshot.trialDays, capabilities: snapshot.capabilities, limits: snapshot.limits },
  });
  const keep = snapshot.prices.map((price) => price.months);
  await prisma.subscriptionPlanPrice.deleteMany({ where: { planId: snapshot.id, months: { notIn: keep } } });
  for (const price of snapshot.prices) {
    await prisma.subscriptionPlanPrice.upsert({
      where: { planId_months: { planId: snapshot.id, months: price.months } },
      create: { planId: snapshot.id, months: price.months, priceMinor: price.priceMinor, currency: price.currency, isActive: price.isActive },
      update: { priceMinor: price.priceMinor, currency: price.currency, isActive: price.isActive },
    });
  }
}
