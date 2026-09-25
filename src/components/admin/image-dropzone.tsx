"use client";

import { useTranslations } from "next-intl";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  RotateCcw,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";
import { useFieldError } from "./form-shell";
import { DEFAULT_IMAGE_UPLOAD_URL } from "./image-dropzone-config";
import { ImagePrepareError, isImageCandidate, prepareImageForUpload } from "./image-prepare";
import { createUploadLimiter, uploadWithRetry, type UploadFailureKind } from "./image-upload-queue";

/**
 * Şəkil yükləmə sahəsi.
 *
 * Fayllar seçilən kimi seçilmiş media endpoint-inə gedir və R2-yə yazılır; forma yalnız
 * hazır URL-ləri daşıyır. Bu qəsdəndir: Server Action gövdəsində 8 MB-lıq faylları
 * daşımaq həm limitə dəyir, həm də irəliləyiş göstərməyə imkan vermir.
 *
 * Forma dəyəri gizli input-larda JSON kimi gedir — sıra, alt mətn və üz qabığı
 * seçimi bir sahədə saxlanılır və server tərəfdə bir yerdə oxunur.
 *
 * Toplu yükləmə (#79): fayllar brauzerdə 2400 px-ə kiçildilir (`image-prepare.ts`)
 * və paylaşılan növbə ilə eyni anda ən çox iki-iki göndərilir, keçici xətada
 * təkrar cəhd olunur (`image-upload-queue.ts`). Əvvəl hamısı paralel gedirdi və
 * Worker-in yaddaş limitinə dəyirdi.
 */

export type DropzoneImage = {
  url: string;
  alt: string;
  isCover: boolean;
};

type Item = DropzoneImage & {
  id: string;
  status: "ready" | "uploading" | "error";
  error?: string;
  /** Orijinal fayl yaddaşdadır — «Yenidən cəhd et» göstərilir. */
  retryable?: boolean;
};

type ImageDropzoneProps = {
  /** Forma sahəsinin adı — server `form.list(formData, name)` ilə oxuyur. */
  name: string;
  label: string;
  hint?: string;
  /** R2-də təhlükəsiz server allowlist-ində olan qovluq. */
  folder: string;
  initial?: DropzoneImage[];
  /** `single` — yalnız bir şəkil (üz qabığı), `multiple` — qalereya. */
  mode?: "single" | "multiple";
  /** Çoxlu yükləmədə qəbul edilən maksimum şəkil sayı. */
  maxFiles?: number;
  /** Media endpoint-i; panel formaları əvvəlki admin endpoint-dən istifadə edir. */
  uploadUrl?: string;
  /** Client tərəfdə erkən yoxlama; server qovluğa görə limiti yenidən tətbiq edir. */
  maxFileSize?: number;
  /** Əmlak şəkilləri üçün `{rayon}-{tip}-{otaq}-{elan}-{sıra}` prefiksi. */
  seoNamePrefix?: string;
};

function withCover(items: Item[]): Item[] {
  const ready = items.filter((item) => item.status !== "error");
  if (ready.some((item) => item.isCover)) return items;
  let assigned = false;
  return items.map((item) => {
    if (assigned || item.status === "error") return { ...item, isCover: false };
    assigned = true;
    return { ...item, isCover: true };
  });
}

