import { Container, Section } from "@/components/ui/container";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/constants";
import { SectionHeader } from "@/components/ui/section-header";
import { buildMetadata } from "@/lib/seo";
import { FavoritesList } from "./favorites-list";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.favoritesPage" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/favoritler", locale: locale as Locale, indexPolicy: "noindex-follow" });
}

export default async function FavoritesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "listings.favoritesPage" });
  return (
    <Section tone="ivory">
      <Container>
        <SectionHeader
          as="h1"
          overline={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
        <div className="mt-10">
          <FavoritesList />
        </div>
      </Container>
    </Section>
  );
}
