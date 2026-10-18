"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IDLE_STATE } from "@/lib/admin/action-state";
import {
  CRITICAL_NOTIFICATION_CATEGORIES,
  FUTURE_NOTIFICATION_CHANNELS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  type CategoryChannels,
} from "@/lib/notification-categories";
import { saveCategoryChannels } from "./preference-actions";

/**
 * Bildiriş mərkəzi (#252, PRD 17.4): hadisə kateqoriyası × kanal. SMS və Telegram gələcək kanallardır —
 * deaktiv göstərilir. Təhlükəsizlik bildirişləri kilidlidir (həmişə gedir).
 */
/** `unavailable` — bot konfiqurasiya olunmayıb; `unlinked` — hesab bota bağlanmayıb; `linked` — işləyir. */
export type TelegramChannelState = "unavailable" | "unlinked" | "linked";

export function CategoryPreferences({ values, telegram }: { values: CategoryChannels; telegram: TelegramChannelState }) {
  const t = useTranslations("account.notifications.center");
  const [state, action, pending] = useActionState(saveCategoryChannels, IDLE_STATE);

  return (
    <section aria-labelledby="notification-center-title" className="rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-6">
      <h2 id="notification-center-title" className="font-sans text-lg font-semibold text-ink">{t("title")}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("description")}</p>
      <form action={action} className="mt-5">
        {/*
          Bir işarələmə, iki düzülüş: desktopda cədvəl kimi sütunlar (başlıq sətri görünür), mobil ekranda
          hər kateqoriya ayrıca blokdur və kanal adı checkbox-un yanında yazılır — əvvəl 34rem-lik cədvəl
          375px-də kanal sütunlarını ekrandan çıxarırdı. Hər input DOM-da bir dəfədir (forma dəyəri dəyişmir).
        */}
        <div className="min-w-0">
          <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1fr)_repeat(4,4.5rem)] items-end gap-1 border-b border-line pb-2 text-sm sm:grid">
            <span className="pr-3 font-medium text-ink-muted">{t("category")}</span>
            {NOTIFICATION_CHANNELS.map((channel) => {
              const inactive = channel === "telegram" && telegram !== "linked";
              return (
                <span key={channel} className={inactive ? "text-center font-medium text-ink-muted" : "text-center font-medium text-ink"}>
                  {t(`channels.${channel}`)}
                  {inactive && <span className="block text-[0.7rem] font-normal">{t(telegram === "unavailable" ? "soon" : "notLinked")}</span>}
                </span>
              );
            })}
            {FUTURE_NOTIFICATION_CHANNELS.map((channel) => (
              <span key={channel} className="text-center font-medium text-ink-muted">
                {t(`channels.${channel}`)}
                <span className="block text-[0.7rem] font-normal">{t("soon")}</span>
              </span>
            ))}
          </div>
          <ul className="divide-y divide-line">
            {NOTIFICATION_CATEGORIES.map((category) => {
              const locked = CRITICAL_NOTIFICATION_CATEGORIES.includes(category);
              const label = t(`categories.${category}.label`);
              return (
                <li key={category} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_repeat(4,4.5rem)] sm:items-center sm:py-1">
                  <div className="min-w-0 pr-3">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                      {label}
                      {locked && <Lock className="size-3.5 text-ink-muted" aria-label={t("locked")} />}
                    </span>
                    <span className="block text-xs text-ink-muted">{t(`categories.${category}.hint`)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 sm:contents">
                    {NOTIFICATION_CHANNELS.map((channel) => (
                      // Toxunma sahəsi ≥44px (PRD 26.4): checkbox 20px-dir, onu əhatə edən label bütün xananı tutur.
                      <label key={channel} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink-soft has-[:disabled]:cursor-not-allowed sm:justify-center">
                        <input
                          type="checkbox"
                          name={`${category}.${channel}`}
                          defaultChecked={values[category][channel]}
                          // Bağlanmamış Telegram sütunu deaktivdir; server saxlanmış seçimi qoruyur.
                          disabled={locked || (channel === "telegram" && telegram !== "linked")}
                          aria-label={`${label} — ${t(`channels.${channel}`)}`}
                          className="size-5 accent-gold disabled:opacity-60"
                        />
                        <span aria-hidden="true" className="sm:hidden">{t(`channels.${channel}`)}</span>
                      </label>
                    ))}
                    {FUTURE_NOTIFICATION_CHANNELS.map((channel) => (
                      <span key={channel} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted sm:justify-center">
                        <input type="checkbox" disabled aria-label={`${label} — ${t(`channels.${channel}`)} (${t("soon")})`} className="size-5 opacity-40" />
                        <span aria-hidden="true" className="sm:hidden">{t(`channels.${channel}`)}</span>
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="mt-3 text-xs text-ink-muted">{t("securityNote")}</p>
        {state.status !== "idle" && state.message && (
          <p role={state.status === "error" ? "alert" : "status"} className={`mt-3 flex items-start gap-2 text-sm ${state.status === "error" ? "text-danger" : "text-success"}`}>
            {state.status === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
            {state.message}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button type="submit" size="sm" loading={pending}>{t("save")}</Button>
        </div>
      </form>
    </section>
  );
}