export function ImageDropzone({
  name,
  label,
  hint,
  folder,
  initial = [],
  mode = "multiple",
  maxFiles,
  uploadUrl = DEFAULT_IMAGE_UPLOAD_URL,
  maxFileSize = MAX_UPLOAD_SIZE,
  seoNamePrefix,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const fieldError = useFieldError(name);
  const [dragActive, setDragActive] = useState(false);
  const t = useTranslations("admin");
  const [items, setItems] = useState<Item[]>(() =>
    withCover(
      initial.map((image, index) => ({
        ...image,
        id: `initial-${index}`,
        status: "ready" as const,
      })),
    ),
  );

  // Komponent boyu bir növbə: yükləmə davam edərkən əlavə olunan fayllar da
  // eyni paralellik limitinə tabedir.
  const limiterRef = useRef<ReturnType<typeof createUploadLimiter> | null>(null);
  // Uğursuz faylı «Yenidən cəhd et» ilə təkrar göndərmək üçün orijinal saxlanılır.
  // `uploadId` fayl başına bir dəfə yaranır və təkrar cəhdlərdə dəyişmir — server
  // onunla cavabı itmiş, amma saxlanmış yükləməni tanıyır (idempotentlik).
  const filesRef = useRef(new Map<string, { file: File; sequence: number; uploadId: string }>());

  function markError(id: string, error: string) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "error", error, retryable: filesRef.current.has(id) } : item,
      ),
    );
  }

  function failureMessage(kind: UploadFailureKind, message?: string): string {
    switch (kind) {
      case "rateLimited":
        return t("components.dropzone.rateLimited");
      case "tooLarge":
        return t("components.dropzone.tooLarge", { size: Math.round(maxFileSize / 1024 / 1024) });
      case "network":
        return t("components.dropzone.network");
      case "server":
        return t("components.dropzone.serverBusy");
      default:
        return message ?? t("components.dropzone.uploadFailed");
    }
  }

  async function upload(file: File, id: string, sequence: number) {
    const uploadId = filesRef.current.get(id)?.uploadId ?? crypto.randomUUID();
    filesRef.current.set(id, { file, sequence, uploadId });
    limiterRef.current ??= createUploadLimiter();

    await limiterRef.current(async () => {
      let prepared: File;
      try {
        prepared = await prepareImageForUpload(file, maxFileSize);
      } catch (error) {
        const kind = error instanceof ImagePrepareError ? error.kind : "unsupported";
        markError(
          id,
          kind === "tooLarge"
            ? t("components.dropzone.tooLarge", { size: Math.round(maxFileSize / 1024 / 1024) })
            : t("components.dropzone.unsupported"),
        );
        return;
      }

      if (prepared.size > maxFileSize) {
        markError(id, t("components.dropzone.tooLarge", { size: Math.round(maxFileSize / 1024 / 1024) }));
        return;
      }

      const result = await uploadWithRetry(() => {
        // Hər cəhd üçün yeni gövdə — `fetch` göndərilmiş gövdəni təkrar oxumur.
        const body = new FormData();
        body.append("file", prepared);
        body.append("folder", folder);
        body.append("uploadId", uploadId);
        if (seoNamePrefix) body.append("seoName", `${seoNamePrefix}-${String(sequence).padStart(2, "0")}`);
        return fetch(uploadUrl, { method: "POST", body });
      });

      if (!result.ok) {
        markError(id, failureMessage(result.kind, result.message));
        return;
      }

      filesRef.current.delete(id);
      setItems((current) =>
        withCover(
          current.map((item) =>
            item.id === id ? { ...item, url: result.url, status: "ready", error: undefined } : item,
          ),
        ),
      );
    });
  }

  function retry(id: string) {
    const entry = filesRef.current.get(id);
    if (!entry) return;
    // Uğursuz şəkil limitə sayılmır; istifadəçi onun yerinə başqasını əlavə edibsə,
    // təkrar cəhd `maxFiles`-i aşar və forma bütövlükdə rədd olunar.
    const active = items.filter((item) => item.status !== "error").length;
    if (maxFiles !== undefined && active >= maxFiles) {
      markError(id, t("components.dropzone.limitReached", { max: maxFiles }));
      return;
    }
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status: "uploading", error: undefined } : item)),
    );
    void upload(entry.file, id, entry.sequence);
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;

    const selected = Array.from(files).filter(isImageCandidate);
    const currentCount = items.filter((item) => item.status !== "error").length;
    const available = maxFiles === undefined ? selected.length : Math.max(0, maxFiles - currentCount);
    const limited = mode === "single" ? selected.slice(0, 1) : selected.slice(0, available);

    const pending: Item[] = limited.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      // Yükləmə bitənə qədər brauzerdəki önbaxış göstərilir
      url: URL.createObjectURL(file),
      alt: "",
      isCover: false,
      status: "uploading" as const,
    }));

    setItems((current) => withCover(mode === "single" ? pending : [...current, ...pending]));
    limited.forEach((file, index) => void upload(file, pending[index].id, currentCount + index + 1));
  }

  function remove(id: string) {
    filesRef.current.delete(id);
    setItems((current) => withCover(current.filter((item) => item.id !== id)));
  }

  function setCover(id: string) {
    setItems((current) => current.map((item) => ({ ...item, isCover: item.id === id })));
  }

  function move(id: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setAlt(id: string, alt: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, alt } : item)));
  }

  const uploaded = items.filter((item) => item.status === "ready");

  return (
    <div className="flex flex-col gap-3">
      {/* Serverə gedən dəyər — sıra massivdəki sıra ilə eynidir */}
      {uploaded.map((item) => (
        <input
          key={item.id}
          type="hidden"
          name={name}
          value={JSON.stringify({ url: item.url, alt: item.alt, isCover: item.isCover })}
        />
      ))}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        {uploaded.length > 0 && (
          <span className="tabular text-xs text-ink-muted">{t("components.dropzone.count", { count: uploaded.length })}</span>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-md border-2 border-dashed transition-colors duration-200",
          dragActive ? "border-gold bg-gold/8" : "border-line-strong bg-ivory",
          fieldError && "border-danger",
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 py-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset sm:px-6 sm:py-8"
        >
          <span className="grid size-12 place-items-center rounded-full bg-beige text-ink-soft">
            <UploadCloud className="size-6" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-ink">
            {t("components.dropzone.prompt")}
          </span>
          <span className="text-xs text-ink-muted">
            {t("components.dropzone.formats", { size: 8 })}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={mode === "multiple"}
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
          aria-label={label}
        />
      </div>

      {hint && !fieldError && <p className="text-xs text-ink-muted">{hint}</p>}
      {fieldError && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {fieldError}
        </p>
      )}

      {items.length > 0 && (
        <ul className="grid gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "relative overflow-hidden rounded-xs border bg-beige",
                item.status === "error" ? "border-danger" : "border-line",
              )}
            >
              <div className="relative aspect-4/3">
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="(max-width: 479px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                  // Blob URL-lər və R2-dən verilən /media/ şəkilləri Next optimizasiyasından keçmir
                  unoptimized={isUnoptimizedImage(item.url)}
                  className={cn("object-cover", item.status !== "ready" && "opacity-50")}
                />
                {item.status === "uploading" && (
                  <span className="absolute inset-0 grid place-items-center bg-charcoal/25">
                    <Loader2 className="size-6 animate-spin text-paper" aria-hidden="true" />
                  </span>
                )}
              </div>

              {item.isCover && item.status === "ready" && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-xs bg-gold px-2 py-1 text-[11px] font-semibold text-on-gold">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  {t("components.dropzone.cover")}
                </span>
              )}

              {item.status === "error" && (
                <p className="bg-danger-bg px-2 py-1.5 text-[11px] font-medium text-danger">
                  {item.error}
                </p>
              )}

              {item.status === "ready" && (
                <div className="flex flex-col gap-1.5 bg-paper px-2 py-2">
                  <label className="sr-only" htmlFor={`${fieldId}-alt-${item.id}`}>
                    {t("components.dropzone.altLabel")}
                  </label>
                  <input
                    id={`${fieldId}-alt-${item.id}`}
                    type="text"
                    value={item.alt}
                    onChange={(event) => setAlt(item.id, event.target.value)}
                    placeholder={t("components.dropzone.altPlaceholder")}
                    maxLength={160}
                    className="min-h-11 w-full rounded-xs border border-line px-2 text-xs text-ink placeholder:text-ink-muted focus:border-gold"
                  />
                  {!item.alt.trim() && (
                    <p className="flex items-start gap-1 text-[11px] leading-4 text-warning">
                      <AlertCircle className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                      <span><strong>{t("components.dropzone.altEmptyStrong")}</strong> {t("components.dropzone.altEmptyRest")}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-0.5">
                    {mode === "multiple" ? (
                      <span className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => move(item.id, -1)}
                          disabled={index === 0}
                          aria-label={t("components.dropzone.moveFirst")}
                          title={t("components.dropzone.moveFirstShort")}
                          className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronLeft className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(item.id, 1)}
                          disabled={index === items.length - 1}
                          aria-label={t("components.dropzone.moveLast")}
                          title="Sona"
                          className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronRight className="size-4" aria-hidden="true" />
                        </button>
                      </span>
                    ) : (
                      <span />
                    )}

                    <span className="flex items-center gap-0.5">
                      {!item.isCover && mode === "multiple" && (
                        <button
                          type="button"
                          onClick={() => setCover(item.id)}
                          aria-label={t("components.dropzone.makeCover")}
                          title={t("components.dropzone.makeCover")}
                          className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors hover:bg-beige hover:text-gold-deep"
                        >
                          <Star className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={t("components.dropzone.remove")}
                        title="Sil"
                        className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                </div>
              )}

              {item.status === "error" && (
                <div className="flex justify-end gap-0.5 bg-paper px-2 py-1.5">
                  {item.retryable && (
                    <button
                      type="button"
                      onClick={() => retry(item.id)}
                      aria-label={t("components.dropzone.retry")}
                      title={t("components.dropzone.retry")}
                      className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors hover:bg-beige hover:text-gold-deep"
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={t("components.dropzone.removeFailed")}
                    title={t("components.dropzone.removeShort")}
                    className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </li>
          ))}

          {mode === "multiple" && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex min-h-11 aspect-4/3 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xs border-2 border-dashed border-line-strong text-ink-muted transition-colors hover:border-gold hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <ImagePlus className="size-6" aria-hidden="true" />
                <span className="text-xs font-medium">{t("components.dropzone.addMore")}</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
