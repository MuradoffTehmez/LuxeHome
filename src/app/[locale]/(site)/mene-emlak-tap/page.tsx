import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { routing } from "@/i18n/routing";
import { getCachedFilterOptions } from "@/lib/public-cache";
import { buildMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/constants";
import { PropertyWizard } from "./property-wizard";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "phase2.wizard" });
  return buildMetadata({ title: t("title"), description: t("description"), path: "/mene-emlak-tap", locale: resolved });
}

export default async function PropertyWizardPage({ params }: Props) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: resolved, namespace: "phase2.wizard" });
  const options = await getCachedFilterOptions();
  const types = options.types.map((type) => ({ value: type.slug, label: localizeKnownContent("propertyType", type, resolved).name }));
  const cities = options.cities.map((city) => ({ value: city.slug, label: localizeLocation(city, resolved).name, districts: city.children.map((district) => ({ value: district.slug, label: localizeLocation(district, resolved).name })) }));
  return (
    <Section tone="ivory" spacing="cozy">
      <Container>
        <SectionHeader overline={t("eyebrow")} title={t("title")} description={t("description")} />
        <div className="mt-10"><PropertyWizard types={types} cities={cities} /></div>
      </Container>
    </Section>
  );
}
