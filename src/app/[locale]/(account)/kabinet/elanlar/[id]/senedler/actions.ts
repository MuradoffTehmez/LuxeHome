"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { type ActionState, failure, success, unexpected } from "@/lib/admin/action-state";
import { AdminGuardError, requirePublicAction } from "@/lib/admin/guard";
import { localizePath } from "@/i18n/path-locale";
import type { Locale } from "@/lib/constants";
import { deletePendingDocument, uploadPropertyDocuments } from "@/lib/property-verification";

/** Sənəd yükləmə (#256, PRD 19.4) — yalnız öz elanına, fayl məxfi saxlanılır. */
export async function uploadDocumentsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.listings.documents");
  let user;
  try {
    user = await requirePublicAction("property", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  const propertyId = String(formData.get("propertyId") ?? "").slice(0, 60);
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  try {
    const result = await uploadPropertyDocuments({ userId: user.id, propertyId, kind: String(formData.get("kind") ?? ""), files });
    if (!result.ok) return failure(t(`errors.${result.reason}`));
    revalidatePath(localizePath(`/kabinet/elanlar/${propertyId}/senedler`, locale));
    return success(t("uploaded", { count: result.count }));
  } catch (error) {
    return unexpected("sənəd yüklənmədi", error, t("errors.storage"));
  }
}

export async function deleteDocumentAction(id: string): Promise<ActionState> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("account.listings.documents");
  let user;
  try {
    user = await requirePublicAction("property", locale);
  } catch (error) {
    if (error instanceof AdminGuardError) return failure(error.message);
    throw error;
  }
  if (!(await deletePendingDocument({ userId: user.id, documentId: String(id).slice(0, 40) }))) return failure(t("errors.listing"));
  revalidatePath(localizePath("/kabinet/elanlar", locale), "layout");
  return success(t("deleted"));
}
