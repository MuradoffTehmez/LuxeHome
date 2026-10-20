import type { Metadata } from "next";
import { LocalizedLegalPage } from "@/components/site/localized-legal-page";
import { getLegalDocuments } from "@/i18n/legal";
import type { Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

function documents(locale: Locale) {
  return getLegalDocuments(locale);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const document = documents(locale as Locale).terms;
  return buildManagedMetadata({
    title: document.title,
    description: document.metaDescription,
    path: "/istifade-sertleri",
    locale: locale as Locale,
  });
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <LocalizedLegalPage
      document={documents(locale as Locale).terms}
      documentKey="terms"
      path="/istifade-sertleri"
    />
  );
}
