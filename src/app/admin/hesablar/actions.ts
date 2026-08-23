"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, PERMISSIONS } from "@/lib/constants";
import { revokeAllSessions } from "@/lib/auth/session";
import {
  type ActionState,
  failure,
  success,
  unexpected,
} from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";

const LIST_PATH = "/admin/hesablar";

/** İctimai hesabları (STAFF xaric) deaktiv/aktiv edir. */
export async function togglePublicAccountActive(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const account = await prisma.user.findFirst({
      where: {
        id,
        accountType: { in: [ACCOUNT_TYPES.USER, ACCOUNT_TYPES.OWNER, ACCOUNT_TYPES.AGENCY] },
      },
      select: { id: true, email: true, isActive: true },
    });
    if (!account) return failure("Hesab tapılmadı.");

    const nextActive = !account.isActive;
    await prisma.user.update({ where: { id }, data: { isActive: nextActive } });
    if (!nextActive) await revokeAllSessions(id);

    await recordAudit(actor, "UPDATE", "User", id, `${account.email} — ${nextActive ? "aktivləşdirildi" : "deaktiv edildi"}`);
    revalidatePath(LIST_PATH);
    return success(nextActive ? "Hesab aktivləşdirildi." : "Hesab deaktiv edildi.");
  } catch (error) {
    return unexpected("hesab yenilənmədi", error);
  }
}
