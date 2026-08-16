"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { GripVertical, ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type PreviewImage = {
  id: string;
  url: string;
  name: string;
  isCover: boolean;
};

type ImageDropzoneProps = {
  label: string;
  hint?: string;
  /** Başlanğıc şəkillər — nümunə məlumatdan gəlir. */
  initial?: { id: string; url: string; name: string }[];
  /** `single` — yalnız bir şəkil (üz qabığı), `multiple` — qalereya. */
  mode?: "single" | "multiple";
};

/**
 * Şəkil yükləmə sahəsi.
 *
 * Hazırda yalnız interfeysdir: seçilən fayllar `URL.createObjectURL` ilə brauzerdə
 * göstərilir, heç bir yerə göndərilmir.
 *
 * TODO: Backend mərhələsində fayllar serverə yüklənəcək (əvvəlcə lokal disk
 *       `/public/uploads`, sonra Cloudflare R2 / S3 — bax MEMORY.md).
 */
export function ImageDropzone({
  label,
  hint,
  initial = [],
  mode = "multiple",
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [images, setImages] = useState<PreviewImage[]>(
    initial.map((image, index) => ({ ...image, isCover: index === 0 })),
  );

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file, index) => ({
        id: `${file.name}-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        name: file.name,
        isCover: false,
      }));

    setImages((current) => {
      const merged = mode === "single" ? next.slice(0, 1) : [...current, ...next];
      // Heç bir üz qabığı yoxdursa, birinci şəkil üz qabığı olur
      return merged.some((image) => image.isCover)
        ? merged
        : merged.map((image, index) => ({ ...image, isCover: index === 0 }));
    });
  }

  function remove(id: string) {
    setImages((current) => {
      const filtered = current.filter((image) => image.id !== id);
      return filtered.some((image) => image.isCover)
        ? filtered
        : filtered.map((image, index) => ({ ...image, isCover: index === 0 }));
    });
  }

  function setCover(id: string) {
    setImages((current) =>
      current.map((image) => ({ ...image, isCover: image.id === id })),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        {images.length > 0 && (
          <span className="tabular text-xs text-ink-muted">{images.length} şəkil</span>
        )}
      </div>

      {/* Sürüklə-burax sahəsi */}
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
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer flex-col items-center gap-2 px-6 py-8 text-center"
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
          onChange={(event) => addFiles(event.target.files)}
          className="sr-only"
          aria-label={label}
        />
      </div>

      {hint && <p className="text-xs text-ink-muted">{hint}</p>}

      {/* Seçilmiş şəkillər */}
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <li
              key={image.id}
              className="group relative overflow-hidden rounded-xs border border-line bg-beige"
            >
              <div className="relative aspect-4/3">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  // Blob URL-lər Next optimizasiyasından keçmir
                  unoptimized={image.url.startsWith("blob:")}
                  className="object-cover"
                />
              </div>

              {image.isCover && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-xs bg-gold px-2 py-1 text-[11px] font-semibold text-ink">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  Üz qabığı
                </span>
              )}

              <div className="flex items-center justify-between gap-1 bg-paper px-2 py-1.5">
                <span
                  className="grid size-8 place-items-center text-ink-muted"
                  title="Sıranı dəyişmək üçün sürüşdürün"
                >
                  <GripVertical className="size-4" aria-hidden="true" />
                </span>

                <div className="flex items-center gap-0.5">
                  {!image.isCover && (
                    <button
                      type="button"
                      onClick={() => setCover(image.id)}
                      aria-label={`«${image.name}» şəklini üz qabığı et`}
                      title="Üz qabığı et"
                      className="grid size-9 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors hover:bg-beige hover:text-gold-deep"
                    >
                      <Star className="size-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(image.id)}
                    aria-label={`«${image.name}» şəklini sil`}
                    title="Sil"
                    className="grid size-9 cursor-pointer place-items-center rounded-xs text-ink-soft transition-colors hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}

          {mode === "multiple" && (
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex aspect-4/3 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xs border-2 border-dashed border-line-strong text-ink-muted transition-colors hover:border-gold hover:text-gold-deep"
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
