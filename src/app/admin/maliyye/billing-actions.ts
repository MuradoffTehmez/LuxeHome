"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth/types";
import { isPlanCode, parsePriceInput } from "@/lib/subscriptions/plan-policy";
import { normalizeDiscountCode } from "@/lib/subscriptions/subscription-policy";
import { cancelSubscription, grantSubscription } from "@/lib/subscriptions/subscriptions";

/**
 * «Maliyyə və Monetizasiya» əməliyyatları (#246, PRD 16.5): abunə təyini/ləğvi, endirim kodları və
 * tanıtım kampaniyaları. Hər action öz guard-ını çağırır (`billing:manage`) və audit olunur.
 */

async function billingGuard(): Promise<AuthUser | ActionState> {
  try {
    return await requireAdminAction(PERMISSIONS.BILLING_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}
const isState = (value: unknown): value is ActionState => typeof value === "object" && value !== null && "status" in value;

/** `YYYY-MM-DD` → Bakı gününün əvvəli/sonu; boş — `null`, səhv — `undefined`. */
function parseDay(value: FormDataEntryValue | null, endOfDay: boolean): Date | null | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return undefined;
  const date = new Date(`${text}T${endOfDay ? "23:59:59" : "00:00:00"}+04:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Panel tərəfindən abunə təyini — tanıtım mərhələsində ödənişsiz, `source = ADMIN`. */
export async function grantSubscriptionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await billingGuard();
  if (isState(user)) return user;
  const email = String(formData.get("email") ?? "").slice(0, 200);
  try {
    const result = await grantSubscription({
      actorId: user.id,
      email,
      planId: String(formData.get("planId") ?? "").slice(0, 60),
      months: Number(formData.get("months")),
      withTrial: formData.get("withTrial") === "on",
      note: String(formData.get("note") ?? ""),
    });
    if (!result.ok) return failure(msg(`server.finance.grant.${result.reason}`));
    await recordAudit(user, "CREATE", "Subscription", result.subscriptionId, email);
    revalidatePath("/admin/maliyye/abuneler");
    return success(msg("server.finance.grant.saved"));
  } catch (error) {
    return unexpected("abunə təyin edilmədi", error, msg("server.common.unexpected"));
  }
}

export async function cancelSubscriptionAction(id: string): Promise<ActionState> {
  const user = await billingGuard();
  if (isState(user)) return user;
  const subscriptionId = String(id).slice(0, 60);
  try {
    if (!(await cancelSubscription(subscriptionId))) return failure(msg("server.finance.notFound"));
    await recordAudit(user, "UPDATE", "Subscription", subscriptionId, "CANCELLED");
    revalidatePath("/admin/maliyye/abuneler");
    return success(msg("server.finance.cancelled"));
  } catch (error) {
    return unexpected("abunə ləğv edilmədi", error, msg("server.common.unexpected"));
  }
}

/** Endirim kodu: faiz və ya sabit məbləğ (biri), müddət, istifadə limiti, plan məhdudiyyəti. */
export async function saveDiscountCode(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await billingGuard();
  if (isState(user)) return user;
  const code = normalizeDiscountCode(formData.get("code"));
  if (!code) return failure(msg("server.finance.discount.code"), { code: msg("server.finance.discount.code") });
  const percentText = String(formData.get("percentOff") ?? "").trim();
  const percentOff = percentText ? Number(percentText) : null;
  const amountOffMinor = parsePriceInput(formData.get("amountOff"));
  const percentInvalid = percentOff != null && (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100);
  if (amountOffMinor === undefined || percentInvalid || (percentOff == null) === (amountOffMinor == null)) {
    return failure(msg("server.finance.discount.value"), { percentOff: msg("server.finance.discount.value") });
  }
  const maxText = String(formData.get("maxRedemptions") ?? "").trim();
  const maxRedemptions = maxText ? Number(maxText) : null;
  if (maxRedemptions != null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) {
    return failure(msg("server.finance.discount.value"), { maxRedemptions: msg("server.finance.discount.value") });
  }
  const validFrom = parseDay(formData.get("validFrom"), false);
  const validUntil = parseDay(formData.get("validUntil"), true);
  if (validFrom === undefined || validUntil === undefined || (validFrom && validUntil && validFrom >= validUntil)) {
    return failure(msg("server.finance.discount.dates"));
  }
  const planCodes = formData.getAll("planCodes").filter(isPlanCode);
  const data = { percentOff, amountOffMinor, maxRedemptions, validFrom, validUntil, planCodes: planCodes.length ? JSON.stringify(planCodes) : null };
  try {
    const saved = await prisma.discountCode.upsert({
      where: { code },
      create: { code, ...data },
      update: { ...data, isActive: true },
      select: { id: true },
    });
    await recordAudit(user, "UPDATE", "DiscountCode", saved.id, code);
    revalidatePath("/admin/maliyye/endirimler");
    return success(msg("server.finance.recordSaved"));
  } catch (error) {
    return unexpected("endirim kodu saxlanmadı", error, msg("server.common.unexpected"));
  }
}

export async function toggleDiscountCode(id: string): Promise<ActionState> {
  const user = await billingGuard();
  if (isState(user)) return user;
  try {
    const current = await prisma.discountCode.findUnique({ where: { id: String(id).slice(0, 60) }, select: { id: true, code: true, isActive: true } });
    if (!current) return failure(msg("server.finance.notFound"));
    await prisma.discountCode.update({ where: { id: current.id }, data: { isActive: !current.isActive } });
    await recordAudit(user, "UPDATE", "DiscountCode", current.id, `${current.code} → ${current.isActive ? "off" : "on"}`);
    revalidatePath("/admin/maliyye/endirimler");
    return success(msg("server.finance.recordSaved"));
  } catch (error) {
    return unexpected("endirim kodu dəyişmədi", error, msg("server.common.unexpected"));
  }
}

/** Tanıtım kampaniyası: paket səhifəsində müddətli mesaj (AZ məcburi, EN/RU boşdursa AZ göstərilir). */
export async function saveCampaign(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await billingGuard();
  if (isState(user)) return user;
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const message = {
    az: String(formData.get("messageAz") ?? "").trim().slice(0, 300),
    en: String(formData.get("messageEn") ?? "").trim().slice(0, 300),
    ru: String(formData.get("messageRu") ?? "").trim().slice(0, 300),
  };
  if (!name || !message.az) return failure(msg("server.finance.campaign.required"));
  const startsAt = parseDay(formData.get("startsAt"), false);
  const endsAt = parseDay(formData.get("endsAt"), true);
  if (!startsAt || !endsAt || startsAt >= endsAt) return failure(msg("server.finance.discount.dates"));
  try {
    const saved = await prisma.promoCampaign.create({ data: { name, message: JSON.stringify(message), startsAt, endsAt }, select: { id: true } });
    await recordAudit(user, "CREATE", "PromoCampaign", saved.id, name);
    revalidatePath("/admin/maliyye/kampaniyalar");
    revalidatePath("/[locale]/paketler", "page");
    return success(msg("server.finance.recordSaved"));
  } catch (error) {
    return unexpected("kampaniya saxlanmadı", error, msg("server.common.unexpected"));
  }
}

export async function toggleCampaign(id: string): Promise<ActionState> {
  const user = await billingGuard();
  if (isState(user)) return user;
  try {
    const current = await prisma.promoCampaign.findUnique({ where: { id: String(id).slice(0, 60) }, select: { id: true, name: true, isActive: true } });
    if (!current) return failure(msg("server.finance.notFound"));
    await prisma.promoCampaign.update({ where: { id: current.id }, data: { isActive: !current.isActive } });
    await recordAudit(user, "UPDATE", "PromoCampaign", current.id, `${current.name} → ${current.isActive ? "off" : "on"}`);
    revalidatePath("/admin/maliyye/kampaniyalar");
    revalidatePath("/[locale]/paketler", "page");
    return success(msg("server.finance.recordSaved"));
  } catch (error) {
    return unexpected("kampaniya dəyişmədi", error, msg("server.common.unexpected"));
  }
}
