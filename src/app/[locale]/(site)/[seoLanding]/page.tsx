import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { SeoLandingPage } from "@/components/site/seo-landing-page";
import { routing } from "@/i18n/routing";
import { type Locale } from "@/lib/constants";
import { getSeoLandingProperties } from "@/lib/queries";
import {
  breadcrumbSchema,
  faqSchema,
  itemListSchema,
  jsonLd,
  buildManagedMetadata,
} from "@/lib/seo";
import { findSeoLanding, getSeoLandingRouteLabels, localizeSeoLanding, seoLandingIndexPolicy } from "@/lib/seo-landings";
import { getPublishedDbSeoLanding } from "@/lib/seo-db-landings";
import { landingCanBeIndexed } from "@/lib/serp";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; seoLanding: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getLandingResult = cache(getSeoLandingProperties);
const getDbLanding = cache(getPublishedDbSeoLanding);

function readPage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, seoLanding }, query] = await Promise.all([params, searchParams]);
  const resolvedLocale = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const sourceLanding = findSeoLanding(seoLanding);
  const dbLanding = sourceLanding ? null : await getDbLanding(seoLanding, resolvedLocale);
  if (!sourceLanding && !dbLanding) return {};
  const page = readPage(query.sehife);
  if (!page) return {};
  const landing = sourceLanding ? localizeSeoLanding(sourceLanding, resolvedLocale) : dbLanding!.landing;
  const result = await getLandingResult(landing, page);
  const labels = getSeoLandingRouteLabels(resolvedLocale);
  const canonicalPath = page && page > 1 ? `${landing.path}?sehife=${page}` : landing.path;

  return buildManagedMetadata({
    title: page && page > 1 ? `${landing.title}${labels.pageSuffix(page)}` : landing.title,
    description: landing.description,
    path: canonicalPath,
    indexPolicy: page > result.totalPages ? "noindex-follow" : dbLanding
      ? (landingCanBeIndexed({ indexable: dbLanding.policy.indexable, indexEmpty: dbLanding.policy.indexEmpty, inventoryCount: result.total, minInventory: dbLanding.policy.minInventory, hasUniqueContent: landing.content.join(" ").split(/\s+/).length >= 80 }) ? "index" : "noindex-follow")
      : seoLandingIndexPolicy(result.total),
    canonicalPath: dbLanding?.policy.canonical || canonicalPath,
    locale: resolvedLocale,
  });
}

export default async function FixedSeoLandingPage({ params, searchParams }: Props) {
  const [{ locale, seoLanding }, query] = await Promise.all([params, searchParams]);
  const resolvedLocale = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const sourceLanding = findSeoLanding(seoLanding);
  const dbLanding = sourceLanding ? null : await getDbLanding(seoLanding, resolvedLocale);
  const page = readPage(query.sehife);
  const hasExtraParams = Object.keys(query).some((key) => key !== "sehife");
  if ((!sourceLanding && !dbLanding) || !page || hasExtraParams) notFound();

  const landing = sourceLanding ? localizeSeoLanding(sourceLanding, resolvedLocale) : dbLanding!.landing;
  const result = await getLandingResult(landing, page);
  if (page > result.totalPages) notFound();
  const labels = getSeoLandingRouteLabels(resolvedLocale);

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: labels.home, path: "/" },
            { name: labels.properties, path: "/emlaklar" },
            { name: landing.h1, path: landing.path },
          ], resolvedLocale),
        )}
      />
      <script {...jsonLd(faqSchema(landing.faq, landing.path, resolvedLocale))} />
      <script
        {...jsonLd(
          itemListSchema(
            result.items.map((item) => ({ name: item.title, path: `/emlaklar/${item.slug}` })),
            resolvedLocale,
          ),
        )}
      />
      <SeoLandingPage landing={landing} locale={resolvedLocale} {...result} />
    </>
  );
}
