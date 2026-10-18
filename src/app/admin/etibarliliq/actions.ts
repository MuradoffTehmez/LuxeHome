"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { hasPermission } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/types";
import { applyRestriction, decideAppeal, liftRestriction, refreshAccountTrust } from "@/lib/account-trust";

/**
 * Hesab tədbirləri (#258, PRD 20.3/20.4) — `property:manage`; bloklama yalnız `user:manage`.
 * Hər tədbir, götürülmə və etiraz qərarı əsaslandırılır və audit jurnalına yazılır.
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

export async function applyRestrictionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const kind = String(formData.get("kind") ?? "");
  if (kind === "BLOCK" && !hasPermission(user.role, PERMISSIONS.USER_MANAGE)) return failure(msg("server.trust.blockPermission"));
  const until = String(formData.get("endsAt") ?? "").trim();
  const endsAt = /^\d{4}-\d{2}-\d{2}$/.test(until) ? new Date(`${until}T23:59:59+04:00`) : null;
  const userId = String(formData.get("userId") ?? "").slice(0, 60);
  try {
    const result = await applyRestriction({ staffId: user.id, userId, kind, reason: String(formData.get("reason") ?? ""), endsAt });
    if (!result.ok) return failure(msg(`server.trust.${result.reason}`));
    await recordAudit(user, "CREATE", "AccountRestriction", result.id, `${kind} · ${userId}`);
    revalidatePath("/admin/etibarliliq");
    return success(msg("server.trust.applied"));
  } catch (error) {
    return unexpected("tədbir tətbiq olunmadı", error, msg("server.common.unexpected"));
  }
}

export async function liftRestrictionAction(id: string, reason: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  try {
    const result = await liftRestriction({ staffId: user.id, restrictionId: String(id).slice(0, 60), reason });
    if (!result.ok) return failure(msg(`server.trust.${result.reason ?? "notFound"}`));
    await recordAudit(user, "UPDATE", "AccountRestriction", id, "götürüldü");
    revalidatePath("/admin/etibarliliq");
    return success(msg("server.trust.lifted"));
  } catch (error) {
    return unexpected("tədbir götürülmədi", error, msg("server.common.unexpected"));
  }
}

export async function acceptAppealAction(id: string, note: string): Promise<ActionState> {
  return decide(id, note, true);
}

export async function rejectAppealAction(id: string, note: string): Promise<ActionState> {
  return decide(id, note, false);
}

async function decide(id: string, note: string, accept: boolean): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  try {
    const result = await decideAppeal({ staffId: user.id, appealId: String(id).slice(0, 60), accept, note });
    if (!result.ok) return failure(msg(`server.trust.${result.reason}`));
    await recordAudit(user, "UPDATE", "AccountRestriction", id, accept ? "etiraz qəbul" : "etiraz rədd");
    revalidatePath("/admin/etibarliliq");
    return success(msg(accept ? "server.trust.appealAccepted" : "server.trust.appealRejected"));
  } catch (error) {
    return unexpected("etiraz həll olunmadı", error, msg("server.common.unexpected"));
  }
}

export async function recalculateTrustAction(userId: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  await refreshAccountTrust(String(userId).slice(0, 60));
  revalidatePath("/admin/etibarliliq");
  return success(msg("server.trust.recalculated"));
}
