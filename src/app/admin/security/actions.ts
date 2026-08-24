"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { revokeSession } from "@/lib/auth/session";

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
    if (!session) return failure("Sessiya tapılmadı.");

    await revokeSession(id);
    await recordAudit(actor, "SESSION_REVOKE", "User", session.id, `${session.user.email} sessiyası bağlandı`);

    revalidatePath(LIST_PATH);
    return success("Sessiya bağlandı.");
  } catch (error) {
    return unexpected("sessiya bağlanmadı", error);
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
    if (!user) return failure("İstifadəçi tapılmadı.");

    await prisma.user.update({
      where: { id },
      data: { lockedUntil: null, failedAttempts: 0 },
    });
    await recordAudit(actor, "UPDATE", "User", id, `${user.email} — kilidi açıldı`);

    revalidatePath(LIST_PATH);
    return success("Hesabın kilidi açıldı.");
  } catch (error) {
    return unexpected("kilid açılmadı", error);
  }
}
