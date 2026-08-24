import type { Metadata } from "next";
import type { Locale } from "@/lib/constants";
import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { buildMetadata } from "@/lib/seo";
import { CompareTable } from "./compare-table";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.comparePage" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/muqayise", locale: locale as Locale, indexPolicy: "noindex-follow" });
}

export default async function ComparePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.comparePage" });
  return (
    <Section tone="ivory" spacing="cozy">
      <Container>
        <SectionHeader
          as="h1"
          overline={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          className="mb-8"
        />
        <CompareTable />
      </Container>
    </Section>
  );
}
