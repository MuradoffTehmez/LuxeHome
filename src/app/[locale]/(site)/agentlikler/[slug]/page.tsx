import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Building2, Globe, MapPin, Phone } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PropertyCard } from "@/components/site/property-card";
import { agencySchema, buildMetadata, jsonLd, breadcrumbSchema } from "@/lib/seo";
import { getAgencyBySlug } from "@/lib/queries";
import { isUnoptimizedImage } from "@/lib/utils";
import { TrackedAnchor } from "@/components/analytics/analytics-event";
import type { Locale } from "@/lib/constants";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "listings.detail" });
  const data = await getAgencyBySlug(slug);

  if (!data) notFound();

  return buildMetadata({
    title: data.agency.name,
    description: data.agency.description || t("agencyFallback", { name: data.agency.name }),
    path: `/agentlikler/${data.agency.slug}`,
    image: data.agency.logoUrl ?? undefined,
    locale: locale as Locale,
  });
}

export default async function AgencyDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const [t, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "listings.detail" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);
  const data = await getAgencyBySlug(slug);

  if (!data) notFound();

  const { agency, properties } = data;

  return (
    <>
      <script {...jsonLd(agencySchema(agency, locale as Locale))} />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: navigation("home"), path: "/" },
            { name: navigation("agencies"), path: "/agentlikler" },
            { name: agency.name, path: `/agentlikler/${agency.slug}` },
          ], locale as Locale),
        )}
      />

      <PageHeader
        compact
        eyebrow={t("verifiedAgency")}
        title={agency.name}
        description={agency.description || undefined}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: navigation("agencies"), href: "/agentlikler" },
          { label: agency.name },
        ]}
        actions={
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-beige sm:size-24">
              {agency.logoUrl ? (
                <Image
                  src={agency.logoUrl}
                  alt={agency.name}
                  fill
                  unoptimized={isUnoptimizedImage(agency.logoUrl)}
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <Building2 className="size-9 text-ink-muted" aria-hidden="true" />
              )}
            </div>
        }
      />

      <Section tone="ivory" spacing="compact" className="border-b border-line">
        <Container>
          <div className="rounded-md border border-line bg-paper p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="gold">{t("verifiedAgency")}</Badge>
              <Badge tone="neutral">{t("activeListingCount", { count: properties.length })}</Badge>
            </div>
              <div className="flex min-w-0 flex-col gap-1 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:gap-x-6">
                {agency.phone && (
                  <TrackedAnchor event="agency_contact" payload={{ agency_id: agency.id, method: "phone" }} href={`tel:${agency.phone}`} className="flex min-h-11 min-w-0 items-center gap-2 rounded-xs hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                    <Phone className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="[overflow-wrap:anywhere]">{agency.phone}</span>
                  </TrackedAnchor>
                )}
                {agency.address && (
                  <span className="flex min-h-11 min-w-0 items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="[overflow-wrap:anywhere]">{agency.address}</span>
                  </span>
                )}
                {agency.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 min-w-0 items-center gap-2 rounded-xs hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <Globe className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="break-all">{agency.website}</span>
                  </a>
                )}
              </div>
          </div>
        </Container>
      </Section>

      <Section tone="paper" spacing="cozy">
        <Container>
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">{t("agencyListings")}</h2>
            <p className="text-sm text-ink-soft">
              {t("agencyListingsDescription", { name: agency.name })}
            </p>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("agencyEmptyTitle")}
              description={t("agencyEmptyDescription")}
            />
          )}
        </Container>
      </Section>
    </>
  );
}
