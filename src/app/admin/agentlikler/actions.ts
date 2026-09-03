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
import { uniqueSlug } from "@/lib/admin/slug";
import * as form from "@/lib/admin/form";

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
      select: { id: true, userId: true, name: true, isVerified: true },
    });
    if (!agency) return failure("Agentlik tapılmadı.");

    const next = !agency.isVerified;

    await prisma.agency.update({
      where: { id },
      data: { isVerified: next, verifiedAt: next ? new Date() : null },
    });
    if (next) {
      await prisma.user.update({ where: { id: agency.userId }, data: { approvedAt: new Date() } });
    }

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

/** Köhnə və ya yarımçıq agentlik hesabı üçün admin tərəfindən profil yaradır. */
export async function createAgencyProfile(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.USER_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const userId = form.text(formData, "userId");
  const name = form.text(formData, "name").trim();
  if (!userId || name.length < 2 || name.length > 160) {
    return failure("Agentlik adı 2–160 simvol arasında olmalıdır.", {
      name: "Düzgün agentlik adı yazın",
    });
  }

  try {
    const account = await prisma.user.findFirst({
      where: { id: userId, accountType: "AGENCY" },
      select: { id: true, email: true, phone: true, agency: { select: { id: true } } },
    });
    if (!account) return failure("Agentlik hesabı tapılmadı.");
    if (account.agency) return failure("Bu hesabın agentlik profili artıq mövcuddur.");

    const slug = await uniqueSlug(name, (candidate) =>
      prisma.agency.findUnique({ where: { slug: candidate }, select: { id: true } }),
    );
    const agency = await prisma.agency.create({
      data: {
        userId,
        name,
        slug,
        phone: account.phone,
        isVerified: false,
      },
      select: { id: true },
    });

    await recordAudit(actor, "CREATE", "Agency", agency.id, `${name} · ${account.email}`);
    revalidatePath(LIST_PATH);
    return success("Agentlik profili yaradıldı. İndi onu yoxlayıb təsdiqləyə bilərsiniz.");
  } catch (error) {
    return unexpected("agentlik profili yaradılmadı", error);
  }
}

export async function approveAgencyEmployee(id: string): Promise<ActionState> {
  return reviewAgencyEmployee(id, AGENCY_EMPLOYEE_STATUSES.APPROVED);
}

export async function rejectAgencyEmployee(id: string): Promise<ActionState> {
  return reviewAgencyEmployee(id, AGENCY_EMPLOYEE_STATUSES.REJECTED);
}

/** Agentlik komandasına dəvət olunan əməkdaşı təsdiqləyir və ya rədd edir. */
async function reviewAgencyEmployee(
  id: string,
  decision: typeof AGENCY_EMPLOYEE_STATUSES.APPROVED | typeof AGENCY_EMPLOYEE_STATUSES.REJECTED,
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
        approvedAt: decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? new Date() : null,
      },
    });

    await recordAudit(
      actor,
      "UPDATE",
      "Agency",
      employee.agency.id,
      `${employee.user.email} — komanda dəvəti ${decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "təsdiqləndi" : "rədd edildi"}`,
    );
    await recordDomainEvent(
      decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "agency.employee_approved" : "agency.employee_rejected",
      "AgencyEmployee",
      id,
      { agencyId: employee.agency.id, userEmail: employee.user.email },
    );

    revalidatePath(LIST_PATH);
    revalidatePath("/kabinet/komanda");
    return success(
      decision === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "Əməkdaş təsdiqləndi." : "Dəvət rədd edildi.",
    );
  } catch (error) {
    return unexpected("dəvət yenilənmədi", error);
  }
}
