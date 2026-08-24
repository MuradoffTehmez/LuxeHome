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
  buildMetadata,
} from "@/lib/seo";
import { findSeoLanding, getSeoLandingRouteLabels, localizeSeoLanding, seoLandingIndexPolicy } from "@/lib/seo-landings";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; seoLanding: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getLandingResult = cache(getSeoLandingProperties);

function readPage(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, seoLanding }, query] = await Promise.all([params, searchParams]);
  const sourceLanding = findSeoLanding(seoLanding);
  if (!sourceLanding) return {};
  const page = readPage(query.sehife);
  if (!page) return {};
  const result = await getLandingResult(sourceLanding, page);
  const resolvedLocale = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const landing = localizeSeoLanding(sourceLanding, resolvedLocale);
  const labels = getSeoLandingRouteLabels(resolvedLocale);
  const canonicalPath = page && page > 1 ? `${landing.path}?sehife=${page}` : landing.path;

  return buildMetadata({
    title: page && page > 1 ? `${landing.title}${labels.pageSuffix(page)}` : landing.title,
    description: landing.description,
    path: canonicalPath,
    canonicalPath,
    indexPolicy:
      page > result.totalPages ? "noindex-follow" : seoLandingIndexPolicy(result.total),
    locale: resolvedLocale,
  });
}

export default async function FixedSeoLandingPage({ params, searchParams }: Props) {
  const [{ locale, seoLanding }, query] = await Promise.all([params, searchParams]);
  const sourceLanding = findSeoLanding(seoLanding);
  const page = readPage(query.sehife);
  const hasExtraParams = Object.keys(query).some((key) => key !== "sehife");
  if (!sourceLanding || !page || hasExtraParams) notFound();

  const result = await getLandingResult(sourceLanding, page);
  if (page > result.totalPages) notFound();
  const resolvedLocale = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const landing = localizeSeoLanding(sourceLanding, resolvedLocale);
  const labels = getSeoLandingRouteLabels(resolvedLocale);

  return (
    <>
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: labels.home, path: "/" },
            { name: labels.properties, path: "/emlaklar" },
            { name: landing.h1, path: landing.path },
          ]),
        )}
      />
      <script {...jsonLd(faqSchema(landing.faq, landing.path))} />
      <script
        {...jsonLd(
          itemListSchema(
            result.items.map((item) => ({ name: item.title, path: `/emlaklar/${item.slug}` })),
          ),
        )}
      />
      <SeoLandingPage landing={landing} locale={resolvedLocale} {...result} />
    </>
  );
}
