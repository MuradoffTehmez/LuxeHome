"use client";

import { useTranslations } from "next-intl";
import { Settings2 } from "lucide-react";
import { analyticsConfigured } from "@/lib/client-analytics";
import { cn } from "@/lib/utils";
import { openConsentPreferences } from "./consent-store";

const VARIANTS = {
  /** Footer-dakı hüquqi keçidlərlə eyni görünüş (tünd fon). */
  footer:
    "inline-flex min-h-11 cursor-pointer items-center rounded-xs text-xs text-ink-invert-muted transition-colors hover:text-ink-invert focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:min-h-0 lg:py-1",
  /** Cookie siyasəti səhifəsindəki düymə. */
  page:
    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-line-strong bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
} as const;

/**
 * Verilmiş analitika seçimini istənilən vaxt yenidən açır (dəyişmək və ya geri çəkmək üçün).
 * Analitika konfiqurasiya olunmayıbsa (staging, lokal) idarə ediləcək bir şey yoxdur — heç nə render olunmur.
 */
export function CookiePreferencesButton({
  variant = "footer",
  className,
}: {
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const t = useTranslations("common.analytics");
  if (!analyticsConfigured()) return null;

  return (
    <button type="button" onClick={openConsentPreferences} className={cn(VARIANTS[variant], className)}>
      {variant === "page" ? <Settings2 className="size-4 text-gold-deep" aria-hidden="true" /> : null}
      {t("manage")}
    </button>
  );
}
