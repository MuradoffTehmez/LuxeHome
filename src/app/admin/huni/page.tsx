import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarCheck, CheckCircle2, Inbox } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow, StatCard } from "@/components/admin/admin-ui";
import { AdminListCard, AdminResponsiveList } from "@/components/admin/admin-responsive-list";
import { EmptyState } from "@/components/ui/states";
import { PERMISSIONS, type LeadSource } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminI18n } from "@/lib/admin-i18n";
import { localizePath } from "@/i18n/path-locale";
import { getConversionReport } from "@/lib/admin/conversion-report";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.funnel.title") };
}

export const dynamic = "force-dynamic";

const PERIODS = [7, 30, 90] as const;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Konversiya hunisi (#105): müraciət mərhələləri, mənbələr və elan üzrə baxış → müraciət. */
export default async function FunnelPage({ searchParams }: { searchParams: SearchParams }) {
  const { t, locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.LEAD_MANAGE);
  const requested = Number((await searchParams).gun);
  const days = PERIODS.find((value) => value === requested) ?? 30;
  const report = await getConversionReport(days);
  const percent = (value: number | null) => (value === null ? "—" : `${value}%`);
  const attention = report.listings.filter((row) => row.needsAttention).length;

  return (
    <>
      <AdminPageHeader
        title={t("pages.funnel.title")}
        description={t("pages.funnel.description", { days })}
        breadcrumbs={[{ label: t("pages.leads.idarePaneli"), href: "/admin" }, { label: t("pages.funnel.title") }]}
        actions={
          <nav aria-label={t("pages.funnel.period")} className="inline-flex gap-1 rounded-sm border border-line bg-paper p-1">
            {PERIODS.map((value) => (
              <Link
                key={value}
                href={value === 30 ? "/admin/huni" : `/admin/huni?gun=${value}`}
                aria-current={value === days ? "page" : undefined}
                className={cn(
                  "grid min-h-11 min-w-14 place-items-center rounded-xs px-3 text-sm font-medium",
                  value === days ? "bg-navy text-ivory" : "text-ink-soft hover:text-ink",
                )}
              >
                {t("pages.funnel.days", { days: value })}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("pages.funnel.leads")} value={report.stages[0].count} hint={t("pages.funnel.days", { days })} icon={Inbox} tone="gold" href="/admin/muracietler" />
        <StatCard label={t("pages.funnel.waiting")} value={report.waiting} hint={t("pages.funnel.waitingHint")} icon={AlertTriangle} tone={report.waiting ? "warning" : "success"} href="/admin/muracietler/lovhe" />
        <StatCard label={t("pages.funnel.completedRate")} value={percent(report.stages[3].rate)} hint={t("pages.funnel.completedHint", { count: report.stages[3].count })} icon={CheckCircle2} tone="success" />
        <StatCard label={t("pages.funnel.reservations")} value={report.reservations} hint={t("pages.funnel.days", { days })} icon={CalendarCheck} tone="neutral" href="/admin/rezervasiyalar" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <AdminCard title={t("pages.funnel.stagesTitle")} description={t("pages.funnel.stagesHint")}>
          {report.stages[0].count === 0 ? (
            <EmptyState title={t("pages.funnel.empty")} />
          ) : (
            <ol className="flex flex-col gap-3">
              {report.stages.map((stage) => (
                <li key={stage.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-ink">{t(`pages.funnel.stage.${stage.key}`)}</span>
                    <span className="tabular text-ink-soft">{stage.count} · {percent(stage.rate)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-beige" aria-hidden="true">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${stage.rate ?? 0}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>

        <AdminCard title={t("pages.funnel.sourcesTitle")}>
          {report.sources.length === 0 ? (
            <EmptyState title={t("pages.funnel.empty")} />
          ) : (
            <ul className="flex flex-col gap-3">
              {report.sources.map((row) => (
                <li key={row.source} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink">{t(`labels.leadSource.${row.source as LeadSource}`)}</span>
                  <span className="tabular text-ink-soft">{row.count} · {percent(row.share)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard
        title={t("pages.funnel.listingsTitle")}
        description={attention > 0 ? t("pages.funnel.attentionSummary", { count: attention }) : t("pages.funnel.listingsHint")}
        bodyClassName="p-4 lg:p-0"
      >
        <AdminResponsiveList
          ariaLabel={t("pages.funnel.listingsTitle")}
          items={report.listings}
          getKey={(row) => row.id}
          empty={<EmptyState title={t("pages.funnel.noListings")} />}
          renderCard={(row) => (
            <AdminListCard title={row.title}>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-xs text-ink-muted">{t("pages.funnel.views")}</dt><dd className="tabular">{row.views}</dd></div>
                <div><dt className="text-xs text-ink-muted">{t("pages.funnel.favorites")}</dt><dd className="tabular">{row.favorites}</dd></div>
                <div><dt className="text-xs text-ink-muted">{t("pages.funnel.leadsColumn")}</dt><dd className="tabular">{row.leads}</dd></div>
                <div><dt className="text-xs text-ink-muted">{t("pages.funnel.leadRate")}</dt><dd className="tabular">{percent(row.leadRate)}</dd></div>
              </dl>
              {row.needsAttention ? <p className="mt-2 text-xs font-semibold text-warning">{t("pages.funnel.attention")}</p> : null}
            </AdminListCard>
          )}
          renderTable={(rows) => (
            <AdminTable
              headers={[
                { label: t("pages.funnel.listing") },
                { label: t("pages.funnel.views") },
                { label: t("pages.funnel.favorites") },
                { label: t("pages.funnel.leadsColumn") },
                { label: t("pages.funnel.reservationsColumn") },
                { label: t("pages.funnel.leadRate") },
              ]}
            >
              {rows.map((row) => (
                <AdminTableRow key={row.id}>
                  <AdminTableCell>
                    <Link href={localizePath(`/emlaklar/${row.slug}`, locale)} className="font-medium text-ink hover:text-gold-deep">{row.title}</Link>
                    {row.needsAttention ? <span className="ml-2 rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">{t("pages.funnel.attention")}</span> : null}
                  </AdminTableCell>
                  <AdminTableCell className="tabular">{row.views}</AdminTableCell>
                  <AdminTableCell className="tabular">{row.favorites}</AdminTableCell>
                  <AdminTableCell className="tabular">{row.leads}</AdminTableCell>
                  <AdminTableCell className="tabular">{row.reservations}</AdminTableCell>
                  <AdminTableCell className="tabular">{percent(row.leadRate)}</AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        />
      </AdminCard>
    </>
  );
}
