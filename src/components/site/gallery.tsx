"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { wrapIndex } from "@/lib/ui/gallery-navigation";
import { GalleryLightbox } from "./gallery-lightbox";

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
 * Elan qalereyası: sabit hündürlüklü əsas şəkil + altında kiçik şəkil lenti.
 *
 * **Niyə şəbəkə deyil.** Əvvəl bütün şəkillər `sm:grid-cols-2` şəbəkəsində açılırdı
 * və 10 şəkilli elanda qalereya beş sıralıq divara çevrilirdi: qiymət, təsvir və
 * əlaqə forması ekrandan çox aşağı düşürdü. İndi hündürlük şəkil sayından asılı
 * deyil — 3 şəkil də, 30 şəkil də eyni yer tutur.
 *
 * Əsas şəkil `scroll-snap` lentidir: toxunma ekranında sürüşdürmə brauzerin öz
 * jestidir (əl ilə swipe kodu yazılmır), desktopda isə oxlar və kiçik şəkillər
 * həmin lenti proqram yolu ilə sürüşdürür.
 */
export function Gallery({ images, title, className }: GalleryProps) {
  const t = useTranslations("content.gallery");
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRailRef = useRef<HTMLDivElement>(null);
  const total = images.length;

  const scrollToIndex = useCallback(
    (nextIndex: number, behavior: ScrollBehavior = "smooth") => {
      const rail = railRef.current;
      if (!rail || total === 0) return;
      const target = wrapIndex(nextIndex, total);
      rail.scrollTo({ left: target * rail.clientWidth, behavior });
      setIndex(target);
    },
    [total],
  );

  const go = useCallback(
    (nextIndex: number) => {
      if (total === 0) return;
      scrollToIndex(wrapIndex(nextIndex, total));
    },
    [scrollToIndex, total],
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const previous = useCallback(() => go(index - 1), [go, index]);

  // Lightbox-da oxlarla gəzdikdən sonra əsas lent həmin şəkildə qalmalıdır —
  // əks halda pəncərə bağlananda qalereya köhnə mövqeyə "qayıdır".
  const wasFullscreen = useRef(false);
  useEffect(() => {
    if (wasFullscreen.current && !fullscreen) scrollToIndex(index, "auto");
    wasFullscreen.current = fullscreen;
  }, [fullscreen, index, scrollToIndex]);

  // Aktiv kiçik şəkil həmişə görünən sahədə qalmalıdır.
  useEffect(() => {
    const rail = thumbRailRef.current;
    const active = rail?.children[index];
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [index]);

  function openAt(nextIndex: number) {
    setIndex(nextIndex);
    setFullscreen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (total < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }
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
          "flex aspect-16/9 items-center justify-center rounded-xl bg-beige text-ink-muted",
          className,
        )}
      >
        {t("empty")}
      </div>
    );
  }

  const arrowClassName =
    "pointer-events-auto inline-flex size-11 items-center justify-center rounded-full on-image-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Qalereyadakı hər hansı düymə fokusdadırsa ←/→ şəkli dəyişir — lightbox
          açılmadan da klaviatura ilə gəzmək mümkündür. */}
      <div className="relative overflow-hidden rounded-xl bg-beige" onKeyDown={handleKeyDown}>
        <div
          ref={railRef}
          onScroll={handleRailScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, imageIndex) => {
            const alt = image.alt || t("imageAlt", { title, index: imageIndex + 1 });
            return (
              <button
                key={image.url}
                type="button"
                onClick={() => openAt(imageIndex)}
                aria-label={t("open", { alt })}
                className="group relative aspect-4/3 w-full shrink-0 snap-center cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset sm:aspect-16/10"
              >
                <Image
                  src={image.url}
                  alt={alt}
                  fill
                  unoptimized={isUnoptimizedImage(image.url)}
                  priority={imageIndex === 0}
                  loading={imageIndex === 0 ? undefined : "lazy"}
                  sizes="(max-width: 1023px) 100vw, 760px"
                  className="image-lift object-cover"
                />
              </button>
            );
          })}
        </div>

        {total > 1 && (
          <div className="pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-between">
            <button type="button" onClick={previous} aria-label={t("previous")} className={arrowClassName}>
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={next} aria-label={t("next")} className={arrowClassName}>
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <p
          aria-live="polite"
          className="tabular pointer-events-none absolute bottom-3 left-3 on-image-chip rounded-full px-2.5 py-1 text-xs"
        >
          {index + 1} / {total}
        </p>

        <button
          type="button"
          onClick={() => openAt(index)}
          className="absolute right-3 bottom-3 inline-flex min-h-11 items-center gap-2 on-image-chip rounded-full px-3.5 text-xs font-semibold"
        >
          <Expand className="size-4" aria-hidden="true" />
          {t("showAll", { count: total })}
        </button>
      </div>

      {total > 1 && (
        <div
          ref={thumbRailRef}
          role="group"
          aria-label={t("thumbnailRail", { title })}
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5"
        >
          {images.map((image, imageIndex) => (
            <button
              key={`thumb-${image.url}`}
              type="button"
              onClick={() => scrollToIndex(imageIndex)}
              aria-label={t("thumbnail", { index: imageIndex + 1 })}
              aria-current={imageIndex === index}
              className={cn(
                "relative aspect-4/3 w-20 shrink-0 overflow-hidden rounded-md bg-beige transition-opacity sm:w-24",
                imageIndex === index
                  ? "ring-2 ring-gold ring-offset-1 ring-offset-ivory"
                  : "opacity-65 hover:opacity-100",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized={isUnoptimizedImage(image.url)}
                loading="lazy"
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {fullscreen && (
        <GalleryLightbox
          images={images}
          title={title}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}
