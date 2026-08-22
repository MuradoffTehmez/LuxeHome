"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import {
  type ActionState,
  failure,
  success,
  unexpected,
} from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";

const LIST_PATH = "/admin/agentlikler";

/**
 * Agentlik təsdiqi açar-bağlayır.
 *
 * `Agency.isVerified` ictimai `/agentlikler` səhifəsində göstərilmə şərtidir —
 * təsdiqlənməyən agentlik saytda görünmür.
 */
export async function toggleAgencyVerification(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { id: true, name: true, isVerified: true },
    });
    if (!agency) return failure("Agentlik tapılmadı.");

    const next = !agency.isVerified;

    await prisma.agency.update({
      where: { id },
      data: { isVerified: next, verifiedAt: next ? new Date() : null },
    });

    await recordAudit(
      actor,
      "UPDATE",
      "Agency",
      id,
      `${agency.name} — ${next ? "təsdiqləndi" : "təsdiqi ləğv edildi"}`,
    );

    revalidatePath(LIST_PATH);
    revalidatePath("/agentlikler");
    return success(next ? "Agentlik təsdiqləndi." : "Agentliyin təsdiqi ləğv edildi.");
  } catch (error) {
    return unexpected("agentlik yenilənmədi", error);
  }
}
