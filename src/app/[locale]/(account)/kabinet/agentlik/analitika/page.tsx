import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { buttonClassName } from "@/components/ui/button";
import { BarList, LineChart } from "@/components/charts/simple-charts";
import { Link } from "@/i18n/navigation";
import { requireAccount } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { getAgencyAccess, hasAgencyPermission } from "@/lib/accounts/agency-access";
import { getAgencyAnalytics, parseAnalyticsRange } from "@/lib/accounts/agency-analytics";
import { ACCOUNT_TYPES, AGENCY_MEMBER_PERMISSIONS, ANALYTICS_PERIODS, LISTING_TYPES, type Locale } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.agencyAnalytics" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/agentlik/analitika", noIndex: true, locale: locale as Locale });
}

const number = new Intl.NumberFormat("en-US");

/**
 * Agentlik analitikası (#234, PRD 11.1, 11.2, 11.4, 11.5) — sahib və `LEADS_MANAGE` səlahiyyətli menecer.
 * Interval URL-dədir (`?dovr=` və ya `?dan=&ad=`), ona görə hesabat linki paylaşıla bilir.
 */
export default async function AgencyAnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = (await getLocale()) as Locale;
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY && user.accountType !== ACCOUNT_TYPES.AGENT) forbidden();
  const t = await getTranslations("account.agencyAnalytics");
  const access = await getAgencyAccess(user);
  if (!hasAgencyPermission(access, AGENCY_MEMBER_PERMISSIONS.LEADS_MANAGE)) {
    return (
      <div className="min-w-0">
        <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-8"><EmptyState title={t("forbiddenTitle")} description={t("forbiddenDescription")} /></div>
      </div>
    );
  }

  const params = await searchParams;
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const range = parseAnalyticsRange({ dovr: value("dovr"), dan: value("dan"), ad: value("ad") });
  const data = await getAgencyAnalytics({ agencyId: access.agencyId, ownerUserId: access.ownerUserId, range });
  const formatDay = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
  const money = (amount: number) => number.format(amount);

  const cards = [
    { key: "totalListings", value: data.totals.totalListings },
    { key: "activeListings", value: data.totals.activeListings },
    { key: "sold", value: data.totals.sold },
    { key: "rented", value: data.totals.rented },
    { key: "views", value: data.totals.views },
    { key: "clicks", value: data.totals.clicks },
    { key: "leads", value: data.totals.leads },
    { key: "newClients", value: data.totals.newClients },
    { key: "averageActiveDays", value: data.totals.averageActiveDays },
  ] as const;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      {/* İnterval (11.5): hazır dövrlər və ixtiyari tarix aralığı. */}
      <section aria-label={t("rangeLabel")} className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4 shadow-xs sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {ANALYTICS_PERIODS.map((days) => (
            <Link key={days} href={`/kabinet/agentlik/analitika?dovr=${days}`} className={buttonClassName(range.preset === days ? "primary" : "outline", "sm")} aria-current={range.preset === days ? "page" : undefined}>
              {t("lastDays", { days })}
            </Link>
          ))}
        </div>
        <form className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink">
            {t("from")}
            <input type="date" name="dan" defaultValue={range.fromDay} max={range.toDay} className="min-h-11 rounded-sm border border-line bg-paper px-3 text-sm font-normal text-ink" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-ink">
            {t("to")}
            <input type="date" name="ad" defaultValue={range.toDay} className="min-h-11 rounded-sm border border-line bg-paper px-3 text-sm font-normal text-ink" />
          </label>
          <button type="submit" className={buttonClassName("outline", "sm")}>{t("apply")}</button>
        </form>
      </section>
      <p className="-mt-3 text-xs text-ink-muted">{t("rangeSummary", { from: range.fromDay, to: range.toDay, days: range.days })}</p>

      {/* 11.1 — ümumi göstəricilər */}
      <section aria-labelledby="totals-title">
        <h2 id="totals-title" className="sr-only">{t("totalsTitle")}</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {cards.map((card) => (
            <div key={card.key} className="rounded-xl border border-line bg-paper p-4 shadow-xs">
              <dt className="text-xs text-ink-muted">{t(`totals.${card.key}`)}</dt>
              <dd className="mt-1 font-display text-2xl text-ink tabular-nums">
                {card.value == null ? "—" : card.key === "averageActiveDays" ? t("daysValue", { days: card.value }) : number.format(card.value)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-ink-muted">{t("metricsNote")}</p>
      </section>

      {/* 11.5 — dinamika */}
      <section aria-labelledby="dynamics-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
        <h2 id="dynamics-title" className="mb-3 font-sans text-base font-semibold text-ink">{t("dynamicsTitle")}</h2>
        <LineChart
          points={data.series}
          label={t("dynamicsTitle")}
          formatDay={formatDay}
          series={[
            { key: "views", label: t("totals.views"), className: "stroke-gold" },
            { key: "clicks", label: t("totals.clicks"), className: "stroke-info" },
            { key: "leads", label: t("totals.leads"), className: "stroke-success" },
          ]}
        />
      </section>

      {/* 11.2 — agent performansı */}
      <section aria-labelledby="agents-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
        <h2 id="agents-title" className="font-sans text-base font-semibold text-ink">{t("agentsTitle")}</h2>
        <p className="mt-1 mb-3 text-xs text-ink-muted">{t("agentsNote")}</p>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th scope="col" className="py-2 pr-3 font-medium">{t("agents.name")}</th>
                {(["placed", "active", "leads", "responded", "response", "viewings", "deals", "reviews"] as const).map((key) => (
                  <th key={key} scope="col" className="px-2 py-2 text-right font-medium">{t(`agents.${key}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.agents.map((agent) => (
                <tr key={agent.userId} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">
                    {agent.name}
                    {agent.isOwner && <span className="ml-1 text-xs font-normal text-ink-muted">({t("agents.owner")})</span>}
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums">{agent.placed}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{agent.active}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{agent.leads}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{agent.responded}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{agent.responseMinutes == null ? "—" : t("minutesValue", { minutes: agent.responseMinutes })}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{agent.viewings}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{agent.deals}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{agent.reviewCount ? `${agent.reviewAverage?.toFixed(1)} (${agent.reviewCount})` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink">{t("compareLeads")}</h3>
            <BarList label={t("compareLeads")} items={data.agents.map((agent) => ({ key: agent.userId, label: agent.name, value: agent.leads }))} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink">{t("compareDeals")}</h3>
            <BarList label={t("compareDeals")} barClassName="bg-success" items={data.agents.map((agent) => ({ key: agent.userId, label: agent.name, value: agent.deals }))} />
          </div>
        </div>
      </section>

      {/* 11.4 — ərazilər, növlər və qiymət */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section aria-labelledby="areas-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5 lg:col-span-2">
          <h2 id="areas-title" className="mb-3 font-sans text-base font-semibold text-ink">{t("areasTitle")}</h2>
          {data.areas.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("empty")}</p>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">{t("areas.name")}</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">{t("areas.listings")}</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">{t("areas.views")}</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">{t("areas.leads")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.areas.map((area, index) => (
                    <tr key={area.id} className={cn("border-b border-line last:border-0", index === 0 && "font-medium")}>
                      <th scope="row" className="py-2 pr-3 text-left text-ink">{area.name}</th>
                      <td className="px-2 py-2 text-right tabular-nums">{area.listings}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{number.format(area.views)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{area.leads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section aria-labelledby="types-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
          <h2 id="types-title" className="mb-3 font-sans text-base font-semibold text-ink">{t("typesTitle")}</h2>
          {data.leadTypes.length === 0 ? <p className="text-sm text-ink-muted">{t("empty")}</p> : (
            <BarList label={t("typesTitle")} showShare items={data.leadTypes.map((item) => ({ key: item.id, label: item.name, value: item.leads }))} />
          )}
        </section>
        <section aria-labelledby="price-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
          <h2 id="price-title" className="mb-3 font-sans text-base font-semibold text-ink">{t("priceTitle")}</h2>
          {data.priceInterest.length === 0 ? <p className="text-sm text-ink-muted">{t("empty")}</p> : (
            <BarList
              label={t("priceTitle")}
              showShare
              barClassName="bg-info"
              items={data.priceInterest.map((item) => ({
                key: `${item.listingType}:${item.from}`,
                label: `${t(item.listingType === LISTING_TYPES.RENT ? "rent" : "sale")}: ${item.to == null ? t("priceFrom", { from: money(item.from) }) : `${money(item.from)}–${money(item.to)} ₼`}`,
                value: item.leads,
              }))}
            />
          )}
        </section>
      </div>
    </div>
  );
}
