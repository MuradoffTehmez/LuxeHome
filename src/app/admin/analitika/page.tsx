import type { Metadata } from "next";
import { Activity, AlertTriangle, Eye, FileStack, Gauge, Users, Zap } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow, StatCard } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/ui/states";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getSearchAnalytics, type DailyTraffic } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Trafik analitikası" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "2-digit" });
const numberFormatter = new Intl.NumberFormat("az-AZ");

export default async function AdminAnalyticsPage() {
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000);
  const [result, errors, vitals] = await Promise.all([
    getSearchAnalytics(14),
    prisma.clientErrorEvent.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.webVitalMetric.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 1_000 }),
  ]);
  const poorVitals = vitals.filter((metric) => metric.rating === "poor").length;
  const vitalAverage = (name: "LCP" | "INP") => {
    const values = vitals.filter((metric) => metric.name === name).map((metric) => metric.value);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  };

  return (
    <>
      <AdminPageHeader
        title="Trafik analitikası"
        description="Cloudflare trafiki, real istifadəçi Core Web Vitals ölçüləri və brauzer xətaları bir paneldə."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Trafik analitikası" }]}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Brauzer xətası" value={errors.length} hint="Son 7 gün" icon={AlertTriangle} tone={errors.length ? "warning" : "success"} />
        <StatCard label="Zəif CWV ölçümü" value={poorVitals} hint={`${vitals.length} ölçü içində`} icon={Activity} tone={poorVitals ? "warning" : "success"} />
        <StatCard label="Orta LCP" value={vitalAverage("LCP") === null ? "—" : `${vitalAverage("LCP")} ms`} hint="Son 7 gün" icon={Gauge} tone="neutral" />
        <StatCard label="Orta INP" value={vitalAverage("INP") === null ? "—" : `${vitalAverage("INP")} ms`} hint="Son 7 gün" icon={Gauge} tone="neutral" />
      </div>

      <AdminCard title="Son brauzer xətaları" description="Şəxsi məlumatlar və query parametrləri saxlanılmır." bodyClassName="p-4 lg:p-0" className="mb-6">
        {errors.length === 0 ? (
          <EmptyState title="Xəta qeydə alınmayıb" description="Son 7 gündə error boundary hadisəsi yoxdur." />
        ) : (
          <AdminTable headers={[{ label: "Vaxt" }, { label: "Marşrut" }, { label: "Xəta" }, { label: "Kod" }]}>
            {errors.slice(0, 20).map((error) => (
              <AdminTableRow key={error.id}>
                <AdminTableCell className="whitespace-nowrap text-xs text-ink-muted">{error.createdAt.toLocaleString("az-AZ")}</AdminTableCell>
                <AdminTableCell className="max-w-52 truncate font-mono text-xs">{error.path ?? "—"}</AdminTableCell>
                <AdminTableCell className="max-w-xl"><span className="line-clamp-2 text-sm">{error.message}</span></AdminTableCell>
                <AdminTableCell className="font-mono text-xs text-ink-muted">{error.digest ?? "—"}</AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </AdminCard>

      {!result.available ? (
        <EmptyState title="Analitika əlçatan deyil" description={result.reason} />
      ) : result.days.length === 0 ? (
        <EmptyState title="Hələ məlumat yoxdur" description="Seçilmiş dövrdə Cloudflare zonası üçün trafik qeydə alınmayıb." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Ümumi sorğu"
              value={numberFormatter.format(totalOf(result.days, "requests"))}
              icon={Zap}
              tone="gold"
            />
            <StatCard
              label="Səhifə baxışı"
              value={numberFormatter.format(totalOf(result.days, "pageViews"))}
              icon={Eye}
              tone="neutral"
            />
            <StatCard
              label="Unikal ziyarətçi"
              value={numberFormatter.format(totalOf(result.days, "uniques"))}
              icon={Users}
              tone="success"
            />
            <StatCard
              label="Keşdən verilən"
              value={`${cacheRatio(result.days)}%`}
              hint="Ümumi sorğudan"
              icon={FileStack}
              tone="neutral"
            />
          </div>

          <AdminCard title="Gündəlik bölgü" bodyClassName="p-4 lg:p-0">
            <AdminResponsiveList
              ariaLabel="Gündəlik trafik bölgüsü"
              items={[...result.days].reverse()}
              getKey={(day) => day.date}
              empty={<EmptyState title="Hələ məlumat yoxdur" />}
              renderCard={(day) => (
                <AdminListCard title={dateFormatter.format(new Date(day.date))}>
                  <dl className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <dt className="text-xs text-ink-muted">Sorğu</dt>
                      <dd className="tabular mt-1 font-medium text-ink">{numberFormatter.format(day.requests)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-muted">Baxış</dt>
                      <dd className="tabular mt-1 font-medium text-ink">{numberFormatter.format(day.pageViews)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-muted">Unikal</dt>
                      <dd className="tabular mt-1 font-medium text-ink">{numberFormatter.format(day.uniques)}</dd>
                    </div>
                  </dl>
                </AdminListCard>
              )}
              renderTable={(items) => (
                <AdminTable
                  headers={[
                    { label: "Tarix" },
                    { label: "Sorğu", className: "text-right" },
                    { label: "Səhifə baxışı", className: "text-right" },
                    { label: "Unikal", className: "text-right" },
                  ]}
                >
                  {items.map((day) => (
                    <AdminTableRow key={day.date}>
                      <AdminTableCell>{dateFormatter.format(new Date(day.date))}</AdminTableCell>
                      <AdminTableCell align="right">{numberFormatter.format(day.requests)}</AdminTableCell>
                      <AdminTableCell align="right">{numberFormatter.format(day.pageViews)}</AdminTableCell>
                      <AdminTableCell align="right">{numberFormatter.format(day.uniques)}</AdminTableCell>
                    </AdminTableRow>
                  ))}
                </AdminTable>
              )}
            />
          </AdminCard>
        </>
      )}
    </>
  );
}

function totalOf(days: DailyTraffic[], key: "requests" | "pageViews" | "uniques") {
  return days.reduce((sum, day) => sum + day[key], 0);
}

function cacheRatio(days: DailyTraffic[]) {
  const requests = totalOf(days, "requests");
  if (requests === 0) return 0;
  const cached = days.reduce((sum, day) => sum + day.cachedRequests, 0);
  return Math.round((cached / requests) * 100);
}
