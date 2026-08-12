"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
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

/**
 * Əmlak/layihə qalereyası.
 *
 * - Böyük əsas şəkil + thumbnail sırası
 * - Klaviatura ilə ← → naviqasiya
 * - Tam ekran rejimi (Escape ilə bağlanır)
 * - Mobil üçün toxunma ilə sürüşdürmə (swipe)
 */
export function Gallery({ images, title, className }: GalleryProps) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const total = images.length;

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const previous = useCallback(() => go(index - 1), [go, index]);

  // Klaviatura naviqasiyası
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") previous();
      else if (event.key === "Escape" && fullscreen) setFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [next, previous, fullscreen]);

  // Tam ekranda arxa fon scroll-u bloklanır
  useEffect(() => {
    if (!fullscreen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [fullscreen]);

  // Aktiv thumbnail görünüş sahəsinə sürüşür
  useEffect(() => {
    const container = thumbsRef.current;
    const active = container?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index]);

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    // 50px-dən az hərəkət təsadüfi toxunuş sayılır
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else previous();
    }
    touchStartX.current = null;
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
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Əsas şəkil */}
      <div
        className="relative aspect-4/3 overflow-hidden rounded-md bg-beige sm:aspect-16/9"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || `${title} — foto ${index + 1}`}
          fill
          priority={index === 0}
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="animate-fade-in object-cover"
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label="Əvvəlki foto"
              className="absolute top-1/2 left-3 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-charcoal/45 text-white backdrop-blur-sm transition-colors hover:bg-charcoal/70"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Növbəti foto"
              className="absolute top-1/2 right-3 inline-flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-charcoal/45 text-white backdrop-blur-sm transition-colors hover:bg-charcoal/70"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label="Tam ekranda aç"
          className="absolute right-3 bottom-3 inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-charcoal/45 text-white backdrop-blur-sm transition-colors hover:bg-charcoal/70"
        >
          <Expand className="size-4" aria-hidden="true" />
        </button>

        <p className="tabular absolute bottom-3 left-3 rounded-xs bg-charcoal/55 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
          {index + 1} / {total}
        </p>
      </div>

      {/* Thumbnail sırası */}
      {total > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Foto seçimi"
        >
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Foto ${i + 1}`}
              data-active={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xs border-2 transition-colors sm:h-20 sm:w-28",
                i === index ? "border-gold" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                loading="lazy"
                sizes="112px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Tam ekran */}
      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — foto qalereya`}
          className="animate-fade-in fixed inset-0 z-[90] flex flex-col bg-charcoal/97"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <p className="tabular text-sm text-white/80">
              {index + 1} / {total}
            </p>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Tam ekranı bağla"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>

          <div
            className="relative flex-1"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Image
              src={current.url}
              alt={current.alt || `${title} — foto ${index + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {total > 1 && (
            <div className="flex items-center justify-center gap-4 px-5 py-5">
              <button
                type="button"
                onClick={previous}
                aria-label="Əvvəlki foto"
                className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-gold-soft hover:text-gold-soft"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Növbəti foto"
                className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:border-gold-soft hover:text-gold-soft"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
