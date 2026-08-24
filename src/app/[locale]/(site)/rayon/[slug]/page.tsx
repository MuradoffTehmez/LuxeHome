import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { SeoLandingPage } from "@/components/site/seo-landing-page";
import { routing } from "@/i18n/routing";
import { type Locale } from "@/lib/constants";
import { getTaxonomyLandingProperties } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata, faqSchema, itemListSchema, jsonLd } from "@/lib/seo";
import { buildTaxonomyLandingDescriptor, getSeoLandingRouteLabels, seoLandingIndexPolicy } from "@/lib/seo-landings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getDistrictLandingResult = cache((slug: string, page: number) =>
  getTaxonomyLandingProperties("DISTRICT", slug, page),
);

function pageNumber(value: string | string[] | undefined) {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  const page = pageNumber(query.sehife);
  const result = page ? await getDistrictLandingResult(slug, page) : null;
  if (!page || !result) return {};
  const localeValue = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const landing = buildTaxonomyLandingDescriptor("DISTRICT", result.location, localeValue);
  const labels = getSeoLandingRouteLabels(localeValue);
  const canonicalPath = page > 1 ? `${landing.path}?sehife=${page}` : landing.path;
  return buildMetadata({
    title: page > 1 ? `${landing.title}${labels.pageSuffix(page)}` : landing.title,
    description: landing.description,
    path: canonicalPath,
    canonicalPath,
    indexPolicy:
      page > result.totalPages ? "noindex-follow" : seoLandingIndexPolicy(result.total),
    locale: localeValue,
  });
}

export default async function DistrictLandingPage({ params, searchParams }: Props) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  const page = pageNumber(query.sehife);
  if (!page || Object.keys(query).some((key) => key !== "sehife")) notFound();
  const result = await getDistrictLandingResult(slug, page);
  if (!result || page > result.totalPages) notFound();
  const localeValue = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const landing = buildTaxonomyLandingDescriptor("DISTRICT", result.location, localeValue);
  const labels = getSeoLandingRouteLabels(localeValue);

  return (
    <>
      <script {...jsonLd(breadcrumbSchema([{ name: labels.home, path: "/" }, { name: labels.properties, path: "/emlaklar" }, { name: landing.h1, path: landing.path }], localeValue))} />
      <script {...jsonLd(faqSchema(landing.faq, landing.path, localeValue))} />
      <script {...jsonLd(itemListSchema(result.items.map((item) => ({ name: item.title, path: `/emlaklar/${item.slug}` })), localeValue))} />
      <SeoLandingPage landing={landing} locale={localeValue} {...result} />
    </>
  );
}
