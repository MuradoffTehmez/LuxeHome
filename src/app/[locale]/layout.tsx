import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { LocaleDocumentSync } from "@/components/site/locale-document-sync";
import type { Locale } from "@/lib/constants";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return {};
}

/**
 * Lokallaşdırılmış istifadəçi ağacının kökü. Bütün dillər, o cümlədən AZ,
 * məcburi locale prefiksi ilə buradan keçir. Naməlum `[locale]` dəyəri 404 verir.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <>
      <LocaleDocumentSync locale={locale as Locale} />
      {children}
    </>
  );
}
