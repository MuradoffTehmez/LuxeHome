import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClassName } from "@/components/ui/button";
import { LineChart } from "@/components/charts/simple-charts";
import { Link } from "@/i18n/navigation";
import { formatLocalizedDate } from "@/i18n/date";
import { requireLister } from "@/lib/auth/guard";
import { buildManagedMetadata } from "@/lib/seo";
import { getListingPerformance, parsePeriod } from "@/lib/accounts/listing-analytics";
import { ANALYTICS_PERIODS, PUBLIC_PROPERTY_STATUSES, type Locale } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.analytics" });
  return buildManagedMetadata({ title: t("listingMetaTitle"), description: t("metaDescription"), path: "/kabinet/analitika", noIndex: true, locale: locale as Locale });
}

const number = new Intl.NumberFormat("en-US");

/**
 * Elan performansı (#236, PRD 11.3): 7/30/90 günlük dinamika (baxış, unikal baxış, nömrə açılması,
 * WhatsApp, Telegram), favorit, müraciət və qiymət tarixçəsi. Başqasının elanı 404.
 */
export default async function ListingPerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = (await getLocale()) as Locale;
  const user = await requireLister(locale);
  const { id } = await params;
  const query = await searchParams;
  const period = parsePeriod(typeof query.dovr === "string" ? query.dovr : undefined);
  const data = await getListingPerformance({ userId: user.id, propertyId: String(id).slice(0, 64), period });
  if (!data) notFound();
  const t = await getTranslations("account.analytics");
  const isPublic = (PUBLIC_PROPERTY_STATUSES as readonly string[]).includes(data.listing.status);

  const tiles = [
    { key: "views", value: data.totals.views },
    { key: "uniqueViews", value: data.totals.uniqueViews },
    { key: "contactReveals", value: data.totals.contactReveals },
    { key: "whatsappClicks", value: data.totals.whatsappClicks },
    { key: "telegramClicks", value: data.totals.telegramClicks },
    { key: "favorites", value: data.totals.favorites },
    { key: "leads", value: data.totals.leads },
    { key: "priceChanges", value: data.totals.priceChanges },
  ] as const;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader contained compact eyebrow={t("listingEyebrow")} title={data.listing.title} description={t("listingDescription", { views: number.format(data.listing.viewCount) })} />

      <div className="flex flex-wrap items-center gap-2">
        {ANALYTICS_PERIODS.map((days) => (
          <Link key={days} href={`/kabinet/analitika/${data.listing.id}?dovr=${days}`} className={buttonClassName(period === days ? "primary" : "outline", "sm")} aria-current={period === days ? "page" : undefined}>
            {t("periodDays", { days })}
          </Link>
        ))}
        {isPublic && (
          <Link href={`/emlaklar/${data.listing.slug}`} className="ml-auto text-sm font-medium text-gold-deep underline-offset-4 hover:underline">{t("openListing")}</Link>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.key} className="rounded-xl border border-line bg-paper p-4 shadow-xs">
            <dt className="text-xs text-ink-muted">{t(tile.key)}</dt>
            <dd className="mt-1 font-display text-2xl text-ink tabular-nums">{number.format(tile.value)}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="listing-trend" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
        <h2 id="listing-trend" className="mb-3 font-sans text-base font-semibold text-ink">{t("listingTrend", { days: period })}</h2>
        <LineChart
          points={data.series}
          label={t("listingTrend", { days: period })}
          formatDay={(day) => `${day.slice(8, 10)}.${day.slice(5, 7)}`}
          series={[
            { key: "views", label: t("views"), className: "stroke-gold" },
            { key: "uniqueViews", label: t("uniqueViews"), className: "stroke-ink-muted" },
            { key: "contactReveals", label: t("contactReveals"), className: "stroke-info" },
            { key: "whatsappClicks", label: t("whatsappClicks"), className: "stroke-success" },
            { key: "telegramClicks", label: t("telegramClicks"), className: "stroke-warning" },
          ]}
        />
        <p className="mt-2 text-xs text-ink-muted">{t("uniqueNote")}</p>
      </section>

      <section aria-labelledby="price-history" className="rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5">
        <h2 id="price-history" className="mb-3 font-sans text-base font-semibold text-ink">{t("priceHistory")}</h2>
        {data.prices.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("priceHistoryEmpty", { price: formatPrice(data.listing.price, data.listing.currency) })}</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line text-sm">
            {data.prices.map((item) => (
              <li key={item.changedAt.toISOString()} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-ink">
                  {formatPrice(item.oldPrice, item.currency)} → <span className="font-medium">{formatPrice(item.newPrice, item.currency)}</span>
                  <span className={item.newPrice < item.oldPrice ? "ml-2 text-xs text-success" : "ml-2 text-xs text-warning"}>
                    {item.oldPrice > 0 ? `${item.newPrice < item.oldPrice ? "−" : "+"}${Math.abs(Math.round(((item.newPrice - item.oldPrice) / item.oldPrice) * 100))}%` : ""}
                  </span>
                </span>
                <time className="text-xs text-ink-muted" dateTime={item.changedAt.toISOString()}>{formatLocalizedDate(item.changedAt, locale)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
      <Link href={`/kabinet/analitika?dovr=${period}`} className="text-sm font-medium text-gold-deep underline-offset-4 hover:underline">← {t("backToAnalytics")}</Link>
    </div>
  );
}
