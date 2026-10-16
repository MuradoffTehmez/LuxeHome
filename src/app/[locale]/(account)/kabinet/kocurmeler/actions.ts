"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { recordDomainEvent } from "@/lib/admin/events";
import { noticeTransferDecision, noticeTransferRequested } from "@/lib/accounts/account-notices";
import { cancelTransferRequest, createTransferRequest, decideTransferAsSource } from "@/lib/listing-transfers";
import { localizePath } from "@/i18n/path-locale";
import { REJECTION_REASON_MAX, REJECTION_REASON_MIN, TRANSFER_REASON_MAX, TRANSFER_REASON_MIN, type Locale } from "@/lib/constants";
import type { AuthUser } from "@/lib/auth/types";

const PAGE = "/kabinet/kocurmeler";

async function guard(locale: Locale, unavailable: string): Promise<AuthUser | ActionState> {
  try {
    return await requirePublicAction("transfer", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(unavailable);
    throw error;
  }
}

const isFailure = (value: AuthUser | ActionState): value is ActionState => "status" in value;

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** B agentliyi: A agentliyinin elanı üçün köçürmə sorğusu (#212, PRD 6.4). */
export async function requestListingTransfer(_state: ActionState, formData: FormData): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await guard(locale, t("actions.actionUnavailable"));
  if (isFailure(user)) return user;

  try {
    const result = await createTransferRequest({
      requester: user,
      listingReference: text(formData.get("listing")).slice(0, 500),
      targetUserId: text(formData.get("target")).slice(0, 40) || null,
      reason: text(formData.get("reason")),
      ownerConsent: formData.get("ownerConsent") === "on",
      ownerConsentNote: text(formData.get("ownerConsentNote")) || null,
    });
    if (result.result !== "created") {
      const field = result.result === "invalidReason" ? "reason" : result.result === "noConsent" ? "ownerConsent" : result.result === "invalidTarget" ? "target" : "listing";
      const message = t(`transfers.errors.${result.result}`, { min: TRANSFER_REASON_MIN, max: TRANSFER_REASON_MAX });
      return failure(message, { [field]: message });
    }
    await recordDomainEvent("transfer.requested", "ListingTransfer", result.id, { fromAgencyId: result.fromAgencyId });
    await noticeTransferRequested({
      userId: result.fromOwnerId,
      transferId: result.id,
      propertyTitle: result.propertyTitle,
      toAgencyName: result.toAgencyName,
    });
  } catch (error) {
    return unexpected("köçürmə sorğusu yaradılmadı", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath(PAGE, locale));
  return success(t("transfers.requested"));
}

/** A agentliyinin sahibi: gələn sorğunu təsdiqləyir (admin növbəsinə) və ya səbəblə rədd edir. */
export async function decideIncomingTransfer(id: string, approve: boolean, note: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await guard(locale, t("actions.actionUnavailable"));
  if (isFailure(user)) return user;

  const reason = typeof note === "string" ? note.trim().replace(/\s+/g, " ") : "";
  if (!approve && (reason.length < REJECTION_REASON_MIN || reason.length > REJECTION_REASON_MAX)) {
    return failure(t("transfers.errors.noteLength", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
  }
  try {
    const result = await decideTransferAsSource({
      transferId: String(id).slice(0, 40),
      ownerUserId: user.id,
      approve,
      note: reason || null,
    });
    if (result.result !== "decided") {
      return failure(result.result === "stale" ? t("transfers.errors.stale") : t("transfers.errors.notFound"));
    }
    const { transfer } = result;
    await recordDomainEvent("transfer.source_decided", "ListingTransfer", transfer.id, { approved: approve });
    const recipients = new Set([transfer.requestedById, transfer.targetUserId].filter((value): value is string => Boolean(value)));
    for (const recipient of recipients) {
      await noticeTransferDecision({
        userId: recipient,
        transferId: transfer.id,
        stage: approve ? "sourceApproved" : "rejected",
        propertyTitle: transfer.property.title,
        note: reason || null,
      });
    }
  } catch (error) {
    return unexpected("köçürmə qərarı yazılmadı", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath(PAGE, locale));
  revalidatePath("/admin/kocurmeler");
  return success(approve ? t("transfers.sourceApproved") : t("transfers.sourceRejected"));
}

/** Sorğunu yaradan və ya B agentliyinin sahibi açıq sorğunu geri çəkir. */
export async function cancelListingTransfer(id: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account");
  const user = await guard(locale, t("actions.actionUnavailable"));
  if (isFailure(user)) return user;
  try {
    const cancelled = await cancelTransferRequest({ transferId: String(id).slice(0, 40), userId: user.id });
    if (!cancelled) return failure(t("transfers.errors.stale"));
    await recordDomainEvent("transfer.cancelled", "ListingTransfer", String(id).slice(0, 40));
  } catch (error) {
    return unexpected("köçürmə sorğusu ləğv edilmədi", error, t("actions.unexpected"));
  }
  revalidatePath(localizePath(PAGE, locale));
  revalidatePath("/admin/kocurmeler");
  return success(t("transfers.cancelled"));
}
