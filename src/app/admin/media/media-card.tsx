"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { Check, Copy, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { SubmitButton } from "@/components/admin/form-shell";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { deleteMedia, updateMediaAlt } from "./actions";

type MediaItem = {
  id: string;
  url: string;
  thumbUrl: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  uploaderName: string | null;
  createdAtLabel: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Media kitabxanasının bir kartı.
 *
 * Hər kart öz kiçik forması ilə gəlir — alt mətn sahə üzərində redaktə olunur və
 * bütün kitabxananı bir formada göndərmək lazım gəlmir.
 */
export function MediaCard({ item }: { item: MediaItem }) {
  const [state, formAction] = useActionState(updateMediaAlt, IDLE_STATE);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
  }, [state, toast]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Ünvan kopyalanmadı.", "error");
    }
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-md border border-line bg-paper">
      <div className="relative aspect-4/3 bg-beige">
        <Image
          src={item.thumbUrl ?? item.url}
          alt={item.alt}
          fill
          unoptimized
          sizes="(max-width: 479px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-1 text-sm font-medium text-ink" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="tabular text-xs text-ink-muted">
          {formatSize(item.size)}
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ""} ·{" "}
          {item.mimeType.replace("image/", "")}
        </p>
        <p className="text-xs text-ink-muted">
          {item.createdAtLabel}
          {item.uploaderName ? ` · ${item.uploaderName}` : ""}
        </p>

        <form action={formAction} className="mt-auto flex flex-col gap-2 pt-1">
          <input type="hidden" name="id" value={item.id} />
          <label className="sr-only" htmlFor={`alt-${item.id}`}>
            Alt mətn
          </label>
          <input
            id={`alt-${item.id}`}
            name="alt"
            type="text"
            defaultValue={item.alt}
            placeholder="Alt mətn (SEO)"
            maxLength={160}
            className="min-h-11 w-full rounded-xs border border-line px-3 text-base text-ink placeholder:text-ink-muted focus:border-gold sm:text-sm"
          />

          <div className="flex items-center justify-between gap-1">
            <SubmitButton label="Saxla" className="min-h-11 px-3 text-xs" />

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={copyUrl}
                aria-label="Ünvanı kopyala"
                title={copied ? "Kopyalandı" : "Ünvanı kopyala"}
                className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
              >
                {copied ? (
                  <Check className="size-4 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </button>

              <ConfirmAction
                action={deleteMedia}
                id={item.id}
                label={`«${item.originalName}» faylını sil`}
                title="Faylı silmək"
                description="Fayl anbardan tamamilə silinəcək. Elan və məqalələrdə istifadə olunursa, orada şəkil yerinə boşluq qalacaq."
                className="size-11"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </ConfirmAction>
            </div>
          </div>
        </form>
      </div>
    </li>
  );
}
