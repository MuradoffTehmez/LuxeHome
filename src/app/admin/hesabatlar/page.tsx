import type { Metadata } from "next";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { BarList, LineChart } from "@/components/charts/simple-charts";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getBusinessIndicators, getGeographicReports, getPlatformAnalytics, type MonthlyMetric } from "@/lib/admin/business-reports";
import { formatLocalizedDate } from "@/i18n/date";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.businessReports.title"), robots: { index: false, follow: false } };
}

const number = new Intl.NumberFormat("en-US");
const MONTHLY_COLUMNS: MonthlyMetric[] = ["registrations", "newListings", "leads", "reports", "confirmedFakes", "newAgencies", "vipGrants"];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/**
 * Hesabatlar və biznes analitikası (#262, PRD Modul 20 / bölmə 22): platforma analitikası, biznes göstəriciləri və
 * coğrafi hesabatlar. Ödəniş qəbul edilmirsə gəlir göstəriciləri «aktiv deyil» kimi göstərilir.
 */
export default async function ReportsPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.BILLING_MANAGE);
  const [platform, business, geo] = await Promise.all([getPlatformAnalytics(), getBusinessIndicators(), getGeographicReports()]);
  const pct = (value: number | null) => (value === null ? "—" : `${value}%`);
  const month = (key: string) => formatLocalizedDate(`${key}-15T12:00:00Z`, locale, "monthYear") ?? key;
  const money = (minor: number) => (business.revenueActive ? formatPrice(Math.round(minor / 100)) : t("pages.businessReports.business.inactive"));

  return (
    <>
      <AdminPageHeader title={t("pages.businessReports.title")} description={t("pages.businessReports.description")} />

      <AdminCard title={t("pages.businessReports.platform.title")} description={t("pages.businessReports.platform.description")} className="mb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Stat label={t("pages.businessReports.platform.dau")} value={number.format(platform.dau)} />
          <Stat label={t("pages.businessReports.platform.wau")} value={number.format(platform.wau)} />
          <Stat label={t("pages.businessReports.platform.mau")} value={number.format(platform.mau)} hint={t("pages.businessReports.platform.stickiness", { value: pct(platform.stickiness) })} />
          <Stat label={t("pages.businessReports.platform.totalUsers")} value={number.format(platform.totalUsers)} />
          <Stat label={t("pages.businessReports.platform.activeListings")} value={number.format(platform.activeListings)} />
          <Stat label={t("pages.businessReports.platform.verifiedAgencies")} value={number.format(platform.verifiedAgencies)} />
        </div>
        <div className="mt-6">
          <LineChart
            label={t("pages.businessReports.platform.chart")}
            points={platform.monthly.map((row) => ({ day: row.month, registrations: row.registrations, newListings: row.newListings, leads: row.leads }))}
            series={[
              { key: "registrations", label: t("pages.businessReports.platform.metrics.registrations"), className: "stroke-gold" },
              { key: "newListings", label: t("pages.businessReports.platform.metrics.newListings"), className: "stroke-navy" },
              { key: "leads", label: t("pages.businessReports.platform.metrics.leads"), className: "stroke-success" },
            ]}
            formatDay={month}
          />
        </div>
        <div className="relative mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">{t("pages.businessReports.platform.table")}</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th scope="col" className="py-2 pr-3 font-medium">{t("pages.businessReports.platform.month")}</th>
                {MONTHLY_COLUMNS.map((key) => <th key={key} scope="col" className="py-2 pr-3 text-right font-medium">{t(`pages.businessReports.platform.metrics.${key}`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {platform.monthly.map((row) => (
                <tr key={row.month} className="border-b border-line/60">
                  <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">{month(row.month)}</th>
                  {MONTHLY_COLUMNS.map((key) => <td key={key} className="py-2 pr-3 text-right tabular-nums text-ink-soft">{number.format(row[key])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard
        title={t("pages.businessReports.business.title")}
        description={t("pages.businessReports.business.description")}
        className="mb-6"
      >
        {!business.revenueActive && (
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <Badge tone="warning">{t("pages.businessReports.business.inactive")}</Badge>
            {t(business.promo ? "pages.businessReports.business.promoNote" : "pages.businessReports.business.checkoutNote")}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Stat label="Basic" value={number.format(business.byPlan.BASIC)} />
          <Stat label="Pro" value={number.format(business.byPlan.PRO)} />
          <Stat label="Premium" value={number.format(business.byPlan.PREMIUM)} />
          <Stat label={t("pages.businessReports.business.trialing")} value={number.format(business.trialing)} />
          <Stat label={t("pages.businessReports.business.conversion")} value={pct(business.conversionRate)} />
          <Stat label={t("pages.businessReports.business.renewal")} value={pct(business.renewalRate)} />
          <Stat label={t("pages.businessReports.business.activeVip")} value={number.format(business.activeVip)} />
          <Stat label={t("pages.businessReports.business.activePromotions")} value={number.format(business.activePromotions)} />
          <Stat label={t("pages.businessReports.business.revenueMonth")} value={money(business.revenueMonthMinor)} />
          <Stat label={t("pages.businessReports.business.vipRevenue")} value={money(business.vipRevenueMinor)} />
          <Stat label="MRR" value={money(business.mrrMinor)} />
          <Stat label="ARR" value={money(business.arrMinor)} />
        </div>
      </AdminCard>

      <AdminCard title={t("pages.businessReports.geo.title")} description={t("pages.businessReports.geo.description")}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 font-sans text-sm font-semibold text-ink">{t("pages.businessReports.geo.cities")}</h2>
            {geo.cities.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.businessReports.empty")}</p> : (
              <BarList label={t("pages.businessReports.geo.cities")} items={geo.cities.map((row) => ({ key: row.id, label: row.name, value: row.count }))} showShare />
            )}
          </section>
          <section>
            <h2 className="mb-3 font-sans text-sm font-semibold text-ink">{t("pages.businessReports.geo.districts")}</h2>
            {geo.districts.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.businessReports.empty")}</p> : (
              <BarList label={t("pages.businessReports.geo.districts")} items={geo.districts.map((row) => ({ key: row.id, label: row.name, value: row.count }))} />
            )}
          </section>
          <section>
            <h2 className="mb-1 font-sans text-sm font-semibold text-ink">{t("pages.businessReports.geo.searched")}</h2>
            <p className="mb-3 text-xs text-ink-muted">{t("pages.businessReports.geo.searchedHint", { count: geo.savedSearchSample })}</p>
            {geo.searchedAreas.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.businessReports.empty")}</p> : (
              <BarList label={t("pages.businessReports.geo.searched")} items={geo.searchedAreas.map((row) => ({ key: row.slug, label: row.name, value: row.count }))} barClassName="bg-navy" />
            )}
          </section>
          <section>
            <h2 className="mb-1 font-sans text-sm font-semibold text-ink">{t("pages.businessReports.geo.typeInterest")}</h2>
            <p className="mb-3 text-xs text-ink-muted">{t("pages.businessReports.geo.typeInterestHint")}</p>
            {geo.typeInterest.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.businessReports.empty")}</p> : (
              <BarList label={t("pages.businessReports.geo.typeInterest")} items={geo.typeInterest.map((row) => ({ key: row.id, label: row.name, value: row.views }))} showShare />
            )}
          </section>
          <section>
            <h2 className="mb-3 font-sans text-sm font-semibold text-ink">{t("pages.businessReports.geo.saleRent")}</h2>
            <BarList
              label={t("pages.businessReports.geo.saleRent")}
              items={[
                { key: "sale", label: t("pages.businessReports.geo.sale"), value: geo.sale },
                { key: "rent", label: t("pages.businessReports.geo.rent"), value: geo.rent },
              ]}
              showShare
            />
          </section>
          <section>
            <h2 className="mb-1 font-sans text-sm font-semibold text-ink">{t("pages.businessReports.geo.priceTrend")}</h2>
            <p className="mb-3 text-xs text-ink-muted">{t("pages.businessReports.geo.priceTrendHint")}</p>
            <ul className="divide-y divide-line text-sm">
              {geo.priceTrend.map((row) => (
                <li key={row.month} className="flex justify-between gap-3 py-2">
                  <span className="text-ink-soft">{month(row.month)}</span>
                  <span className="tabular-nums text-ink">
                    {row.medianPerSqm === null ? "—" : `${formatPrice(row.medianPerSqm)} / m²`}
                    <span className="ml-2 text-xs text-ink-muted">{t("pages.businessReports.geo.samples", { count: row.samples })}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </AdminCard>
    </>
  );
}
