"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { HONEYPOT_FIELD } from "@/lib/spam";
import { cn } from "@/lib/utils";
import { slotAvailability } from "@/lib/open-house-availability";
import { formatLocalizedDate, formatLocalizedTime } from "@/i18n/date";
import type { Locale } from "@/lib/constants";
import { registerForOpenHouse, type OpenHouseState } from "@/app/[locale]/(site)/emlaklar/[slug]/open-house-actions";

type Slot = { id: string; startsAt: string; endsAt: string; capacity: number | null; registered: number; note: string | null };

/**
 * Açıq qapı günləri (#109): qarşıdakı baxış pəncərələri və qeydiyyat. Tarix Bakı vaxtı
 * ilə göstərilir — ziyarətçi başqa saat qurşağında olsa da baxış yerli vaxtdadır.
 */
export function OpenHouseSection({ slots, locale }: { slots: Slot[]; locale: string }) {
  const t = useTranslations("property.openHouse");
  const [selected, setSelected] = useState<string | null>(null);
  const [state, action, pending] = useActionState<OpenHouseState, FormData>(registerForOpenHouse, { status: "idle" });

  return (
    <section aria-labelledby="open-house-title" className="rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-7">
      <h2 id="open-house-title" className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
        <CalendarDays className="size-5 text-gold-deep" aria-hidden="true" />
        {t("title")}
      </h2>
      <p className="mt-1 text-sm text-ink-soft">{t("description")}</p>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {slots.map((slot) => {
          const starts = new Date(slot.startsAt);
          const availability = slotAvailability({ startsAt: starts, capacity: slot.capacity, registered: slot.registered });
          const left = slot.capacity === null ? null : Math.max(0, slot.capacity - slot.registered);
          return (
            <li key={slot.id}>
              <button
                type="button"
                disabled={availability !== "open"}
                onClick={() => setSelected(slot.id)}
                aria-pressed={selected === slot.id}
                className={cn(
                  "flex min-h-16 w-full flex-col items-start rounded-md border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  selected === slot.id ? "border-gold bg-gold/10" : "border-line hover:border-gold",
                )}
              >
                <span className="text-sm font-semibold text-ink first-letter:uppercase">{formatLocalizedDate(starts, locale as Locale, "weekday")}</span>
                <span className="tabular text-sm text-ink-soft">{formatLocalizedTime(starts)} – {formatLocalizedTime(slot.endsAt)}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted">
                  <Users className="size-3.5" aria-hidden="true" />
                  {availability === "full" ? t("full") : availability === "closed" ? t("closed") : left === null ? t("open") : t("seatsLeft", { count: left })}
                </span>
                {slot.note ? <span className="mt-1 text-xs text-ink-soft">{slot.note}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {state.status === "success" ? (
        <p role="status" className="mt-5 flex items-start gap-2 rounded-md bg-success-bg p-4 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : selected ? (
        <form action={action} className="relative mt-5 flex flex-col gap-4">
          <input type="hidden" name="openHouseId" value={selected} />
          <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor={`${HONEYPOT_FIELD}-open-house`}>website</label>
            <input id={`${HONEYPOT_FIELD}-open-house`} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          {state.status === "error" ? <p role="alert" className="rounded-xs bg-danger-bg px-3 py-2 text-sm text-danger">{state.message}</p> : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="name" label={t("name")} required maxLength={120} autoComplete="name" />
            <Input name="phone" label={t("phone")} type="tel" required maxLength={40} autoComplete="tel" placeholder="+994 50 XXX XX XX" />
          </div>
          <Input name="email" label={t("email")} type="email" maxLength={200} autoComplete="email" hint={t("emailHint")} />
          <TurnstileWidget action="open_house" resetSignal={state.message} />
          <Button type="submit" loading={pending} className="w-full sm:w-auto sm:self-start">{t("register")}</Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">{t("pickSlot")}</p>
      )}
    </section>
  );
}
