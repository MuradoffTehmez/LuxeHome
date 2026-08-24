import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  return locale === routing.defaultLocale
    ? {}
    : {
        robots: {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true, "max-image-preview": "large" },
        },
      };
}

/**
 * Lokallaşdırılmış ictimai ağacın kökü. `localePrefix: "as-needed"` səbəbindən
 * default dil (AZ) heç bir prefikslə buraya çatmır — yalnız `/en/...`, `/ru/...`
 * bu layout-dan keçir. Naməlum `[locale]` dəyəri 404 verir.
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

  return children;
}
