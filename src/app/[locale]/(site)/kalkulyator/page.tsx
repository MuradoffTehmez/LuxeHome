import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { MortgageCalculator } from "@/components/site/mortgage-calculator";
import { breadcrumbSchema, buildMetadata, jsonLd } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/constants";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "knowledge.calculator" });

  return buildMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/kalkulyator",
    locale: resolved as Locale,
  });
}

/**
 * Hesablayıcı səhifəsi D1-ə müraciət etmir, ona görə `force-dynamic` yoxdur:
 * bütün hesablama brauzerdə aparılır və səhifə statik render oluna bilər.
 */
export default async function CalculatorPage({ params }: Props) {
  const { locale } = await params;
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "knowledge" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigation("home"), path: "/" },
              { name: t("hub.eyebrow"), path: "/bilik-merkezi" },
              { name: t("calculator.title"), path: "/kalkulyator" },
            ],
            locale as Locale,
          ),
        )}
      />

      <PageHeader
        eyebrow={t("calculator.eyebrow")}
        title={t("calculator.title")}
        description={t("calculator.description")}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: t("hub.eyebrow"), href: "/bilik-merkezi" },
          { label: t("calculator.title") },
        ]}
      />

      <Section tone="ivory" spacing="cozy">
        <Container>
          <MortgageCalculator />
        </Container>
      </Section>
    </>
  );
}
