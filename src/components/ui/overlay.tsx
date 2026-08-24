"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getFocusWrapIndex } from "@/lib/ui/overlay-focus";
import { cn } from "@/lib/utils";
import { IconButton } from "./button";

export type OverlayPlacement = "center" | "bottom" | "left" | "right";

export type OverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  placement?: OverlayPlacement;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const WRAPPER_CLASSES: Record<OverlayPlacement, string> = {
  center: "items-center justify-center p-4 sm:p-6",
  bottom: "items-end justify-center",
  left: "items-stretch justify-start",
  right: "items-stretch justify-end",
};

const PANEL_CLASSES: Record<OverlayPlacement, string> = {
  center: "max-h-[92dvh] w-full max-w-xl animate-scale-in rounded-md",
  bottom:
    "max-h-dvh w-full animate-slide-up rounded-t-lg pb-[var(--safe-bottom)]",
  left: "h-dvh w-[min(24rem,90vw)] animate-slide-right",
  right: "h-dvh w-[min(24rem,90vw)] animate-slide-left",
};

/**
 * Modal, sheet və drawer-lər üçün ortaq əlçatan təbəqə.
 * Fokus dövrü, Escape, scroll lock və trigger-ə fokus qaytarılması burada idarə olunur.
 */
export function Overlay({
  open,
  onClose,
  title,
  description,
  placement = "center",
  children,
  footer,
  className,
}: OverlayProps) {
  const t = useTranslations("common.ui");
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const targetIndex = getFocusWrapIndex({
        activeIndex,
        itemCount: focusable.length,
        direction: event.shiftKey ? "backward" : "forward",
      });

      if (targetIndex === null) return;
      event.preventDefault();
      focusable[targetIndex]?.focus();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (target ?? panelRef.current)?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [handleKeyDown, open]);

  if (!open) return null;

  const dialog = (
    <div
      className={cn(
        "fixed inset-0 z-[var(--z-modal)] flex overflow-hidden",
        WRAPPER_CLASSES[placement],
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 cursor-default bg-charcoal/60 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative flex min-h-0 flex-col bg-paper shadow-lg outline-none",
          PANEL_CLASSES[placement],
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-xl text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label={t("close")} onClick={onClose} className="-mt-2 -mr-2 shrink-0">
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-line px-5 py-4 sm:px-6">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );

  // `document.body`-yə portallanır: çağıran ağacda `backdrop-blur`/`transform` olan
  // əcdad (məs. Navbar-ın bulanıq header-i) `position: fixed`-ə yeni containing block
  // yaradır və overlay-i öz kiçik qutusuna həbs edir — panel görünmür. SSR-də
  // `document` yoxdur, ona görə orada portalsız render olunur (test mühiti daxil).
  return typeof document === "undefined" ? dialog : createPortal(dialog, document.body);
}
