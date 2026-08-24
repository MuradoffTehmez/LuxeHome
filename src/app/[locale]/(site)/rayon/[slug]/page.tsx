import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { SeoLandingPage } from "@/components/site/seo-landing-page";
import { routing } from "@/i18n/routing";
import { type Locale } from "@/lib/constants";
import { getTaxonomyLandingProperties } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata, faqSchema, itemListSchema, jsonLd } from "@/lib/seo";
import { buildTaxonomyLandingDescriptor, MIN_INDEXABLE_LISTINGS } from "@/lib/seo-landings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pageNumber(value: string | string[] | undefined) {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  const page = pageNumber(query.sehife);
  const result = page ? await getTaxonomyLandingProperties("DISTRICT", slug, page) : null;
  if (!page || !result || result.total < MIN_INDEXABLE_LISTINGS) return {};
  const landing = buildTaxonomyLandingDescriptor("DISTRICT", result.location);
  const canonicalPath = page > 1 ? `${landing.path}?sehife=${page}` : landing.path;
  return buildMetadata({
    title: page > 1 ? `${landing.title} — ${page}-ci səhifə` : landing.title,
    description: landing.description,
    path: canonicalPath,
    canonicalPath,
    locale: (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale,
  });
}

export default async function DistrictLandingPage({ params, searchParams }: Props) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  const page = pageNumber(query.sehife);
  if (!page || Object.keys(query).some((key) => key !== "sehife")) notFound();
  const result = await getTaxonomyLandingProperties("DISTRICT", slug, page);
  if (!result || result.total < MIN_INDEXABLE_LISTINGS || page > result.totalPages) notFound();
  const landing = buildTaxonomyLandingDescriptor("DISTRICT", result.location);
  const localeValue = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;

  return (
    <>
      <script {...jsonLd(breadcrumbSchema([{ name: "Ana səhifə", path: "/" }, { name: "Əmlaklar", path: "/emlaklar" }, { name: landing.h1, path: landing.path }]))} />
      <script {...jsonLd(faqSchema(landing.faq, landing.path))} />
      <script {...jsonLd(itemListSchema(result.items.map((item) => ({ name: item.title, path: `/emlaklar/${item.slug}` }))))} />
      <SeoLandingPage landing={landing} locale={localeValue} {...result} />
    </>
  );
}
