"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LOCALE_LABELS, type Locale } from "@/lib/constants";
import { saveLocalePreference } from "@/lib/locale-actions";
import { cn } from "@/lib/utils";
import { startNavigationProgress } from "@/components/site/navigation-progress";
import { LocaleFlag } from "@/components/site/locale-flag";

type LocaleSwitcherProps = {
  isOverlay?: boolean;
  variant?: "desktop" | "mobile";
  onSelect?: () => void;
};

/** Cari marşrutu dəyişmədən, ayrıca seçim səhifəsi açmadan dil dəyişdirir. */
export function LocaleSwitcher({
  isOverlay = false,
  variant = "desktop",
  onSelect,
}: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common.locale");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function select(next: Locale) {
    setOpen(false);
    onSelect?.();
    if (next === locale) return;
    startNavigationProgress();
    // Naviqasiya gözləmədən başlayır; hesabı olan istifadəçinin profili paralel saxlanılır.
    void saveLocalePreference(next);
    router.replace(pathname, { locale: next });
  }

  if (variant === "mobile") {
    return (
      <div className="grid gap-2" aria-label={t("switch")}>
        {routing.locales.map((code) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => select(code)}
              aria-pressed={active}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-md border px-3 text-left text-sm transition-colors",
                active
                  ? "border-gold bg-gold/12 font-medium text-ink"
                  : "border-line bg-paper text-ink-soft hover:border-line-strong hover:text-ink",
              )}
            >
              <LocaleFlag locale={code} className="h-4 w-6" />
              <span className="min-w-0 flex-1 truncate">{LOCALE_LABELS[code]}</span>
              {active ? <Check className="size-4 shrink-0 text-gold-deep" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={t("switch")}
        aria-expanded={open}
        aria-controls="locale-switcher-menu"
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-full px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep",
          isOverlay
            ? "text-white/90 hover:bg-white/10 hover:text-white focus-visible:ring-gold-soft"
            : "text-ink-soft hover:bg-beige hover:text-ink",
        )}
      >
        <LocaleFlag locale={locale} />
        <span className="uppercase">{locale}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open ? (
        <ul
          id="locale-switcher-menu"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-[var(--z-dropdown)] min-w-56 rounded-md border border-line bg-paper p-2 shadow-editorial"
        >
          {routing.locales.map((code) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => select(code)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-xs px-3 text-sm transition-colors",
                  code === locale ? "bg-beige font-medium text-ink" : "text-ink-soft hover:bg-beige/60 hover:text-ink",
                )}
              >
                <LocaleFlag locale={code} />
                <span className="min-w-0 flex-1 truncate text-left">{LOCALE_LABELS[code]}</span>
                {code === locale ? <Check className="size-4 shrink-0 text-gold-deep" aria-hidden="true" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
