"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { Cookie, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ConsentChoice } from "@/lib/analytics-consent";

type ConsentBannerProps = {
  /** `initial` — ilk seçim; `preferences` — seçilmiş razılıq «Cookie parametrləri» ilə yenidən açılıb. */
  mode: "initial" | "preferences";
  choice: ConsentChoice;
  onAccept: () => void;
  onDecline: () => void;
  /** Yalnız `preferences` rejimində: seçimi dəyişmədən bağlayır. */
  onClose?: () => void;
};

const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Analitika razılığı kartı.
 *
 * Qeyri-modal dialoqdur: səhifə bloklanmır, fokus tələsi yoxdur. `AnalyticsProvider` onu DOM-un
 * əvvəlində render edir ki, klaviatura və ekran oxuyucu istifadəçisi ona dərhal çatsın. İki seçim
 * eyni ölçüdə və eyni çəkidədir (yalnız rəng fərqlənir). Mobildə qısa, desktopda sol altda
 * kompakt dayanır; alt naviqasiya və əmlak detalındakı sticky CTA zolağının üstündə qalır
 * (`--bottom-nav-offset`, `--sticky-bar-offset`).
 */
export function ConsentBanner({ mode, choice, onAccept, onDecline, onClose }: ConsentBannerProps) {
  const t = useTranslations("common.analytics");
  const titleId = useId();
  const descriptionId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const preferences = mode === "preferences";

  // İstifadəçi özü açıbsa (düymə ilə) fokus dialoqa keçir; ilk seçimdə fokus oğurlanmır.
  useEffect(() => {
    if (preferences) ref.current?.focus();
  }, [preferences]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === "Escape" && preferences) onClose?.();
      }}
      className={cn(
        "animate-consent-in fixed z-[110] rounded-xl border border-gold-line bg-paper p-4 shadow-lg outline-none sm:p-5",
        "right-[max(1rem,var(--safe-right))] left-[max(1rem,var(--safe-left))]",
        "bottom-[calc(1rem+var(--bottom-nav-offset)+var(--sticky-bar-offset)+var(--bottom-safe-rest))]",
        "sm:right-auto sm:left-[max(1.5rem,var(--safe-left))] sm:w-[26.5rem]",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="hidden size-9 shrink-0 place-items-center rounded-full border border-gold-line bg-ivory text-gold-deep sm:grid"
        >
          <Cookie className="size-[1.125rem]" />
        </span>
        <p id={titleId} className="min-w-0 flex-1 text-base font-semibold text-ink">
          {t("title")}
        </p>
        {preferences && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-beige hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <p id={descriptionId} className="mt-2.5 text-[0.8125rem] leading-5 text-ink-soft sm:text-sm sm:leading-6">
        {t.rich("description", {
          policy: (chunks) => (
            <Link
              href="/cookie-siyaseti"
              className="font-medium text-gold-deep underline underline-offset-4 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      {preferences ? (
        <p role="status" className="mt-2 text-xs font-medium text-ink-muted">
          {t(`current.${choice}`)}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onAccept} className={cn(BUTTON, "bg-gold text-on-gold hover:bg-gold-soft")}>
          {t("accept")}
        </button>
        <button
          type="button"
          onClick={onDecline}
          className={cn(BUTTON, "border border-line-strong bg-paper text-ink hover:border-gold")}
        >
          {t("decline")}
        </button>
      </div>
    </div>
  );
}
