"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus, Check, Copy } from "lucide-react";
import { AdminForm } from "@/components/admin/form-shell";
import { revokeCalendarToken, rotateCalendarToken } from "./actions";

/**
 * Şəxsi təqvim abunəsi (#109). Link Google/Apple/Outlook təqviminə «URL ilə əlavə et»
 * kimi verilir; baxış rezervasiyaları və açıq qapı günləri avtomatik görünür.
 */
export function CalendarSubscription({ url }: { url: string | null }) {
  const t = useTranslations("admin");
  const [copied, setCopied] = useState(false);
  const googleUrl = url ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(url.replace(/^https:/, "webcal:"))}` : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">{t("pages.account.calendarHint")}</p>
      {url ? (
        <>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <input readOnly value={url} aria-label={t("pages.account.calendarUrl")} className="min-h-11 min-w-0 flex-1 rounded-xs border border-line-strong bg-ivory px-3 font-mono text-xs text-ink" onFocus={(event) => event.currentTarget.select()} />
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm font-medium text-ink hover:border-gold"
            >
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? t("pages.account.calendarCopied") : t("pages.account.calendarCopy")}
            </button>
          </div>
          {googleUrl ? (
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-gold-deep hover:underline">
              <CalendarPlus className="size-4" aria-hidden="true" />
              {t("pages.account.calendarGoogle")}
            </a>
          ) : null}
          <p className="text-xs text-warning">{t("pages.account.calendarSecret")}</p>
          <div className="flex flex-wrap gap-3">
            <AdminForm action={rotateCalendarToken} submitLabel={t("pages.account.calendarRotate")}>{null}</AdminForm>
            <AdminForm action={revokeCalendarToken} submitLabel={t("pages.account.calendarRevoke")}>{null}</AdminForm>
          </div>
        </>
      ) : (
        <AdminForm action={rotateCalendarToken} submitLabel={t("pages.account.calendarCreate")}>{null}</AdminForm>
      )}
    </div>
  );
}
