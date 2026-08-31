import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/states";
import { SectionHeader } from "@/components/ui/section-header";
import { PropertyCard } from "@/components/site/property-card";
import { buildManagedMetadata } from "@/lib/seo";
import { searchPropertiesWithAi } from "@/lib/phase3-search";
import type { Locale } from "@/lib/constants";
import { AiSearchForm } from "@/components/site/ai-search-form";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: "phase3.search" });
  return buildManagedMetadata({ title: t("title"), description: t("description"), path: "/ai-axtaris", locale: locale as Locale });
}

export default async function AiSearchPage({ params, searchParams }: Props) {
  const [{ locale }, { q = "" }] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "phase3.search" });
  const result = q ? await searchPropertiesWithAi(q) : null;
  return <>
    <Section tone="beige" spacing="cozy"><Container><SectionHeader as="h1" overline={t("overline")} title={t("title")} description={t("description")} /><div className="mt-8"><AiSearchForm initialQuery={q} labels={{ placeholder: t("placeholder"), submit: t("submit"), example: t("example") }} /></div></Container></Section>
    {result && <Section tone="ivory" spacing="cozy"><Container>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl text-ink">{t("results", { count: result.items.length })}</h2><p className="mt-1 text-sm text-ink-muted">{t("realOnly")}</p></div><Badge tone="info">{result.model === "deterministic-fallback" ? t("fallback") : t("aiParsed")}</Badge></div>
      {result.clarification && <p className="mb-6 rounded-sm border border-gold/40 bg-gold/10 p-4 text-sm text-ink">{result.clarification}</p>}
      {result.items.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{result.items.map((item) => <div key={item.property.id} className="relative"><div className="absolute top-3 right-3 z-20 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white shadow">{item.score}% {t("match")}</div><PropertyCard property={item.property} /><ul className="mt-2 space-y-1 px-1 text-xs text-ink-muted">{item.reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}</ul></div>)}</div> : <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} action={{ label: t("allListings"), href: "/emlaklar" }} />}
    </Container></Section>}
  </>;
}
