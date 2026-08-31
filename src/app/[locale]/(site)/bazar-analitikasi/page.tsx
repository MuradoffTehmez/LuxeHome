import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { buildManagedMetadata, breadcrumbSchema, itemListSchema, jsonLd } from "@/lib/seo";
import { getMarketReportIndex } from "@/lib/market-intelligence";
import type { Locale } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { Container, Section } from "@/components/ui/container";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };
const copy = {
  az: { title: "Bazar analitikası", description: "Bakı və rayonlar üzrə təsdiqlənmiş qiymət, inventar və dəyişmə göstəriciləri.", home: "Ana səhifə", baku: "Bakı bazarı", median: "Median qiymət", sqm: "Orta m² qiyməti", date: "Ölçmə tarixi", empty: "Təsdiqlənmiş rayon hesabatı hələ yoxdur." },
  en: { title: "Market intelligence", description: "Verified price, inventory and trend indicators for Baku and its districts.", home: "Home", baku: "Baku market", median: "Median price", sqm: "Average price per m²", date: "Measurement date", empty: "No verified district report is available yet." },
  ru: { title: "Аналитика рынка", description: "Проверенные показатели цен, предложения и динамики по Баку и районам.", home: "Главная", baku: "Рынок Баку", median: "Медианная цена", sqm: "Средняя цена за м²", date: "Дата измерения", empty: "Проверенных районных отчетов пока нет." },
} as const;
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { locale } = await params; const t = copy[locale as Locale] ?? copy.az; return buildManagedMetadata({ title: t.title, description: t.description, path: "/bazar-analitikasi", locale: locale as Locale }); }
export default async function MarketIndexPage({ params }: Props) {
  const { locale } = await params; const localeValue = locale as Locale; const t = copy[localeValue] ?? copy.az; const reports = await getMarketReportIndex();
  const links = [{ name: t.baku, path: "/bazar-analitikasi/baki" }, ...reports.map((item) => ({ name: item.location.name, path: `/bazar-analitikasi/${item.location.slug}` }))];
  return <><script {...jsonLd(breadcrumbSchema([{ name: t.home, path: "/" }, { name: t.title, path: "/bazar-analitikasi" }], localeValue))} /><script {...jsonLd(itemListSchema(links, localeValue))} />
    <PageHeader eyebrow="Luxe Home Estate Data" title={t.title} description={t.description} breadcrumbs={[{ label: t.home, href: "/" }, { label: t.title }]} />
    <Section tone="ivory" spacing="cozy"><Container><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Link href="/bazar-analitikasi/baki" className="rounded-md border border-gold bg-paper p-5 transition-transform hover:-translate-y-1"><h2 className="font-display text-xl text-ink">{t.baku}</h2><p className="mt-2 text-sm text-ink-soft">{t.description}</p></Link>{reports.map((item) => <Link key={item.location.slug} href={`/bazar-analitikasi/${item.location.slug}`} className="rounded-md border border-line bg-paper p-5 transition-transform hover:-translate-y-1 hover:border-gold"><h2 className="font-display text-xl text-ink">{item.location.name}</h2><dl className="mt-4 grid gap-2 text-sm"><div><dt className="text-ink-muted">{t.median}</dt><dd className="font-medium text-ink">{item.medianPrice != null ? formatPrice(item.medianPrice) : "—"}</dd></div><div><dt className="text-ink-muted">{t.sqm}</dt><dd className="font-medium text-ink">{item.averagePricePerSqm != null ? `${formatPrice(item.averagePricePerSqm)}/m²` : "—"}</dd></div><div><dt className="text-ink-muted">{t.date}</dt><dd className="text-ink-soft">{item.measuredAt?.toLocaleDateString(localeValue) ?? "—"}</dd></div></dl></Link>)}{reports.length === 0 && <p className="text-sm text-ink-muted">{t.empty}</p>}</div></Container></Section>
  </>;
}
