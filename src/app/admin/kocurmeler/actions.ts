"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS, REJECTION_REASON_MAX, REJECTION_REASON_MIN } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { queuePropertyVectorSync } from "@/lib/semantic-search";
import { noticeTransferDecision } from "@/lib/accounts/account-notices";
import { decideTransferAsAdmin } from "@/lib/listing-transfers";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Köçürmənin son qərarı (#212, PRD 6.4): admin elanın hüquqi və müqavilə statusunu yoxlayıb
 * təsdiqləyir və ya səbəblə rədd edir. Təsdiqdə qeyd istəyə bağlıdır, rəddə məcburidir.
 */

async function guard(): Promise<AuthUser | ActionState> {
  try {
    return await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
}

const isFailure = (value: AuthUser | ActionState): value is ActionState => "status" in value;

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export async function approveListingTransfer(id: string, note: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const text = normalize(note);
  if (text && (text.length < REJECTION_REASON_MIN || text.length > REJECTION_REASON_MAX)) {
    return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }
  return decide(actor, id, true, text || null);
}

export async function rejectListingTransfer(id: string, note: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const text = normalize(note);
  if (text.length < REJECTION_REASON_MIN || text.length > REJECTION_REASON_MAX) {
    return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }
  return decide(actor, id, false, text);
}

async function decide(actor: AuthUser, id: string, approve: boolean, note: string | null): Promise<ActionState> {
  try {
    const result = await decideTransferAsAdmin({ transferId: String(id).slice(0, 40), adminId: actor.id, approve, note });
    if (result.result !== "completed" && result.result !== "rejected") {
      const key = result.result === "targetGone"
        ? "server.transfers.targetGone"
        : result.result === "listingChanged"
          ? "server.transfers.listingChanged"
          : result.result === "stale"
            ? "server.transfers.stale"
            : "server.transfers.notFound";
      revalidatePath("/admin/kocurmeler");
      return failure(msg(key));
    }

    const { transfer } = result;
    const title = transfer.property.title;
    if (result.result === "completed") {
      const recipients = new Set([transfer.requestedById, transfer.targetUserId].filter((value): value is string => Boolean(value)));
      for (const recipient of recipients) {
        await noticeTransferDecision({ userId: recipient, transferId: transfer.id, stage: "completed", propertyTitle: title });
      }
      await noticeTransferDecision({
        userId: transfer.fromAgency.userId,
        transferId: transfer.id,
        stage: "moved",
        propertyTitle: title,
        agencyName: transfer.toAgency.name,
      });
      queuePropertyVectorSync([transfer.propertyId]);
      revalidatePublicContent("property", transfer.property.slug);
    } else {
      const recipients = new Set([transfer.requestedById, transfer.targetUserId, transfer.fromAgency.userId].filter((value): value is string => Boolean(value)));
      for (const recipient of recipients) {
        await noticeTransferDecision({ userId: recipient, transferId: transfer.id, stage: "rejected", propertyTitle: title, note });
      }
    }
    await recordAudit(
      actor,
      "UPDATE",
      "Property",
      transfer.propertyId,
      `${title} — köçürmə ${approve ? `təsdiqləndi: ${transfer.fromAgency.name} → ${transfer.toAgency.name}` : "rədd edildi"}${note ? `: ${note}` : ""}`,
    );
    revalidatePath("/admin/kocurmeler");
    return success(approve ? msg("server.transfers.completed") : msg("server.transfers.rejected"));
  } catch (error) {
    return unexpected("köçürmə qərarı yazılmadı", error, msg("server.common.unexpected"));
  }
}
