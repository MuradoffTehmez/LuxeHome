"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";

/**
 * Kitabxanaya birbaşa yükləmə.
 *
 * `ImageDropzone`-dan fərqi: burada nəticə formaya daşınmır, sadəcə `Media` sətri
 * yaradılır və siyahı yenilənir. Redaktor şəkli əvvəlcədən yükləyib sonra elanda
 * ünvanını istifadə edə bilir.
 */
export function MediaUploader({ folder = "umumi" }: { folder?: string }) {
  const t = useTranslations("admin");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [pending, setPending] = useState(0);

  async function upload(files: FileList | null) {
    const selected = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (selected.length === 0) return;

    setPending((count) => count + selected.length);
    let uploaded = 0;

    for (const file of selected) {
      if (file.size > MAX_UPLOAD_SIZE) {
        toast(t("pages.common.8MbDanBoyukdur", { p0: file.name }), "error");
        setPending((count) => count - 1);
        continue;
      }

      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      try {
        const response = await fetch("/api/admin/media", { method: "POST", body });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? t("pages.misc.yuklemeAlinmadi"));
        }
        uploaded += 1;
      } catch (error) {
        toast(error instanceof Error ? error.message : t("pages.misc.yuklemeAlinmadi"), "error");
      } finally {
        setPending((count) => count - 1);
      }
    }

    if (uploaded > 0) {
      toast(t("pages.common.faylYuklendi", { p0: uploaded }), "success");
      router.refresh();
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        void upload(event.dataTransfer.files);
      }}
      className={cn(
        "rounded-md border-2 border-dashed transition-colors duration-200",
        dragActive ? "border-gold bg-gold/8" : "border-line-strong bg-ivory",
      )}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending > 0}
        className="flex min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 py-6 text-center disabled:cursor-wait sm:px-6 sm:py-8"
      >
        <span className="grid size-12 place-items-center rounded-full bg-beige text-ink-soft">
          {pending > 0 ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="size-6" aria-hidden="true" />
          )}
        </span>
        <span className="text-sm font-medium text-ink">
          {pending > 0
            ? t("pages.common.faylYuklenir", { p0: pending })
            : t("pages.misc.sekilleriBuraSurusdurunVe")}
        </span>
        <span className="text-xs text-ink-muted">
          {t("pages.settings.jpgPngWebpVe")}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        onChange={(event) => {
          void upload(event.target.files);
          event.target.value = "";
        }}
        className="sr-only"
        aria-label={t("pages.settings.mediaFayliSec")}
      />
    </div>
  );
}
