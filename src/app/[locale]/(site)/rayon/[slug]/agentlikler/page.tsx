import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Building2 } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { AgencyCard } from "@/components/site/agency-card";
import { routing } from "@/i18n/routing";
import { localizeLocation } from "@/i18n/dynamic-content";
import { getAgencyArea, getPublicAgencyCatalog } from "@/lib/agency-profile";
import { breadcrumbSchema, buildManagedMetadata, itemListSchema, jsonLd } from "@/lib/seo";
import type { Locale } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Bu saydan az agentlikli ərazi səhifəsi indeksə verilmir — nazik məzmun olardı. */
const MIN_INDEXABLE_AGENCIES = 2;

async function load(locale: string, slug: string) {
  const localeValue = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const area = await getAgencyArea(slug);
  if (!area) return null;
  const agencies = await getPublicAgencyCatalog({ area: area.slug });
  return { localeValue, area, place: localizeLocation(area, localeValue).name, agencies };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await load(locale, slug);
  if (!data) return {};
  const t = await getTranslations({ locale: data.localeValue, namespace: "listings.areaAgencies" });
  return buildManagedMetadata({
    title: t("metaTitle", { place: data.place }),
    description: t("metaDescription", { place: data.place, count: data.agencies.length }),
    path: `/rayon/${data.area.slug}/agentlikler`,
    indexPolicy: data.agencies.length >= MIN_INDEXABLE_AGENCIES ? "index" : "noindex-follow",
    locale: data.localeValue,
  });
}

/**
 * Ərazidə fəal agentliklər — SEO landing (#161, C6): «Yasamalda agentliklər» tipli axtarış
 * üçün. Sıra ərazidəki aktiv təklif sayınadır; rayon səhifəsi buraya keçid verir.
 */
export default async function AreaAgenciesPage({ params, searchParams }: Props) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  if (Object.keys(query).length > 0) notFound();
  const data = await load(locale, slug);
  if (!data) notFound();
  const [t, labels] = await Promise.all([
    getTranslations({ locale: data.localeValue, namespace: "listings.areaAgencies" }),
    getTranslations({ locale: data.localeValue, namespace: "navigation" }),
  ]);
  const path = `/rayon/${data.area.slug}/agentlikler`;

  return (
    <>
      <script
        {...jsonLd(breadcrumbSchema([
          { name: labels("home"), path: "/" },
          { name: data.place, path: `/rayon/${data.area.slug}` },
          { name: t("title", { place: data.place }), path },
        ], data.localeValue))}
      />
      {data.agencies.length > 0 && (
        <script {...jsonLd(itemListSchema(data.agencies.map((agency) => ({ name: agency.name, path: `/agentlikler/${agency.slug}` })), data.localeValue))} />
      )}
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title", { place: data.place })}
        description={t("description", { place: data.place, count: data.agencies.length })}
      />
      <Section tone="ivory">
        <Container>
          {data.agencies.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.agencies.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} areaName={data.place} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Building2 className="size-6" aria-hidden="true" />}
              title={t("emptyTitle")}
              description={t("emptyDescription", { place: data.place })}
              action={{ label: t("allAgencies"), href: "/agentlikler" }}
            />
          )}
        </Container>
      </Section>
    </>
  );
}
