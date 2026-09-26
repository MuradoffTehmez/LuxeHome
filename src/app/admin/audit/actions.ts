"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, ROLES } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";

/** Audit jurnalını yalnız Super Admin sıfırlaya bilər; sıfırlama faktının özü saxlanılır. */
export async function clearAuditLog(id: string): Promise<ActionState> {
  void id;
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  if (actor.role !== ROLES.SUPER_ADMIN) {
    return failure(msg("server.audit.auditJurnaliniYalnizSuperAdmin"));
  }

  try {
    const result = await prisma.auditLog.deleteMany();
    await recordAudit(actor, "RESET", "AuditLog", null, `${result.count} audit qeydi sıfırlandı`);
    revalidatePath("/admin/audit");
    return success(msg("server.audit.auditQeydiSifirlandi", { p0: String(result.count) }));
  } catch (error) {
    return unexpected("audit jurnalı sıfırlanmadı", error, msg("server.common.unexpected"));
  }
}
