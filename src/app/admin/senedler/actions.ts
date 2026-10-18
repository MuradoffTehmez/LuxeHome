"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import type { AuthUser } from "@/lib/auth/types";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { decideDocuments, setDataVerified } from "@/lib/property-verification";

/** Sənəd yoxlaması (#256, PRD Modul 17) — `property:manage`; hər qərar audit olunur. */

async function guard(): Promise<AuthUser | ActionState> {
  try {
    return await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}
const isState = (value: unknown): value is ActionState => typeof value === "object" && value !== null && "status" in value;

function refresh() {
  revalidatePath("/admin/senedler");
  revalidatePublicContent("property");
}

export async function approveDocuments(propertyId: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  try {
    const result = await decideDocuments({ staffId: user.id, propertyId: String(propertyId).slice(0, 60), verified: true });
    if (!result.ok) return failure(msg(`server.verification.${result.reason}`));
    await recordAudit(user, "UPDATE", "Property", propertyId, "Sənədlər yoxlanılıb");
    refresh();
    return success(msg("server.verification.approved"));
  } catch (error) {
    return unexpected("sənədlər təsdiqlənmədi", error, msg("server.common.unexpected"));
  }
}

export async function rejectDocuments(propertyId: string, reason: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  try {
    const result = await decideDocuments({ staffId: user.id, propertyId: String(propertyId).slice(0, 60), verified: false, note: reason });
    if (!result.ok) return failure(msg(`server.verification.${result.reason}`));
    await recordAudit(user, "UPDATE", "Property", propertyId, "Sənədlər rədd edildi");
    refresh();
    return success(msg("server.verification.rejected"));
  } catch (error) {
    return unexpected("sənədlər rədd edilmədi", error, msg("server.common.unexpected"));
  }
}

export async function toggleDataVerified(propertyId: string): Promise<ActionState> {
  const user = await guard();
  if (isState(user)) return user;
  const id = String(propertyId).slice(0, 60);
  try {
    const { prisma } = await import("@/lib/prisma");
    const current = await prisma.property.findUnique({ where: { id }, select: { dataVerifiedAt: true } });
    if (!current) return failure(msg("server.verification.notFound"));
    await setDataVerified({ staffId: user.id, propertyId: id, verified: !current.dataVerifiedAt });
    await recordAudit(user, "UPDATE", "Property", id, current.dataVerifiedAt ? "Məlumat yoxlaması götürüldü" : "Məlumatlar yoxlanılıb");
    refresh();
    return success(msg("server.verification.dataToggled"));
  } catch (error) {
    return unexpected("məlumat yoxlaması dəyişmədi", error, msg("server.common.unexpected"));
  }
}
