import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS, type Role } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getStaffCalendar } from "@/lib/calendar-events";
import { bakuMonthGrid, bakuDayKey } from "@/lib/calendar-grid";
import { cn } from "@/lib/utils";
import { formatLocalizedDate, formatLocalizedTime, localizedWeekdayShort } from "@/i18n/date";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.calendar.title") };
}

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Rezervasiya və açıq qapı təqvimi (#109) — Bakı vaxtı ilə aylıq görünüş. */
export default async function ReservationCalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const { t, locale } = await getAdminI18n();
  const user = await requireAdminRead(PERMISSIONS.LEAD_MANAGE);
  const raw = (await searchParams).ay;
  const grid = bakuMonthGrid(typeof raw === "string" ? raw : undefined);
  const events = await getStaffCalendar({
    userId: user.id,
    all: hasPermission(user.role as Role, PERMISSIONS.LEAD_MANAGE),
    from: grid.from,
    to: grid.to,
  });
  const byDay = new Map<string, typeof events>();
  for (const event of events) {
    const key = bakuDayKey(event.start);
    byDay.set(key, [...(byDay.get(key) ?? []), event]);
  }
  const monthLabel = formatLocalizedDate(grid.monthStart, locale, "monthYear") ?? "";
  const weekday = (date: Date) => localizedWeekdayShort(locale, date.getUTCDay());
  const time = (date: Date) => formatLocalizedTime(date) ?? "";
  const dayLabel = (date: Date) => formatLocalizedDate(date, locale, "weekday") ?? "";
  const navClass = "inline-flex min-h-11 items-center gap-1 rounded-sm border border-line-strong px-3 text-sm text-ink hover:border-gold";

  return (
    <>
      <AdminPageHeader
        title={t("pages.calendar.title")}
        description={t("pages.calendar.description", { count: events.length })}
        breadcrumbs={[
          { label: t("pages.leads.idarePaneli"), href: "/admin" },
          { label: t("nav.items.reservations"), href: "/admin/rezervasiyalar" },
          { label: t("pages.calendar.title") },
        ]}
        actions={
          <nav aria-label={t("pages.calendar.monthNav")} className="flex items-center gap-2">
            <Link href={`/admin/rezervasiyalar/teqvim?ay=${grid.prev}`} className={navClass}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              <span className="sr-only">{t("pages.calendar.prev")}</span>
            </Link>
            <span className="min-w-36 text-center text-sm font-semibold text-ink first-letter:uppercase">{monthLabel}</span>
            <Link href={`/admin/rezervasiyalar/teqvim?ay=${grid.next}`} className={navClass}>
              <ChevronRight className="size-4" aria-hidden="true" />
              <span className="sr-only">{t("pages.calendar.next")}</span>
            </Link>
          </nav>
        }
      />

      {/* Desktop: 7 sütunlu şəbəkə */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-paper lg:block">
        <div className="grid grid-cols-7 border-b border-line bg-ivory">
          {grid.days.slice(0, 7).map((day) => (
            <p key={day.key} className="px-3 py-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">{weekday(day.date)}</p>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.days.map((day) => (
            <div key={day.key} className={cn("min-h-32 border-r border-b border-line p-2 [&:nth-child(7n)]:border-r-0", !day.inMonth && "bg-beige/40")}>
              <p className={cn("tabular text-xs font-semibold", day.isToday ? "inline-grid size-6 place-items-center rounded-full bg-navy text-ivory" : day.inMonth ? "text-ink" : "text-ink-muted")}>
                {day.date.getUTCDate()}
              </p>
              <ul className="mt-1 flex flex-col gap-1">
                {(byDay.get(day.key) ?? []).map((event) => (
                  <li key={event.uid}>
                    <Link
                      href={event.kind === "reservation" ? "/admin/rezervasiyalar" : `/admin/emlaklar/${event.propertyId}`}
                      title={event.summary}
                      className={cn(
                        "block truncate rounded-xs px-1.5 py-1 text-[0.6875rem] font-medium",
                        event.kind === "openHouse" ? "bg-gold/15 text-gold-deep" : event.status === "CONFIRMED" ? "bg-success-bg text-success" : "bg-info-bg text-info",
                      )}
                    >
                      <span className="tabular">{time(event.start)}</span> {event.summary}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Mobil: yalnız hadisəsi olan günlərin siyahısı */}
      <div className="flex flex-col gap-3 lg:hidden">
        {grid.days.filter((day) => day.inMonth && byDay.has(day.key)).length === 0 ? (
          <p className="rounded-xl border border-line bg-paper p-6 text-sm text-ink-muted">{t("pages.calendar.empty")}</p>
        ) : null}
        {grid.days.filter((day) => day.inMonth && byDay.has(day.key)).map((day) => (
          <section key={day.key} className="rounded-xl border border-line bg-paper p-4">
            <h2 className="text-sm font-semibold text-ink first-letter:uppercase">{dayLabel(day.date)}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {(byDay.get(day.key) ?? []).map((event) => (
                <li key={event.uid}>
                  <Link
                    href={event.kind === "reservation" ? "/admin/rezervasiyalar" : `/admin/emlaklar/${event.propertyId}`}
                    className="flex min-h-11 items-center gap-3 rounded-sm border border-line px-3 py-2 text-sm hover:border-gold"
                  >
                    <span className="tabular shrink-0 font-semibold text-ink">{time(event.start)}</span>
                    <span className="min-w-0 text-ink-soft [overflow-wrap:anywhere]">{event.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink-muted">{t("pages.calendar.subscribeHint")}</p>
    </>
  );
}
