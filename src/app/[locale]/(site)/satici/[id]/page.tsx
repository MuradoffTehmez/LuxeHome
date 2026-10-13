import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Building2, ShieldCheck } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PropertyCard } from "@/components/site/property-card";
import { Link } from "@/i18n/navigation";
import { buildManagedMetadata } from "@/lib/seo";
import { getSellerProfile } from "@/lib/queries";
import { listingPublisherBadge } from "@/lib/accounts/listing-publisher";
import { formatLocalizedDate } from "@/i18n/date";
import { localizePath } from "@/i18n/path-locale";
import { ACCOUNT_TYPES, type Locale } from "@/lib/constants";

// D1-dən oxuyur — binding yalnız sorğu kontekstindədir.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

/** Göstəriş adı: agentlikdə agentliyin, korporativdə şirkətin adı. */
function sellerName(seller: NonNullable<Awaited<ReturnType<typeof getSellerProfile>>>["seller"]): string {
  if (seller.accountType === ACCOUNT_TYPES.AGENCY && seller.agency) return seller.agency.name;
  if (seller.accountType === ACCOUNT_TYPES.CORPORATE && seller.companyName) return seller.companyName;
  return seller.name;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const data = await getSellerProfile(id);
  if (!data) notFound();
  const t = await getTranslations({ locale, namespace: "content.seller" });
  const name = sellerName(data.seller);
  return buildManagedMetadata({
    title: t("metaTitle", { name }),
    description: t("metaDescription", { name, count: data.propertyCount }),
    path: `/satici/${data.seller.id}`,
    // Şəxsi satıcı səhifəsi axtarış indeksinə düşmür — elanların öz səhifələri indekslənir.
    indexPolicy: "noindex-follow",
    locale: locale as Locale,
  });
}

/** Satıcının bütün aktiv elanları — elan səhifəsindəki «Satıcının bütün elanları» linki. */
export default async function SellerPage({ params }: Props) {
  const { locale, id } = await params;
  const data = await getSellerProfile(id);
  if (!data) notFound();
  const { seller, properties, propertyCount } = data;

  // Təsdiqlənmiş agentliyin öz səhifəsi var — dublikat səhifə yaratmırıq.
  if (seller.accountType === ACCOUNT_TYPES.AGENCY && seller.agency?.isVerified) {
    permanentRedirect(localizePath(`/agentlikler/${seller.agency.slug}`, locale as Locale));
  }

  const [t, propertyText, navigation] = await Promise.all([
    getTranslations({ locale, namespace: "content.seller" }),
    getTranslations({ locale, namespace: "property" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);
  const badge = listingPublisherBadge(seller);
  const name = sellerName(seller);

  return (
    <>
      <PageHeader
        compact
        eyebrow={badge.kind === "company" || badge.kind === "private" ? t("eyebrow") : propertyText(`publisher.${badge.kind}`)}
        title={name}
        description={t("memberSince", { date: formatLocalizedDate(seller.createdAt, locale as Locale, "monthYear") ?? "" })}
        breadcrumbs={[
          { label: navigation("home"), href: "/" },
          { label: navigation("properties"), href: "/emlaklar" },
          { label: name },
        ]}
      />

      <Section tone="ivory" spacing="compact" className="border-b border-line">
        <Container>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{t("listingCount", { count: propertyCount })}</Badge>
            {badge.agency && (
              <Badge tone={badge.agency.isVerified ? "success" : "neutral"}>
                {badge.agency.isVerified ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : <Building2 className="size-3.5" aria-hidden="true" />}
                {propertyText("publisher.agencyNamed", { name: badge.agency.name })}
              </Badge>
            )}
            {badge.agency?.isVerified && (
              <Link
                href={`/agentlikler/${badge.agency.slug}`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-gold-deep underline-offset-4 hover:underline"
              >
                {t("agencyPage")}
              </Link>
            )}
          </div>
        </Container>
      </Section>

      <Section tone="paper" spacing="cozy">
        <Container>
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          )}
        </Container>
      </Section>
    </>
  );
}
