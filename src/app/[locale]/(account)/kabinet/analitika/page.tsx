import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Eye, Heart, MessageSquare, Phone, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { TelegramIcon, WhatsAppIcon } from "@/components/site/brand-icons";
import { Link } from "@/i18n/navigation";
import { requireLister } from "@/lib/auth/guard";
import { getListingAnalytics, parsePeriod } from "@/lib/accounts/listing-analytics";
import { buildManagedMetadata } from "@/lib/seo";
import { ANALYTICS_PERIODS, PROPERTY_STATUSES, type Locale } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.analytics" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/analitika", noIndex: true, locale: locale as Locale });
}

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/** Elan analitikası (#161): baxış, əlaqə açılışı, WhatsApp, müraciət, favorit və bazar müqayisəsi. */
export default async function CabinetAnalyticsPage({ searchParams }: Props) {
  const locale = await getLocale() as Locale;
  const user = await requireLister(locale);
  const query = await searchParams;
  const period = parsePeriod(single(query.dovr));
  const [t, data] = await Promise.all([
    getTranslations("account.analytics"),
    getListingAnalytics({ userId: user.id, userName: user.name, period, agentUserId: single(query.agent) }),
  ]);

  const href = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { dovr: period === 30 ? undefined : String(period), agent: data.agentUserId ?? undefined, ...changes };
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const text = params.toString();
    return text ? `/kabinet/analitika?${text}` : "/kabinet/analitika";
  };
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
      active ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
    );
  const tiles = [
    { key: "views", icon: Eye, label: t("views"), value: data.totals.views },
    { key: "reveals", icon: Phone, label: t("contactReveals"), value: data.totals.contactReveals },
    { key: "whatsapp", icon: WhatsAppIcon, label: t("whatsappClicks"), value: data.totals.whatsappClicks },
    { key: "telegram", icon: TelegramIcon, label: t("telegramClicks"), value: data.totals.telegramClicks },
    { key: "leads", icon: MessageSquare, label: t("leads"), value: data.totals.leads },
    { key: "favorites", icon: Heart, label: t("favorites"), value: data.totals.favorites },
  ];
  const peak = Math.max(1, ...data.series.map((point) => point.views));
  const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("eyebrow")} title={t("title")} description={data.isAgency ? t("agencyDescription") : t("description")} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <nav aria-label={t("periodLabel")} className="flex flex-wrap gap-2">
          {ANALYTICS_PERIODS.map((value) => (
            <Link key={value} href={href({ dovr: value === 30 ? undefined : String(value) })} className={chip(period === value)} aria-current={period === value ? "page" : undefined}>
              {t("period", { days: value })}
            </Link>
          ))}
        </nav>
        {data.isAgency && data.team.length > 1 && (
          <form method="get" className="flex items-end gap-2">
            {period !== 30 && <input type="hidden" name="dovr" value={period} />}
            <Select
              name="agent"
              label={t("agentFilter")}
              placeholder={t("allAgents")}
              options={data.team.map((member) => ({ value: member.userId, label: member.userId === user.id ? t("agencyOwn", { name: member.name }) : member.name }))}
              defaultValue={data.agentUserId ?? ""}
              className="min-w-52"
            />
            <Button type="submit" size="sm" variant="outline">{t("apply")}</Button>
          </form>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <li key={tile.key} className="rounded-xl border border-line bg-paper p-4 shadow-xs">
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <tile.icon className="size-3.5 text-gold-deep" aria-hidden="true" />
              {tile.label}
            </p>
            <p className="tabular mt-1 text-2xl font-semibold text-ink">{formatNumber(tile.value)}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="trend-title" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
        <h2 id="trend-title" className="font-sans text-base font-semibold text-ink">{t("trendTitle")}</h2>
        <p className="mt-1 text-xs text-ink-muted">{t("trendDescription")}</p>
        <div className="mt-4 flex h-32 items-end gap-px" role="img" aria-label={t("trendAria", { days: period, views: data.totals.views })}>
          {data.series.map((point) => (
            <div
              key={point.day}
              title={`${point.day}: ${point.views}`}
              className="min-w-0 flex-1 rounded-t-xs bg-gold/70"
              style={{ height: `${Math.max(2, Math.round((point.views / peak) * 100))}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-ink-muted tabular">
          <span>{data.series[0]?.day}</span>
          <span>{data.series.at(-1)?.day}</span>
        </div>
      </section>

      {data.rows.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} />
      ) : (
        <section aria-labelledby="listings-title" className="rounded-xl border border-line bg-paper shadow-xs">
          <h2 id="listings-title" className="px-4 pt-4 font-sans text-base font-semibold text-ink sm:px-5">{t("listingsTitle")}</h2>
          <p className="px-4 pt-1 text-xs text-ink-muted sm:px-5">{t("listingsDescription")}</p>
          <div className="relative mt-3 overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-y border-line text-left text-xs text-ink-muted">
                  <th scope="col" className="px-4 py-2 font-medium sm:px-5">{t("listing")}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t("views")}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t("contactReveals")}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t("whatsappShort")}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Telegram</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t("leads")}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t("favorites")}</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">{t("conversion")}</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium sm:px-5">{t("market")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.rows.map((row) => {
                  const ratio = row.marketViews != null && row.marketViews > 0 ? row.views / row.marketViews : null;
                  return (
                    <tr key={row.id}>
                      <td className="max-w-72 px-4 py-3 sm:px-5">
                        <Link href={`/emlaklar/${row.slug}`} className="line-clamp-2 font-medium text-ink underline-offset-4 hover:text-gold-deep hover:underline">
                          {row.title}
                        </Link>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                          {row.status !== PROPERTY_STATUSES.PUBLISHED && <Badge tone="neutral">{t(`status.${row.status === PROPERTY_STATUSES.PENDING ? "pending" : row.status === PROPERTY_STATUSES.SOLD || row.status === PROPERTY_STATUSES.RENTED ? "closed" : row.status === PROPERTY_STATUSES.RESERVED ? "reserved" : "inactive"}`)}</Badge>}
                          {data.isAgency && row.author && <span>{row.author.name}</span>}
                          <span>{t("allTimeViews", { count: row.viewCount })}</span>
                        </p>
                      </td>
                      <td className="tabular px-2 py-3 text-right text-ink">{formatNumber(row.views)}</td>
                      <td className="tabular px-2 py-3 text-right text-ink">{formatNumber(row.contactReveals)}</td>
                      <td className="tabular px-2 py-3 text-right text-ink">{formatNumber(row.whatsappClicks)}</td>
                      <td className="tabular px-2 py-3 text-right text-ink">{formatNumber(row.telegramClicks)}</td>
                      <td className="tabular px-2 py-3 text-right text-ink">{formatNumber(row.leads)}</td>
                      <td className="tabular px-2 py-3 text-right text-ink">{formatNumber(row.favorites)}</td>
                      <td className="tabular px-2 py-3 text-right text-ink-soft">{row.views > 0 ? `${percent(row.leads + row.contactReveals + row.whatsappClicks + row.telegramClicks, row.views)}%` : "—"}</td>
                      <td className="px-4 py-3 text-right sm:px-5">
                        {ratio == null ? (
                          <span className="text-ink-muted">—</span>
                        ) : (
                          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", ratio >= 1 ? "text-success" : "text-warning")}>
                            {ratio >= 1 ? <TrendingUp className="size-3.5" aria-hidden="true" /> : <TrendingDown className="size-3.5" aria-hidden="true" />}
                            {t("marketRatio", { ratio: ratio.toFixed(1), average: Math.round(row.marketViews ?? 0) })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
