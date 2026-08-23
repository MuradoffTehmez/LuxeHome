"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AGENCY_EMPLOYEE_STATUSES, PERMISSIONS } from "@/lib/constants";
import {
  type ActionState,
  failure,
  success,
  unexpected,
} from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { recordDomainEvent } from "@/lib/admin/events";
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

export async function approveAgencyEmployee(id: string): Promise<ActionState> {
  return reviewAgencyEmployee(id, "APPROVED");
}

export async function rejectAgencyEmployee(id: string): Promise<ActionState> {
  return reviewAgencyEmployee(id, "REJECTED");
}

/** Agentlik komandasına dəvət olunan əməkdaşı təsdiqləyir və ya rədd edir. */
async function reviewAgencyEmployee(
  id: string,
  decision: "APPROVED" | "REJECTED",
): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const employee = await prisma.agencyEmployee.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        agency: { select: { id: true, name: true } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!employee) return failure("Dəvət tapılmadı.");
    if (employee.status !== AGENCY_EMPLOYEE_STATUSES.PENDING) {
      return failure("Bu dəvət artıq nəzərdən keçirilib.");
    }

    await prisma.agencyEmployee.update({
      where: { id },
      data: {
        status: decision,
        approvedAt: decision === "APPROVED" ? new Date() : null,
      },
    });

    await recordAudit(
      actor,
      "UPDATE",
      "Agency",
      employee.agency.id,
      `${employee.user.email} — komanda dəvəti ${decision === "APPROVED" ? "təsdiqləndi" : "rədd edildi"}`,
    );
    await recordDomainEvent(
      decision === "APPROVED" ? "agency.employee_approved" : "agency.employee_rejected",
      "AgencyEmployee",
      id,
      { agencyId: employee.agency.id, userEmail: employee.user.email },
    );

    revalidatePath(LIST_PATH);
    revalidatePath("/kabinet/komanda");
    return success(
      decision === "APPROVED" ? "Əməkdaş təsdiqləndi." : "Dəvət rədd edildi.",
    );
  } catch (error) {
    return unexpected("dəvət yenilənmədi", error);
  }
}
