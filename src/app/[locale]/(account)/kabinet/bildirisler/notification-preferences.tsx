"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import type { NotificationPreferenceValues } from "@/lib/notification-preferences";
import { saveNotificationPreferences } from "./preference-actions";

/**
 * PRD bölmə 57 seçim matrisi.
 *
 * Sətir — bildiriş növü, sütun — kanal. Push sütunu abunəlik olmadan da saxlanıla
 * bilər: istifadəçi əvvəlcə seçimi qeyd edib sonra brauzer icazəsini verə bilər,
 * `sendPushToUser` onsuz da abunəliyi ayrıca yoxlayır.
 */
const ROWS = [
  { id: "savedSearch", email: "savedSearchEmail", web: "savedSearchWeb", push: "savedSearchPush" },
  { id: "priceDrop", email: "priceDropEmail", web: "priceDropWeb", push: "priceDropPush" },
  { id: "reservation", email: "reservationEmail", web: "reservationWeb", push: "reservationPush" },
] as const;

function StateMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const error = state.status === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
          : "flex min-w-0 items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success [overflow-wrap:anywhere]"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  );
}

function ChannelBox({ name, checked, label }: { name: string; checked: boolean; label: string }) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-ink-soft">
      <input type="checkbox" name={name} defaultChecked={checked} className="size-4 accent-gold-deep" />
      <span>{label}</span>
    </label>
  );
}

export function NotificationPreferences({ values }: { values: NotificationPreferenceValues }) {
  const t = useTranslations("account.notifications.preferences");
  const [state, formAction, pending] = useActionState(saveNotificationPreferences, IDLE_STATE);

  return (
    <section className="mb-6 rounded-md border border-line bg-paper p-4 sm:p-5">
      <h2 className="font-medium text-ink">{t("title")}</h2>
      <p className="mt-0.5 text-sm text-ink-muted">{t("description")}</p>

      <form action={formAction} className="mt-4 flex flex-col gap-5" noValidate>
        <StateMessage state={state} />

        <div className="flex flex-col gap-4">
          {ROWS.map((row) => (
            <fieldset key={row.id} className="rounded-xs border border-line px-4 py-3">
              <legend className="px-1 text-sm font-medium text-ink">{t(`rows.${row.id}`)}</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <ChannelBox name={row.email} checked={values[row.email]} label={t("channels.email")} />
                <ChannelBox name={row.web} checked={values[row.web]} label={t("channels.web")} />
                <ChannelBox name={row.push} checked={values[row.push]} label={t("channels.push")} />
              </div>
            </fieldset>
          ))}
        </div>

        <div className="rounded-xs border border-line px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <Moon className="size-4 text-gold-deep" aria-hidden="true" />
            {t("quietHours.title")}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">{t("quietHours.description")}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              name="quietHoursStart"
              type="time"
              label={t("quietHours.start")}
              defaultValue={values.quietHoursStart ?? ""}
            />
            <Input
              name="quietHoursEnd"
              type="time"
              label={t("quietHours.end")}
              defaultValue={values.quietHoursEnd ?? ""}
            />
          </div>
        </div>

        <div>
          <Button type="submit" size="sm" loading={pending}>
            {t("submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
