"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, invalid, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { leadUpdateSchema } from "@/lib/admin/schemas";
import * as form from "@/lib/admin/form";

/**
 * Müraciətlərin idarəsi.
 *
 * Müraciət mətni müştəri tərəfindən yazılır və heç vaxt redaktə edilmir — dəyişən
 * yalnız status, daxili qeyd və məsul şəxsdir. Orijinal mətnin toxunulmaz qalması
 * mübahisəli halda vacibdir.
 */

const LIST_PATH = "/admin/muracietler";

export async function updateLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.LEAD_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  if (!id) return failure("Müraciət tapılmadı.");

  const parsed = leadUpdateSchema.safeParse({
    status: form.text(formData, "status"),
    adminNote: form.optionalText(formData, "adminNote"),
    assigneeId: form.optionalText(formData, "assigneeId"),
  });
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (parsed.data.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: parsed.data.assigneeId, isActive: true },
        select: { id: true },
      });
      if (!assignee) {
        return failure("Seçilmiş əməkdaş tapılmadı.", { assigneeId: "Əməkdaş aktiv deyil" });
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: parsed.data,
      select: { name: true, status: true },
    });

    await recordAudit(user, "UPDATE", "Lead", id, `${lead.name} → ${lead.status}`);
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return success("Müraciət yeniləndi.");
  } catch (error) {
    return unexpected("müraciət yenilənmədi", error);
  }
}

/**
 * Müraciətin silinməsi.
 *
 * `Lead` modelində `deletedAt` sahəsi yoxdur, ona görə silmə həqiqi silmədir.
 * Audit jurnalında ad və telefon qalır ki, silinmə faktı izlənə bilsin.
 */
export async function deleteLead(id: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.LEAD_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const lead = await prisma.lead.delete({
      where: { id },
      select: { name: true, phone: true },
    });

    await recordAudit(user, "DELETE", "Lead", id, `${lead.name} · ${lead.phone}`);
    revalidatePath(LIST_PATH);
    return success("Müraciət silindi.");
  } catch (error) {
    return unexpected("müraciət silinmədi", error);
  }
}

/** Siyahıdan sürətli status dəyişməsi. */
export async function setLeadStatus(id: string, status: string): Promise<ActionState> {
  let user;
  try {
    user = await requireAdminAction(PERMISSIONS.LEAD_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const parsed = leadUpdateSchema.pick({ status: true }).safeParse({ status });
  if (!parsed.success) return failure("Status dəyəri düzgün deyil.");

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { name: true },
    });

    await recordAudit(user, "UPDATE", "Lead", id, `${lead.name} → ${status}`);
    revalidatePath(LIST_PATH);
    return success("Status yeniləndi.");
  } catch (error) {
    return unexpected("status dəyişmədi", error);
  }
}
