"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Loqo bu enə qədər kiçildilir — kartda 48 px, agentlik səhifəsində 128 px göstərilir. */
const LOGO_MAX_SIDE = 512;
/**
 * Server Action gövdəsinin Next limiti 1 MB-dır və bütün forma ilə paylaşılır.
 * Kiçiltmə alınmasa orijinal fayl yalnız bu həddən kiçikdirsə göndərilir.
 */
const LOGO_MAX_BYTES = 900 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type LogoPickerLabels = {
  label: string;
  hint: string;
  choose: string;
  change: string;
  remove: string;
  invalid: string;
  tooLarge: string;
};

/** Şəkli brauzerdə kvadrata sığacaq ölçüdə WebP-yə çevirir; alınmasa null. */
async function downscale(file: File): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, LOGO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob || blob.type !== "image/webp") return null;
    const base = file.name.replace(/\.[^.]+$/, "") || "logo";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch {
    return null;
  }
}

/**
 * Qeydiyyat formasında agentlik loqosu: önizləmə, dəyişmə və silmə.
 * Fayl adi `<input type="file" name>` ilə formaya qoşulur — server action onu `FormData`-dan oxuyur.
 */
export function LogoPicker({ name, labels, error }: { name: string; labels: LogoPickerLabels; error?: string }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  // React forma action-dan sonra sahələri sıfırlayır — önizləmə də onunla birlikdə getməlidir.
  useEffect(() => {
    const formElement = inputRef.current?.form;
    if (!formElement) return;
    const onReset = () => setPreview(null);
    formElement.addEventListener("reset", onReset);
    return () => formElement.removeEventListener("reset", onReset);
  }, []);

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setLocalError(null);
    if (!file) {
      setPreview(null);
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setLocalError(labels.invalid);
      clear();
      return;
    }
    setProcessing(true);
    const resized = await downscale(file);
    setProcessing(false);
    const finalFile = resized ?? file;
    if (finalFile.size > LOGO_MAX_BYTES) {
      setLocalError(labels.tooLarge);
      clear();
      return;
    }
    if (resized) {
      const transfer = new DataTransfer();
      transfer.items.add(resized);
      input.files = transfer.files;
    }
    setPreview(URL.createObjectURL(finalFile));
  }

  const message = localError ?? error;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  return (
    // `relative` — `sr-only` fayl sahəsi (absolute) konteynerdən kənara qaçıb səhifəni daşdırmasın.
    <div className="relative flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">{labels.label}</label>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "grid size-20 shrink-0 place-items-center overflow-hidden rounded-md border bg-paper",
            message ? "border-danger" : "border-line-strong border-dashed",
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- yerli blob önizləməsi, optimizasiya lazım deyil
            <img src={preview} alt="" className="size-full object-contain" />
          ) : (
            <ImagePlus className="size-6 text-ink-muted" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-sm border border-line-strong bg-paper px-4 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold"
          >
            {preview ? labels.change : labels.choose}
          </label>
          {preview && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 items-center gap-1 rounded-sm px-3 text-sm text-ink-muted transition-colors hover:text-danger focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden="true" />
              {labels.remove}
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={handleChange}
        disabled={processing}
        aria-describedby={message ? `${errorId} ${hintId}` : hintId}
        aria-invalid={message ? true : undefined}
        className="sr-only"
      />
      <p id={hintId} className="text-xs leading-5 text-ink-muted">{labels.hint}</p>
      {message && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">{message}</p>
      )}
    </div>
  );
}
