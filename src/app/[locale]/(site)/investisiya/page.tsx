import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { breadcrumbSchema, buildManagedMetadata, jsonLd } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/constants";
import { localizeLocation } from "@/i18n/dynamic-content";
import { getDistrictYields } from "@/lib/investment";
import { YieldCalculator } from "./yield-calculator";

type Props = { params: Promise<{ locale: string }> };

// Rayon gəlirliyi D1-dəki aktiv elanlardan hesablanır.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: resolved, namespace: "phase3.investor" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/investisiya", locale: resolved });
}

function perSqm(value: number): string {
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₼`;
}

/** İnvestor bölməsi (#107): rayon üzrə icarə gəlirliyi reytinqi və kalkulyator. */
export default async function InvestorPage({ params }: Props) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const [t, navigation, yields] = await Promise.all([
    getTranslations({ locale: resolved, namespace: "phase3.investor" }),
    getTranslations({ locale: resolved, namespace: "navigation" }),
    getDistrictYields(),
  ]);

  return (
    <>
      <script {...jsonLd(breadcrumbSchema([{ name: navigation("home"), path: "/" }, { name: t("eyebrow"), path: "/investisiya" }], resolved))} />
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        breadcrumbs={[{ label: navigation("home"), href: "/" }, { label: t("eyebrow") }]}
      />

      <Section tone="ivory" spacing="cozy">
        <Container size="wide">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <section aria-labelledby="yield-ranking" className="min-w-0 rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-7">
              <h2 id="yield-ranking" className="flex items-center gap-2 font-sans text-xl font-semibold text-ink">
                <TrendingUp className="size-5 text-gold-deep" aria-hidden="true" />
                {t("rankingTitle")}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">{t("rankingDescription")}</p>
              {yields.length === 0 ? (
                <div className="mt-6">
                  <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
                </div>
              ) : (
                <ol className="mt-6 flex flex-col divide-y divide-line">
                  {yields.map((row, index) => (
                    <li key={row.districtId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                      <span className="tabular w-6 text-sm font-semibold text-ink-muted">{index + 1}</span>
                      <Link href={`/rayon/${row.slug}`} className="inline-flex min-h-11 min-w-0 flex-1 items-center font-medium text-ink hover:text-gold-deep">
                        {localizeLocation({ name: row.name }, resolved).name}
                      </Link>
                      <span className="tabular rounded-full bg-success-bg px-2.5 py-0.5 text-sm font-semibold text-success">{row.grossYield}%</span>
                      <span className="w-full pl-10 text-xs text-ink-muted sm:w-auto sm:pl-0">
                        {row.source === "listings"
                          ? t("rowBasis", { sale: perSqm(row.salePerSqm), rent: perSqm(row.rentPerSqm), count: row.saleSamples + row.rentSamples })
                          : t("rowProfile")}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-4 text-xs text-ink-muted">{t("methodology")}</p>
            </section>

            <div className="flex min-w-0 flex-col gap-6">
              <YieldCalculator />
              <div className="on-dark rounded-xl bg-navy p-6 sm:p-7">
                <h2 className="font-sans text-lg font-semibold text-ivory">{t("ctaTitle")}</h2>
                <p className="mt-2 text-sm text-ivory/75">{t("ctaDescription")}</p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link href="/emlaklar?elan=SALE" className={buttonClassName("primary", "md")}>
                    {t("ctaListings")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  <Link href="/elaqe" className={buttonClassName("outline", "md")}>{t("ctaContact")}</Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
