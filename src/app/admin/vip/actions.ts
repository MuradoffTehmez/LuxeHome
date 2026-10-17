"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth/types";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { approveVip, extendVip, grantVip, rejectVip, revokeVip } from "@/lib/vip";

/**
 * VIP idarəetməsi (#248, PRD 14.3/14.4). Hər action öz guard-ını çağırır (`property:manage`);
 * yaratma (təsdiq/birbaşa verilmə), uzatma və ləğv audit jurnalına yazılır.
 */

async function guard(): Promise<AuthUser | ActionState> {
  try {
    return await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}
const isState = (value: unknown): value is ActionState => typeof value === "object" && value !== null && "status" in value;

function refresh() {
  revalidatePath("/admin/vip");
  revalidatePublicContent("property");
}

export async function approveVipAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const requestId = String(formData.get("requestId") ?? "").slice(0, 60);
  const days = Number(formData.get("days"));
  try {
    const result = await approveVip({ actorId: user.id, requestId, days, note: String(formData.get("note") ?? "") });
    if (!result.ok) return failure(msg(`server.vip.${result.reason}`));
    await recordAudit(user, "UPDATE", "VipRequest", requestId, `VIP təsdiq · ${result.title} · ${days} gün`);
    refresh();
    return success(msg("server.vip.approved"));
  } catch (error) {
    return unexpected("VIP təsdiqlənmədi", error, msg("server.common.unexpected"));
  }
}

export async function rejectVipAction(id: string, reason: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const requestId = String(id).slice(0, 60);
  try {
    const result = await rejectVip({ actorId: user.id, requestId, note: reason });
    if (!result.ok) return failure(msg(`server.vip.${result.reason}`));
    await recordAudit(user, "UPDATE", "VipRequest", requestId, `VIP rədd · ${result.title}`);
    refresh();
    return success(msg("server.vip.rejected"));
  } catch (error) {
    return unexpected("VIP rədd edilmədi", error, msg("server.common.unexpected"));
  }
}

export async function extendVipAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const requestId = String(formData.get("requestId") ?? "").slice(0, 60);
  const days = Number(formData.get("days"));
  try {
    const result = await extendVip({ actorId: user.id, requestId, days });
    if (!result.ok) return failure(msg(`server.vip.${result.reason}`));
    await recordAudit(user, "UPDATE", "VipRequest", requestId, `VIP uzadıldı · ${result.title} · +${days} gün`);
    refresh();
    return success(msg("server.vip.extended"));
  } catch (error) {
    return unexpected("VIP uzadılmadı", error, msg("server.common.unexpected"));
  }
}

export async function revokeVipAction(id: string, reason: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const requestId = String(id).slice(0, 60);
  try {
    const result = await revokeVip({ actorId: user.id, requestId, note: reason });
    if (!result.ok) return failure(msg(`server.vip.${result.reason}`));
    await recordAudit(user, "UPDATE", "VipRequest", requestId, `VIP ləğv · ${result.title}`);
    refresh();
    return success(msg("server.vip.revoked"));
  } catch (error) {
    return unexpected("VIP ləğv edilmədi", error, msg("server.common.unexpected"));
  }
}

/** Sorğusuz VIP: elan linki və ya slug ilə. */
export async function grantVipAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const raw = String(formData.get("listing") ?? "").trim().slice(0, 300);
  const slug = raw.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? "";
  const days = Number(formData.get("days"));
  try {
    const property = slug ? await prisma.property.findFirst({ where: { OR: [{ slug }, { id: slug }], deletedAt: null }, select: { id: true } }) : null;
    if (!property) return failure(msg("server.vip.listing"), { listing: msg("server.vip.listing") });
    const result = await grantVip({ actorId: user.id, propertyId: property.id, days, note: String(formData.get("note") ?? "") });
    if (!result.ok) return failure(msg(`server.vip.${result.reason}`));
    await recordAudit(user, "CREATE", "VipRequest", result.requestId ?? property.id, `VIP verildi · ${result.title} · ${days} gün`);
    refresh();
    return success(msg("server.vip.approved"));
  } catch (error) {
    return unexpected("VIP verilmədi", error, msg("server.common.unexpected"));
  }
}
