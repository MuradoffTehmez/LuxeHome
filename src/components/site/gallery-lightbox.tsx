"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import { galleryKeyAction, swipeDirection, wrapIndex } from "@/lib/ui/gallery-navigation";
import type { GalleryImage } from "./gallery";

type Direction = "next" | "previous" | "none";

type GalleryLightboxProps = {
  images: GalleryImage[];
  title: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

/**
 * Tam ekran şəkil baxışı.
 *
 * Ümumi `Overlay` burada qəsdən işlədilmir: o, forma və menyular üçün qurulub
 * (başlıq zolağı, daxili scroll, ağ panel) və şəkli kiçik sahəyə sıxırdı. Klaviatura
 * dinləyicisi `capture` mərhələsindədir — fokus hansı düymədə olursa olsun,
 * ←/→/Esc əvvəlcə bura çatır və başqa komponent onu udmur.
 *
 * Foto fonu sabit `black`-dir: `charcoal`/`navy` tokenləri tünd rejimdə açığa dönür.
 */
export function GalleryLightbox({ images, title, index, onIndexChange, onClose }: GalleryLightboxProps) {
  const t = useTranslations("content.gallery");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbRailRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ id: number; x: number; y: number; time: number } | null>(null);
  const [direction, setDirection] = useState<Direction>("none");
  const [dragX, setDragX] = useState(0);
  const titleId = useId();
  const total = images.length;
  const current = images[wrapIndex(index, total)];

  const goTo = useCallback(
    (target: number, nextDirection: Direction) => {
      if (total < 2) return;
      setDirection(nextDirection);
      onIndexChange(wrapIndex(target, total));
    },
    [onIndexChange, total],
  );

  const next = useCallback(() => goTo(index + 1, "next"), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1, "previous"), [goTo, index]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = galleryKeyAction(event.key);
      if (action) {
        event.preventDefault();
        event.stopPropagation();
        if (action === "close") onClose();
        else if (action === "next") next();
        else if (action === "previous") previous();
        else if (action === "first") goTo(0, "previous");
        else goTo(total - 1, "next");
        return;
      }

      // Fokus dialoqdan kənara çıxmasın.
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [goTo, next, onClose, previous, total]);

  useEffect(() => {
    const active = thumbRailRef.current?.children[index] as HTMLElement | undefined;
    active?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (total < 2 || event.button > 0) return;
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = pointerRef.current;
    if (!start || start.id !== event.pointerId) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > Math.abs(deltaY)) setDragX(deltaX);
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    const start = pointerRef.current;
    pointerRef.current = null;
    setDragX(0);
    if (!start || start.id !== event.pointerId) return;
    const result = swipeDirection(event.clientX - start.x, event.clientY - start.y, event.timeStamp - start.time);
    if (result === "next") next();
    else if (result === "previous") previous();
  }

  if (!current) return null;
  const alt = current.alt || t("imageAlt", { title, index: index + 1 });
  const navButton =
    "inline-flex size-12 items-center justify-center rounded-full on-image-chip transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

  const dialog = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-gallery-lightbox
      className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-black/95 text-white animate-fade-in"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(1rem,var(--safe-right))] pb-3 pl-[max(1rem,var(--safe-left))]">
        <h2 id={titleId} className="min-w-0 truncate font-sans text-sm font-medium text-white/90">
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          <span aria-live="polite" className="tabular text-sm text-white/80">
            {index + 1} / {total}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="inline-flex size-11 items-center justify-center rounded-full on-image-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        className="relative min-h-0 flex-1 touch-pan-y select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          key={current.url}
          className={cn(
            "absolute inset-0",
            direction === "next" && "lightbox-enter-next",
            direction === "previous" && "lightbox-enter-previous",
          )}
          style={dragX ? { transform: `translateX(${dragX}px)`, transition: "none" } : undefined}
        >
          <Image
            src={current.url}
            alt={alt}
            fill
            draggable={false}
            unoptimized={isUnoptimizedImage(current.url)}
            sizes="100vw"
            className="pointer-events-none object-contain"
          />
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label={t("previous")}
              className={cn(navButton, "absolute top-1/2 left-[max(0.75rem,var(--safe-left))] -translate-y-1/2")}
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label={t("next")}
              className={cn(navButton, "absolute top-1/2 right-[max(0.75rem,var(--safe-right))] -translate-y-1/2")}
            >
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <p className="sr-only">{t("keyboardHint")}</p>

      {total > 1 && (
        <div
          ref={thumbRailRef}
          role="group"
          aria-label={t("thumbnailRail", { title })}
          className="flex shrink-0 justify-start gap-2 overflow-x-auto pt-3 pr-[max(1rem,var(--safe-right))] pb-[max(0.75rem,var(--safe-bottom))] pl-[max(1rem,var(--safe-left))] [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, imageIndex) => (
            <button
              key={`lightbox-thumb-${image.url}`}
              type="button"
              onClick={() => goTo(imageIndex, imageIndex > index ? "next" : "previous")}
              aria-label={t("thumbnail", { index: imageIndex + 1 })}
              aria-current={imageIndex === index}
              className={cn(
                "relative aspect-4/3 w-16 shrink-0 overflow-hidden rounded-md transition-opacity sm:w-20",
                imageIndex === index ? "ring-2 ring-gold" : "opacity-50 hover:opacity-100",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized={isUnoptimizedImage(image.url)}
                loading="lazy"
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return typeof document === "undefined" ? dialog : createPortal(dialog, document.body);
}
