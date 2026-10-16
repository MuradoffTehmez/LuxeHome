"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TYPES,
  PERMISSIONS,
  PROPERTY_STATUSES,
  REJECTION_REASON_MAX,
  REJECTION_REASON_MIN,
} from "@/lib/constants";
import {
  type ActionState,
  failure,
  success,
  unexpected,
} from "@/lib/admin/action-state";
import * as form from "@/lib/admin/form";
import { recordAudit } from "@/lib/admin/audit";
import { recordDomainEvent } from "@/lib/admin/events";
import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { notifyMatchingSavedSearches } from "@/lib/queries";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { propertyRetentionDays, validateStoredPropertyForPublication } from "@/lib/property-publish-validation";
import { propertyLifecycleData } from "@/lib/admin/property-input";
import { msg } from "@/lib/admin/server-message";
import { queuePropertyVectorSync } from "@/lib/semantic-search";
import { noticeListingModeration } from "@/lib/accounts/account-notices";
import type { AuthUser } from "@/lib/auth/types";

const LIST_PATH = "/admin/moderation";

export async function approveModerationProperty(id: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  try {
    const property = await prisma.property.findFirst({
      where: { id, status: PROPERTY_STATUSES.PENDING, deletedAt: null },
      select: { title: true, slug: true, publishedAt: true, closedAt: true, listingExpiresAt: true, expiredAt: true },
    });
    if (!property) return failure(msg("server.moderation.elanTapilmadiVeYaArtiq"));

    const publication = await validateStoredPropertyForPublication(id);
    if (Object.keys(publication.errors).length > 0) {
      return failure(msg("server.moderation.elanDercTelebleriniOdemir"), publication.errors);
    }

    await prisma.property.update({
      where: { id },
      data: {
        status: PROPERTY_STATUSES.PUBLISHED,
        ...propertyLifecycleData(PROPERTY_STATUSES.PUBLISHED, property, await propertyRetentionDays()),
        contentFingerprint: publication.fingerprint,
        moderationNote: null,
      },
    });

    await recordAudit(actor, "PUBLISH", "Property", id, `${property.title} — moderasiyadan təsdiqləndi`);
    await recordDomainEvent("property.published", "Property", id, { title: property.title });
    queuePropertyVectorSync([id]);
    await notifyMatchingSavedSearches(id);

    revalidatePath(LIST_PATH);
    revalidatePath("/emlaklar");
    revalidatePath(`/emlaklar/${property.slug}`);
    revalidatePublicContent("property", property.slug);
    return success(msg("server.moderation.elanTesdiqlendiVeDercOlundu"));
  } catch (error) {
    return unexpected("elan təsdiqlənmədi", error, msg("server.common.unexpected"));
  }
}

export async function rejectModerationProperty(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }

  const id = form.text(formData, "id");
  const reason = form.optionalText(formData, "reason");
  if (!id) return failure(msg("server.moderation.elanTapilmadi"));

  try {
    const result = await decideModeration(actor, id, PROPERTY_STATUSES.REJECTED, reason ?? null);
    if (result === "notFound") return failure(msg("server.moderation.elanTapilmadiVeYaArtiq"));
    if (result === "notifyFailed") return failure(msg("server.moderation.bildirisGonderilmedi"));
    return success(msg("server.moderation.elanReddEdildi"));
  } catch (error) {
    return unexpected("elan rədd edilmədi", error, msg("server.common.unexpected"));
  }
}

/**
 * «Düzəliş tələb et» (#202): elan rədd edilmir, sahibdən konkret dəyişiklik istənilir
 * (`NEEDS_INFO`). Sahib redaktə edəndə elan yenidən növbəyə (`PENDING`) düşür. Səbəb məcburidir —
 * sahib nəyi düzəltməli olduğunu bilməlidir.
 */
export async function requestModerationChanges(id: string, reason: string): Promise<ActionState> {
  let actor;
  try {
    actor = await requireAdminAction(PERMISSIONS.PROPERTY_MANAGE);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  const note = typeof reason === "string" ? reason.trim().replace(/\s+/g, " ") : "";
  if (note.length < REJECTION_REASON_MIN || note.length > REJECTION_REASON_MAX) {
    return failure(msg("server.agentlikler.reddSebebiUzunlugu", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }

  try {
    const result = await decideModeration(actor, String(id).slice(0, 40), PROPERTY_STATUSES.NEEDS_INFO, note);
    if (result === "notFound") return failure(msg("server.moderation.elanTapilmadiVeYaArtiq"));
    if (result === "notifyFailed") return failure(msg("server.moderation.bildirisGonderilmedi"));
    return success(msg("server.moderation.duzelisTelebEdildi"));
  } catch (error) {
    return unexpected("elan üçün düzəliş tələb edilmədi", error, msg("server.common.unexpected"));
  }
}

/**
 * Moderasiya qərarı: yalnız hələ `PENDING` olan elanı şərti `updateMany` ilə dəyişir — eyni anda
 * baxan iki moderatordan yalnız biri qərar yazır, bildiriş də bir dəfə gedir. Şirkət (STAFF) elanının
 * sahibinə bildiriş getmir.
 *
 * Sahibə bildiriş yazılmasa (keçici D1 xətası) qərar geri alınır və elan `PENDING`-ə qayıdır:
 * əks halda təkrar cəhd «artıq baxılıb» deyib dayanar, sahib isə elanının niyə gizləndiyini heç
 * vaxt bilməzdi. Geri alma yalnız bu sorğunun yazdığı sətrə (`updatedAt` = qərar anı) toxunur.
 */
async function decideModeration(
  actor: AuthUser,
  id: string,
  status: typeof PROPERTY_STATUSES.REJECTED | typeof PROPERTY_STATUSES.NEEDS_INFO,
  reason: string | null,
): Promise<"ok" | "notFound" | "notifyFailed"> {
  const property = await prisma.property.findFirst({
    where: { id, status: PROPERTY_STATUSES.PENDING, deletedAt: null },
    select: { title: true, author: { select: { id: true, accountType: true } } },
  });
  if (!property) return "notFound";

  const decidedAt = new Date();
  const { count } = await prisma.property.updateMany({
    where: { id, status: PROPERTY_STATUSES.PENDING, deletedAt: null },
    data: { status, moderationNote: reason, updatedAt: decidedAt },
  });
  if (count === 0) return "notFound";

  if (property.author && property.author.accountType !== ACCOUNT_TYPES.STAFF) {
    const delivered = await noticeListingModeration({
      userId: property.author.id,
      propertyId: id,
      propertyTitle: property.title,
      decision: status === PROPERTY_STATUSES.REJECTED ? "rejected" : "needs_info",
      decidedAt,
      reason,
    });
    if (!delivered) {
      await prisma.property.updateMany({
        where: { id, status, updatedAt: decidedAt },
        data: { status: PROPERTY_STATUSES.PENDING, moderationNote: null },
      });
      return "notifyFailed";
    }
  }
  await recordAudit(
    actor,
    "UPDATE",
    "Property",
    id,
    `${property.title} — ${status === PROPERTY_STATUSES.REJECTED ? "moderasiyadan rədd edildi" : "düzəliş tələb edildi"}${reason ? `: ${reason}` : ""}`,
  );
  await recordDomainEvent("property.status_changed", "Property", id, { title: property.title, status, reason });
  revalidatePath(LIST_PATH);
  return "ok";
}
