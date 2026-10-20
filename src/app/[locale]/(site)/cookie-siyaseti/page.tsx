import type { Metadata } from "next";
import { CookiePreferencesButton } from "@/components/analytics/cookie-preferences-button";
import { LocalizedLegalPage } from "@/components/site/localized-legal-page";
import { LEGAL_ANCHORS, getLegalDocuments } from "@/i18n/legal";
import type { Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

function documents(locale: Locale) {
  return getLegalDocuments(locale);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const document = documents(locale as Locale).cookies;
  return buildManagedMetadata({
    title: document.title,
    description: document.metaDescription,
    path: "/cookie-siyaseti",
    locale: locale as Locale,
  });
}

export default async function CookiePage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <LocalizedLegalPage
      document={documents(locale as Locale).cookies}
      documentKey="cookies"
      path="/cookie-siyaseti"
      // «Razılığın idarə edilməsi» bölməsi: düymə seçimin dəyişdirilməsini izah edən mətnin altındadır.
      actionAfterSection={{ id: LEGAL_ANCHORS.consent, node: <CookiePreferencesButton variant="page" /> }}
    />
  );
}
