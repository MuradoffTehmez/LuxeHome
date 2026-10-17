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
import { approvePromotion, grantPromotion, rejectPromotion, revokePromotion } from "@/lib/promotion";

/**
 * İrəli çəkmə idarəetməsi (#250, PRD 15.4) — ödənişsiz, administrator idarə edir. Hər action öz guard-ını
 * çağırır (`property:manage`); başlatma, rədd və dayandırma audit jurnalına yazılır.
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
  revalidatePath("/admin/irelicekme");
  revalidatePublicContent("property");
}

export async function approvePromotionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const requestId = String(formData.get("requestId") ?? "").slice(0, 60);
  const days = Number(formData.get("days"));
  try {
    const result = await approvePromotion({ actorId: user.id, campaignId: requestId, days, note: String(formData.get("note") ?? "") });
    if (!result.ok) return failure(msg(`server.promotion.${result.reason}`));
    await recordAudit(user, "UPDATE", "PromotionCampaign", requestId, `İrəli çəkmə başladı · ${result.title} · ${days} gün`);
    refresh();
    return success(msg("server.promotion.approved"));
  } catch (error) {
    return unexpected("irəli çəkmə başlamadı", error, msg("server.common.unexpected"));
  }
}

export async function rejectPromotionAction(id: string, reason: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const requestId = String(id).slice(0, 60);
  try {
    const result = await rejectPromotion({ actorId: user.id, campaignId: requestId, note: reason });
    if (!result.ok) return failure(msg(`server.promotion.${result.reason}`));
    await recordAudit(user, "UPDATE", "PromotionCampaign", requestId, `İrəli çəkmə rədd · ${result.title}`);
    refresh();
    return success(msg("server.promotion.rejected"));
  } catch (error) {
    return unexpected("irəli çəkmə rədd edilmədi", error, msg("server.common.unexpected"));
  }
}

export async function revokePromotionAction(id: string, reason: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const requestId = String(id).slice(0, 60);
  try {
    const result = await revokePromotion({ actorId: user.id, campaignId: requestId, note: reason });
    if (!result.ok) return failure(msg(`server.promotion.${result.reason}`));
    await recordAudit(user, "UPDATE", "PromotionCampaign", requestId, `İrəli çəkmə dayandırıldı · ${result.title}`);
    refresh();
    return success(msg("server.promotion.revoked"));
  } catch (error) {
    return unexpected("irəli çəkmə dayandırılmadı", error, msg("server.common.unexpected"));
  }
}

/** Sorğusuz irəli çəkmə: elan linki və ya slug ilə. */
export async function grantPromotionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const raw = String(formData.get("listing") ?? "").trim().slice(0, 300);
  const slug = raw.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? "";
  const days = Number(formData.get("days"));
  try {
    const property = slug ? await prisma.property.findFirst({ where: { OR: [{ slug }, { id: slug }], deletedAt: null }, select: { id: true } }) : null;
    if (!property) return failure(msg("server.promotion.listing"), { listing: msg("server.promotion.listing") });
    const result = await grantPromotion({ actorId: user.id, propertyId: property.id, days, note: String(formData.get("note") ?? "") });
    if (!result.ok) return failure(msg(result.activeAlready ? "server.promotion.active" : `server.promotion.${result.reason}`));
    await recordAudit(user, "CREATE", "PromotionCampaign", result.campaignId ?? property.id, `İrəli çəkmə verildi · ${result.title} · ${days} gün`);
    refresh();
    return success(msg("server.promotion.approved"));
  } catch (error) {
    return unexpected("irəli çəkmə verilmədi", error, msg("server.common.unexpected"));
  }
}
