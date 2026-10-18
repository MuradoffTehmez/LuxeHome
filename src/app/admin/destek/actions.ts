"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { closeSupportTicket, replyToSupportTicket } from "@/lib/telegram-bot/support";

/**
 * Dəstək müraciətlərinə cavab və bağlama — `lead:manage` (müraciətləri idarə edən əməkdaş). Cavab mətni yalnız
 * müraciətin öz çatına gedir; başqa istifadəçiyə ünvanlana bilməz (hədəf bazadakı müraciətdən götürülür).
 */

async function guard() {
  try {
    return await requireAdminAction(PERMISSIONS.LEAD_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return error;
    throw error;
  }
}

export async function replySupport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  const id = String(formData.get("id") ?? "");
  const result = await replyToSupportTicket(id, String(formData.get("body") ?? ""), user.id);
  if (!result.ok) {
    if (result.reason === "closed") return failure(msg("server.support.closed"));
    if (result.reason === "not-found") return failure(msg("server.support.notFound"));
    return failure(msg("server.support.invalid"), { body: msg("server.support.invalid") });
  }
  await recordAudit(user, "UPDATE", "SupportTicket", id, "Dəstək müraciətinə cavab verildi");
  revalidatePath(`/admin/destek/${id}`);
  revalidatePath("/admin/destek");
  return success(result.delivered ? msg("server.support.sent") : msg("server.support.savedNotDelivered"));
}

export async function closeSupport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await guard();
  if (user instanceof AdminGuardError) return failure(user.message);
  const id = String(formData.get("id") ?? "");
  if (!(await closeSupportTicket(id))) return failure(msg("server.support.notFound"));
  await recordAudit(user, "STATUS_CHANGE", "SupportTicket", id, "Dəstək müraciəti bağlandı");
  revalidatePath(`/admin/destek/${id}`);
  revalidatePath("/admin/destek");
  return success(msg("server.support.closedDone"));
}
