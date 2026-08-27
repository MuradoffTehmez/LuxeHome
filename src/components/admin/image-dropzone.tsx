"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";
import { useFieldError } from "./form-shell";
import { DEFAULT_IMAGE_UPLOAD_URL } from "./image-dropzone-config";

/**
 * Şəkil yükləmə sahəsi.
 *
 * Fayllar seçilən kimi seçilmiş media endpoint-inə gedir və R2-yə yazılır; forma yalnız
 * hazır URL-ləri daşıyır. Bu qəsdəndir: Server Action gövdəsində 8 MB-lıq faylları
 * daşımaq həm limitə dəyir, həm də irəliləyiş göstərməyə imkan vermir.
 *
 * Forma dəyəri gizli input-larda JSON kimi gedir — sıra, alt mətn və üz qabığı
 * seçimi bir sahədə saxlanılır və server tərəfdə bir yerdə oxunur.
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
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const fieldError = useFieldError(name);
  const [dragActive, setDragActive] = useState(false);
  const [items, setItems] = useState<Item[]>(() =>
    withCover(
      initial.map((image, index) => ({
        ...image,
        id: `initial-${index}`,
        status: "ready" as const,
      })),
    ),
  );

  async function upload(file: File, id: string) {
    if (file.size > maxFileSize) {
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "error",
                error: `Fayl ${Math.round(maxFileSize / 1024 / 1024)} MB-dan böyükdür`,
              }
            : item,
        ),
      );
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);

    try {
      const response = await fetch(uploadUrl, { method: "POST", body });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Yükləmə alınmadı");
      }

      setItems((current) =>
        withCover(
          current.map((item) =>
            item.id === id ? { ...item, url: payload.url!, status: "ready" } : item,
          ),
        ),
      );
    } catch (error) {
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "error",
                error: error instanceof Error ? error.message : "Yükləmə alınmadı",
              }
            : item,
        ),
      );
    }
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;

    const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
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
    limited.forEach((file, index) => void upload(file, pending[index].id));
  }

  function remove(id: string) {
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
          <span className="tabular text-xs text-ink-muted">{uploaded.length} şəkil</span>
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
            Şəkilləri bura sürüşdürün və ya seçmək üçün klikləyin
          </span>
          <span className="text-xs text-ink-muted">
            JPG, PNG, WebP və ya AVIF — hər fayl ən çoxu 8 MB
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
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-xs bg-gold px-2 py-1 text-[11px] font-semibold text-ink">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  Üz qabığı
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
                    Şəklin alt mətni
                  </label>
                  <input
                    id={`${fieldId}-alt-${item.id}`}
                    type="text"
                    value={item.alt}
                    onChange={(event) => setAlt(item.id, event.target.value)}
                    placeholder="Alt mətn (SEO)"
                    maxLength={160}
                    className="min-h-11 w-full rounded-xs border border-line px-2 text-xs text-ink placeholder:text-ink-muted focus:border-gold"
                  />
                  {!item.alt.trim() && (
                    <p className="flex items-start gap-1 text-[11px] leading-4 text-warning">
                      <AlertCircle className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                      <span><strong>Alt mətn boşdur.</strong> Şəkli qısa və konkret təsvir edin; yalnız dekorativdirsə boş saxlayın.</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-0.5">
                    {mode === "multiple" ? (
                      <span className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => move(item.id, -1)}
                          disabled={index === 0}
                          aria-label="Sırada əvvələ apar"
                          title="Əvvələ"
                          className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronLeft className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(item.id, 1)}
                          disabled={index === items.length - 1}
                          aria-label="Sırada sona apar"
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
                          aria-label="Üz qabığı et"
                          title="Üz qabığı et"
                          className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors hover:bg-beige hover:text-gold-deep"
                        >
                          <Star className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label="Şəkli sil"
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
                <div className="flex justify-end bg-paper px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label="Uğursuz şəkli siyahıdan çıxar"
                    title="Çıxar"
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
                <span className="text-xs font-medium">Daha əlavə et</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
