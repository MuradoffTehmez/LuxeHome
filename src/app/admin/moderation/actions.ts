"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, PROPERTY_STATUSES } from "@/lib/constants";
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
      select: { title: true, slug: true, publishedAt: true, closedAt: true },
    });
    if (!property) return failure("Elan tapılmadı və ya artıq nəzərdən keçirilib.");

    const publication = await validateStoredPropertyForPublication(id);
    if (Object.keys(publication.errors).length > 0) {
      return failure("Elan dərc tələblərini ödəmir.", publication.errors);
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
    await notifyMatchingSavedSearches(id);

    revalidatePath(LIST_PATH);
    revalidatePath("/emlaklar");
    revalidatePath(`/emlaklar/${property.slug}`);
    revalidatePublicContent("property", property.slug);
    return success("Elan təsdiqləndi və dərc olundu.");
  } catch (error) {
    return unexpected("elan təsdiqlənmədi", error);
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
  if (!id) return failure("Elan tapılmadı.");

  try {
    const property = await prisma.property.findFirst({
      where: { id, status: PROPERTY_STATUSES.PENDING, deletedAt: null },
      select: { title: true },
    });
    if (!property) return failure("Elan tapılmadı və ya artıq nəzərdən keçirilib.");

    await prisma.property.update({
      where: { id },
      data: { status: PROPERTY_STATUSES.DRAFT, moderationNote: reason },
    });

    await recordAudit(actor, "UPDATE", "Property", id, `${property.title} — moderasiyadan rədd edildi`);
    await recordDomainEvent("property.status_changed", "Property", id, {
      title: property.title,
      status: PROPERTY_STATUSES.DRAFT,
      reason,
    });

    revalidatePath(LIST_PATH);
    return success("Elan rədd edildi və qaralamaya qaytarıldı.");
  } catch (error) {
    return unexpected("elan rədd edilmədi", error);
  }
}
