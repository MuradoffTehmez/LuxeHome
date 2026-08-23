"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Overlay } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

type GalleryProps = {
  images: GalleryImage[];
  title: string;
  className?: string;
};

/** Mobil scroll-snap rail, desktop grid və əlçatan fullscreen lightbox. */
export function Gallery({ images, title, className }: GalleryProps) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const go = useCallback(
    (nextIndex: number) => {
      if (total === 0) return;
      setIndex(((nextIndex % total) + total) % total);
    },
    [total],
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const previous = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (!fullscreen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") previous();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fullscreen, next, previous]);

  function openAt(nextIndex: number) {
    setIndex(nextIndex);
    setFullscreen(true);
  }

  function handleRailScroll(event: React.UIEvent<HTMLDivElement>) {
    const viewport = event.currentTarget.clientWidth;
    if (viewport === 0) return;
    const nextIndex = Math.round(event.currentTarget.scrollLeft / viewport);
    if (nextIndex >= 0 && nextIndex < total) setIndex(nextIndex);
  }

  if (total === 0) {
    return (
      <div
        className={cn(
          "flex aspect-16/9 items-center justify-center rounded-md bg-beige text-ink-muted",
          className,
        )}
      >
        Foto əlavə edilməyib
      </div>
    );
  }

  const current = images[index];

  return (
    <div className={cn("relative", className)}>
      <div
        ref={railRef}
        onScroll={handleRailScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, imageIndex) => {
          const alt = image.alt || `${title} — şəkil ${imageIndex + 1}`;
          return (
            <button
              key={image.url}
              type="button"
              onClick={() => openAt(imageIndex)}
              aria-label={`${alt} şəklini tam ekranda aç`}
              className="group relative aspect-4/3 w-full shrink-0 snap-center cursor-zoom-in overflow-hidden bg-beige focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset sm:rounded-sm"
            >
              <Image
                src={image.url}
                alt={alt}
                fill
                priority={imageIndex === 0}
                loading={imageIndex === 0 ? undefined : "lazy"}
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 390px"
                className="image-lift object-cover"
              />
              <span className="absolute right-3 bottom-3 inline-flex size-11 items-center justify-center rounded-full bg-charcoal/50 text-white opacity-100 backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
                <Expand className="size-4" aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="tabular pointer-events-none absolute bottom-3 left-0 rounded-r-xs bg-charcoal/65 px-3 py-1.5 text-xs text-white backdrop-blur-sm sm:hidden"
      >
        {index + 1} / {total}
      </p>

      <Overlay
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        title={`${title} — şəkil ${index + 1} / ${total}`}
        className="h-dvh max-h-dvh max-w-none rounded-none bg-paper"
        footer={
          total > 1 ? (
            <div className="flex w-full items-center justify-center gap-4">
              <button
                type="button"
                onClick={previous}
                aria-label="Əvvəlki şəkil"
                className="inline-flex size-12 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-gold-soft hover:text-gold-soft"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <span aria-live="polite" className="tabular min-w-16 text-center text-sm text-ink-soft">
                {index + 1} / {total}
              </span>
              <button
                type="button"
                onClick={next}
                aria-label="Növbəti şəkil"
                className="inline-flex size-12 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-gold-soft hover:text-gold-soft"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          ) : null
        }
      >
        <div className="relative -mx-5 -my-5 min-h-[60dvh] w-[calc(100%+2.5rem)] bg-charcoal sm:-mx-6 sm:min-h-[70dvh] sm:w-[calc(100%+3rem)]">
          <Image
            src={current.url}
            alt={current.alt || `${title} — şəkil ${index + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
          />
        </div>
      </Overlay>
    </div>
  );
}
