"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS, REJECTION_REASON_MAX, REJECTION_REASON_MIN } from "@/lib/constants";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { recordAudit } from "@/lib/admin/audit";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { msg } from "@/lib/admin/server-message";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { queuePropertyVectorSync } from "@/lib/semantic-search";
import { noticeAppealDecision } from "@/lib/accounts/account-notices";
import { decideListingAppeal } from "@/lib/listing-appeals";
import type { AuthUser } from "@/lib/auth/types";

/**
 * Etirazın həlli (#206, PRD 20.4). Qəbulda qeyd istəyə bağlıdır, rəddə məcburidir — sahib
 * səbəbi bilməlidir. Qərarı verən moderator öz qərarına baxa bilməz (`decideListingAppeal`).
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

export async function acceptListingAppeal(id: string, note: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const text = normalize(note);
  if (text && (text.length < REJECTION_REASON_MIN || text.length > REJECTION_REASON_MAX)) {
    return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }
  return decide(actor, id, true, text || null);
}

export async function rejectListingAppeal(id: string, note: string): Promise<ActionState> {
  const actor = await guard();
  if (isFailure(actor)) return actor;
  const text = normalize(note);
  if (text.length < REJECTION_REASON_MIN || text.length > REJECTION_REASON_MAX) {
    return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }
  return decide(actor, id, false, text);
}

async function decide(actor: AuthUser, id: string, accept: boolean, note: string | null): Promise<ActionState> {
  try {
    const decidedAt = new Date();
    const result = await decideListingAppeal({ appealId: String(id).slice(0, 40), reviewerId: actor.id, accept, note, now: decidedAt });
    if (result.result !== "decided") {
      return failure(
        result.result === "sameReviewer"
          ? msg("server.appeals.ozQerari")
          : result.result === "stale"
            ? msg("server.appeals.kohnelib")
            : msg("server.appeals.tapilmadi"),
      );
    }

    const { property } = result;
    if (property.authorId) {
      await noticeAppealDecision({
        userId: property.authorId,
        propertyId: property.id,
        propertyTitle: property.title,
        accepted: accept,
        decidedAt,
        note,
      });
    }
    await recordAudit(
      actor,
      "UPDATE",
      "Property",
      property.id,
      `${property.title} — etiraz ${accept ? `qəbul edildi (${result.restoredStatus})` : "rədd edildi"}${note ? `: ${note}` : ""}`,
    );
    revalidatePath("/admin/etirazlar");
    revalidatePath("/admin/moderation");
    if (accept) {
      queuePropertyVectorSync([property.id]);
      revalidatePublicContent("property", property.slug);
    }
    return success(accept ? msg("server.appeals.qebulEdildi") : msg("server.appeals.reddEdildi"));
  } catch (error) {
    return unexpected("etiraz həll edilmədi", error, msg("server.common.unexpected"));
  }
}
