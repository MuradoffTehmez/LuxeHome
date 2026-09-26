import type { Metadata } from "next";
import { ArrowUpRight, BarChart3 } from "lucide-react";
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
    <Section tone="ivory" spacing="cozy"><Container><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"><Link href="/bazar-analitikasi/baki" className="on-dark group relative flex flex-col gap-4 overflow-hidden rounded-xl bg-navy p-6 shadow-md transition-transform duration-300 hover:-translate-y-1 sm:p-7"><span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgb(196_165_117/0.3),transparent_45%)]" /><span className="relative grid size-12 place-items-center rounded-md bg-gold/20 text-gold-soft"><BarChart3 className="size-6" aria-hidden="true" /></span><h2 className="relative font-sans text-xl font-semibold text-ivory">{t.baku}</h2><p className="relative text-sm leading-relaxed text-ivory/75">{t.description}</p><ArrowUpRight className="absolute top-6 right-6 size-5 text-gold-soft transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /></Link>{reports.map((item) => <Link key={item.location.slug} href={`/bazar-analitikasi/${item.location.slug}`} className="card-surface p-6"><h2 className="font-sans text-xl font-semibold text-ink">{item.location.name}</h2><dl className="mt-4 grid gap-2 text-sm"><div><dt className="text-ink-muted">{t.median}</dt><dd className="font-medium text-ink">{item.medianPrice != null ? formatPrice(item.medianPrice) : "—"}</dd></div><div><dt className="text-ink-muted">{t.sqm}</dt><dd className="font-medium text-ink">{item.averagePricePerSqm != null ? `${formatPrice(item.averagePricePerSqm)}/m²` : "—"}</dd></div><div><dt className="text-ink-muted">{t.date}</dt><dd className="text-ink-soft">{item.measuredAt?.toLocaleDateString(localeValue) ?? "—"}</dd></div></dl></Link>)}{reports.length === 0 && <p className="flex items-center rounded-xl border border-dashed border-line-strong bg-paper/60 p-6 text-sm text-ink-muted">{t.empty}</p>}</div></Container></Section>
  </>;
}
