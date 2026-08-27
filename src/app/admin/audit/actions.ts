"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, ROLES } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";

/** Audit jurnalını yalnız Super Admin sıfırlaya bilər; sıfırlama faktının özü saxlanılır. */
export async function clearAuditLog(_id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.SETTINGS_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  if (actor.role !== ROLES.SUPER_ADMIN) {
    return failure("Audit jurnalını yalnız Super Admin sıfırlaya bilər.");
  }

  try {
    const result = await prisma.auditLog.deleteMany();
    await recordAudit(actor, "RESET", "AuditLog", null, `${result.count} audit qeydi sıfırlandı`);
    revalidatePath("/admin/audit");
    return success(`${result.count} audit qeydi sıfırlandı.`);
  } catch (error) {
    return unexpected("audit jurnalı sıfırlanmadı", error);
  }
}
