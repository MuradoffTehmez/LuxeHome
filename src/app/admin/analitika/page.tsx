import type { Metadata } from "next";
import { Eye, FileStack, Users, Zap } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow, StatCard } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/ui/states";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getSearchAnalytics, type DailyTraffic } from "@/lib/analytics";

export const metadata: Metadata = { title: "Trafik analitikası" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "2-digit" });
const numberFormatter = new Intl.NumberFormat("az-AZ");

export default async function AdminAnalyticsPage() {
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);
  const result = await getSearchAnalytics(14);

  return (
    <>
      <AdminPageHeader
        title="Trafik analitikası"
        description="Cloudflare zonasından son 14 günün sorğu, səhifə baxışı və unikal ziyarətçi statistikası."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Trafik analitikası" }]}
      />

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
