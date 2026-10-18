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
 * Bildiriş mərkəzi (#252, PRD 17.4): hadisə kateqoriyası × kanal. SMS gələcək kanaldır — deaktiv göstərilir.
 * Telegram sütunu yalnız bağlı hesab və açıq razılıqla işləyir (yuxarıdakı Telegram bölməsi). Təhlükəsizlik
 * bildirişləri kilidlidir (həmişə gedir).
 */
export function CategoryPreferences({ values }: { values: CategoryChannels }) {
  const t = useTranslations("account.notifications.center");
  const [state, action, pending] = useActionState(saveCategoryChannels, IDLE_STATE);

  return (
    <section aria-labelledby="notification-center-title" className="mb-8 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-6">
      <h2 id="notification-center-title" className="font-sans text-lg font-semibold text-ink">{t("title")}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("description")}</p>
      <form action={action} className="mt-5">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">{t("title")}</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="py-2 pr-3 font-medium text-ink-muted">{t("category")}</th>
                {NOTIFICATION_CHANNELS.map((channel) => <th key={channel} scope="col" className="px-2 py-2 text-center font-medium text-ink">{t(`channels.${channel}`)}</th>)}
                {FUTURE_NOTIFICATION_CHANNELS.map((channel) => (
                  <th key={channel} scope="col" className="px-2 py-2 text-center font-medium text-ink-muted">
                    {t(`channels.${channel}`)}
                    <span className="block text-[0.7rem] font-normal">{t("soon")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_CATEGORIES.map((category) => {
                const locked = CRITICAL_NOTIFICATION_CATEGORIES.includes(category);
                return (
                  <tr key={category} className="border-b border-line last:border-0">
                    <th scope="row" className="py-3 pr-3 text-left font-normal">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        {t(`categories.${category}.label`)}
                        {locked && <Lock className="size-3.5 text-ink-muted" aria-label={t("locked")} />}
                      </span>
                      <span className="block text-xs text-ink-muted">{t(`categories.${category}.hint`)}</span>
                    </th>
                    {NOTIFICATION_CHANNELS.map((channel) => (
                      <td key={channel} className="px-1 py-1 text-center">
                        {/* Toxunma sahəsi ≥44px (PRD 26.4): checkbox 20px-dir, onu əhatə edən label bütün xananı tutur. */}
                        <label className="inline-grid size-11 cursor-pointer place-items-center has-[:disabled]:cursor-not-allowed">
                          <input
                            type="checkbox"
                            name={`${category}.${channel}`}
                            defaultChecked={values[category][channel]}
                            disabled={locked}
                            aria-label={`${t(`categories.${category}.label`)} — ${t(`channels.${channel}`)}`}
                            className="size-5 accent-gold disabled:opacity-60"
                          />
                        </label>
                      </td>
                    ))}
                    {FUTURE_NOTIFICATION_CHANNELS.map((channel) => (
                      <td key={channel} className="px-1 py-1 text-center">
                        <span className="inline-grid size-11 place-items-center">
                          <input type="checkbox" disabled aria-label={`${t(`categories.${category}.label`)} — ${t(`channels.${channel}`)}`} className="size-5 opacity-40" />
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-muted">{t("securityNote")}</p>
        <p className="mt-1 text-xs text-ink-muted">{t("telegramNote")}</p>
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
