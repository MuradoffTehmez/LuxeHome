import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { FaqGroups } from "@/components/site/faq-groups";
import { buildMetadata, faqSchema, jsonLd } from "@/lib/seo";
import { getCachedFaqEntries } from "@/lib/public-cache";
import { groupFaqByCategory } from "@/lib/knowledge";
import { getRealEstateFaqContent } from "@/i18n/public-content";
import { TRANSLATION_ENTITY_TYPES, type FaqCategory, type Locale } from "@/lib/constants";
import { applyContentTranslation, getPublishedContentTranslation } from "@/lib/content-translation";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "knowledge.legalFaq" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/bilik-merkezi/suallar", locale: locale as Locale });
}

export default async function RealEstateFaqPage({ params }: Props) {
  const { locale } = await params;
  const activeLocale = locale as Locale;
  const [t, navigation, knowledge, entries] = await Promise.all([
    getTranslations({ locale, namespace: "knowledge.legalFaq" }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "knowledge" }),
    getCachedFaqEntries(),
  ]);
  const realEstateEntries = entries.filter((entry) => entry.category !== "PLATFORM");
  const localized = await Promise.all(realEstateEntries.map(async (entry) => applyContentTranslation(TRANSLATION_ENTITY_TYPES.KNOWLEDGE_FAQ, entry, await getPublishedContentTranslation(TRANSLATION_ENTITY_TYPES.KNOWLEDGE_FAQ, entry.id, activeLocale))));
  const groups = localized.length > 0
    ? groupFaqByCategory(localized).map(([category, items]) => ({ title: knowledge(`faq.categories.${category as FaqCategory}`), items: items.map(({ question, answer }) => ({ question, answer })) }))
    : getRealEstateFaqContent(activeLocale);
  const items = groups.flatMap((group) => group.items);

  return (
    <>
      <script {...jsonLd(faqSchema(items, "/bilik-merkezi/suallar", activeLocale))} />
      <PageHeader compact eyebrow={t("eyebrow")} title={t("title")} description={t("description")} breadcrumbs={[{ label: navigation("home"), href: "/" }, { label: knowledge("hub.eyebrow"), href: "/bilik-merkezi" }, { label: t("breadcrumb") }]} />
      <Section spacing="cozy"><Container size="narrow"><FaqGroups groups={groups} answersAreHtml={localized.length > 0} /></Container></Section>
    </>
  );
}
