"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, AGENCY_EMPLOYEE_STATUSES, MAX_AGENCY_EMPLOYEES } from "@/lib/constants";
import { requireAccount } from "@/lib/auth/guard";
import { recordDomainEvent } from "@/lib/admin/events";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";

/**
 * Agentlik komandası — sahib (owner) idarə edir.
 *
 * Dəvət yalnız artıq qeydiyyatdan keçmiş hesaba göndərilir: sıfırdan hesab yaratmaq
 * bu axından kənardır, çünki dəvət alan şəxs öz parolunu təyin etməli olacaqdı.
 * PRD-dəki "admin approval" LuxeHome heyəti tərəfindən `/admin/agentlikler`-də edilir.
 */

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-poçt düzgün deyil"),
});

async function requireAgencyOwner() {
  const user = await requireAccount();
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) {
    throw new Error("Yalnız agentlik hesabları komanda idarə edə bilər.");
  }
  const agency = await prisma.agency.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  if (!agency) {
    throw new Error("Əvvəlcə profildə agentlik məlumatlarını doldurun.");
  }
  return { user, agency };
}

export async function inviteAgencyEmployee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let owner;
  try {
    owner = await requireAgencyOwner();
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Əməliyyat mümkün deyil.");
  }

  const parsed = inviteSchema.safeParse({ email: form.text(formData, "email") });
  if (!parsed.success) return invalid(parsed.error);

  try {
    const activeCount = await prisma.agencyEmployee.count({
      where: {
        agencyId: owner.agency.id,
        status: { in: [AGENCY_EMPLOYEE_STATUSES.PENDING, AGENCY_EMPLOYEE_STATUSES.APPROVED] },
      },
    });
    if (activeCount >= MAX_AGENCY_EMPLOYEES) {
      return failure(`Maksimum ${MAX_AGENCY_EMPLOYEES} əməkdaş dəvət oluna bilər.`);
    }

    const invitee = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, accountType: true },
    });
    if (!invitee) {
      return failure("Bu e-poçt ilə qeydiyyatlı hesab tapılmadı.", { email: "Hesab tapılmadı" });
    }
    if (invitee.id === owner.user.id) {
      return failure("Özünüzü dəvət edə bilməzsiniz.", { email: "Özünüzü seçmisiniz" });
    }

    const existing = await prisma.agencyEmployee.findUnique({
      where: { agencyId_userId: { agencyId: owner.agency.id, userId: invitee.id } },
      select: { id: true, status: true },
    });
    if (existing && existing.status !== AGENCY_EMPLOYEE_STATUSES.REJECTED) {
      return failure("Bu istifadəçi artıq dəvət olunub.", { email: "Artıq dəvət olunub" });
    }

    const employee = existing
      ? await prisma.agencyEmployee.update({
          where: { id: existing.id },
          data: { status: AGENCY_EMPLOYEE_STATUSES.PENDING, invitedAt: new Date(), approvedAt: null },
        })
      : await prisma.agencyEmployee.create({
          data: { agencyId: owner.agency.id, userId: invitee.id },
        });

    await recordDomainEvent("agency.employee_invited", "AgencyEmployee", employee.id, {
      agencyId: owner.agency.id,
      userEmail: parsed.data.email,
    });

    revalidatePath("/kabinet/komanda");
    return success("Dəvət göndərildi. LuxeHome heyəti təsdiqləndikdən sonra əməkdaş aktiv olacaq.");
  } catch (error) {
    return unexpected("dəvət göndərilmədi", error);
  }
}

export async function removeAgencyEmployee(id: string): Promise<ActionState> {
  let owner;
  try {
    owner = await requireAgencyOwner();
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Əməliyyat mümkün deyil.");
  }

  try {
    const employee = await prisma.agencyEmployee.findUnique({
      where: { id },
      select: { id: true, agencyId: true, userId: true },
    });
    if (!employee || employee.agencyId !== owner.agency.id) {
      return failure("Əməkdaş tapılmadı.");
    }

    await prisma.agencyEmployee.delete({ where: { id } });
    await recordDomainEvent("agency.employee_removed", "AgencyEmployee", id, {
      agencyId: owner.agency.id,
    });

    revalidatePath("/kabinet/komanda");
    return success("Əməkdaş komandadan çıxarıldı.");
  } catch (error) {
    return unexpected("əməkdaş çıxarılmadı", error);
  }
}
