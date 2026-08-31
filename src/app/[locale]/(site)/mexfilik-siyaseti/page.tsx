import type { Metadata } from "next";
import { LocalizedLegalPage } from "@/components/site/localized-legal-page";
import { siteConfig } from "@/config/site";
import { getLegalDocuments } from "@/i18n/public-content";
import type { Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

function documents(locale: Locale) {
  return getLegalDocuments(locale, {
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    ownerName: siteConfig.owner.name,
    email: siteConfig.email,
    phone: siteConfig.phone,
    address: siteConfig.addressFull,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const document = documents(locale as Locale).privacy;
  return buildManagedMetadata({
    title: document.title,
    description: document.metaDescription,
    path: "/mexfilik-siyaseti",
    locale: locale as Locale,
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <LocalizedLegalPage
      document={documents(locale as Locale).privacy}
      path="/mexfilik-siyaseti"
      email={siteConfig.email}
      phone={siteConfig.phone}
      phoneHref={siteConfig.phoneHref}
    />
  );
}
