import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
