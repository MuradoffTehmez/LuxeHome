"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { PROPERTY_DOCUMENT_MAX_BYTES, PROPERTY_DOCUMENT_MAX_FILES, PROPERTY_DOCUMENT_UPLOAD_BUDGET } from "@/lib/constants";
import { prepareImageForUpload } from "@/components/admin/image-prepare";
import { uploadDocumentsAction } from "./actions";

/**
 * Sənəd şəkli yükləmə (#256): brauzer hər şəkli WebP-yə kiçildir; fayl başına hədd seçilmiş fayl sayına bölünmüş
 * ümumi büdcədir (`PROPERTY_DOCUMENT_UPLOAD_BUDGET`, ən çox `PROPERTY_DOCUMENT_MAX_BYTES`) — action gövdəsi 1 MB-ı keçməsin.
 * Şəxsi nömrələri (FİN, şəxsiyyət vəsiqəsi) örtmək tövsiyə olunur — lazımsız şəxsi məlumat toplanmır.
 */
export function DocumentUploadForm({ propertyId, kinds }: { propertyId: string; kinds: { value: string; label: string }[] }) {
  const t = useTranslations("account.listings.documents");
  const [state, action, pending] = useActionState(uploadDocumentsAction, IDLE_STATE);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setError(null);
    const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length === 0) return setError(t("errors.empty"));
    if (files.length > PROPERTY_DOCUMENT_MAX_FILES) return setError(t("errors.limit"));
    setPreparing(true);
    try {
      const perFile = Math.min(PROPERTY_DOCUMENT_MAX_BYTES, Math.floor(PROPERTY_DOCUMENT_UPLOAD_BUDGET / files.length));
      const prepared = await Promise.all(files.map((file) => prepareImageForUpload(file, perFile, { maxDimension: 1800 })));
      formData.delete("files");
      for (const file of prepared) formData.append("files", file);
    } catch {
      setPreparing(false);
      return setError(t("errors.unsupported"));
    }
    setPreparing(false);
    action(formData);
  }

  const failed = Boolean(error) || state.status === "error";
  const message = error ?? (state.status !== "idle" ? state.message : null);
  return (
    <form action={submit} className="flex flex-col gap-4">
      <input type="hidden" name="propertyId" value={propertyId} />
      <Select name="kind" label={t("kind")} options={kinds} required />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("files", { count: PROPERTY_DOCUMENT_MAX_FILES })}
        <input type="file" name="files" accept="image/jpeg,image/png,image/webp" multiple className="text-sm" />
      </label>
      <p className="text-xs text-ink-muted">{t("privacyHint")}</p>
      {message && <p role={failed ? "alert" : "status"} className={`text-sm ${failed ? "text-danger" : "text-success"}`}>{message}</p>}
      <div><Button type="submit" size="sm" loading={pending || preparing}>{t("upload")}</Button></div>
    </form>
  );
}
