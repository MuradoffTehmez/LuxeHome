"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { revokeSession } from "@/lib/auth/session";
import { msg } from "@/lib/admin/server-message";

const LIST_PATH = "/admin/security";

export async function revokeAdminSession(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id },
      select: { id: true, user: { select: { email: true } } },
    });
    if (!session) return failure(msg("server.security.sessiyaTapilmadi"));

    await revokeSession(id);
    await recordAudit(actor, "SESSION_REVOKE", "User", session.id, `${session.user.email} sessiyası bağlandı`);

    revalidatePath(LIST_PATH);
    return success(msg("server.security.sessiyaBaglandi"));
  } catch (error) {
    return unexpected("sessiya bağlanmadı", error, msg("server.common.unexpected"));
  }
}

export async function unlockUserAccount(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!user) return failure(msg("server.security.istifadeciTapilmadi"));

    await prisma.user.update({
      where: { id },
      data: { lockedUntil: null, failedAttempts: 0 },
    });
    await recordAudit(actor, "UPDATE", "User", id, `${user.email} — kilidi açıldı`);

    revalidatePath(LIST_PATH);
    return success(msg("server.security.hesabinKilidiAcildi"));
  } catch (error) {
    return unexpected("kilid açılmadı", error, msg("server.common.unexpected"));
  }
}
