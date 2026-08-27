import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Building2, CalendarCheck, Globe, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { buttonClassName } from "@/components/ui/button";
import { PartnerBadges } from "@/components/site/partner-badge";
import { PartnerLogo } from "@/components/site/partner-logo";
import { PartnerExternalLink } from "@/components/site/partner-external-link";
import { PartnerListingTracker } from "@/components/site/partner-tracking";
import { PropertyCard } from "@/components/site/property-card";
import { ProjectCard } from "@/components/site/project-card";
import { AnalyticsEventBeacon } from "@/components/analytics/analytics-event";
import { Badge } from "@/components/ui/badge";
import {
  breadcrumbSchema,
  buildMetadata,
  jsonLd,
  partnerSchema,
  truncateAtWord,
} from "@/lib/seo";
import { getCachedPartnerBySlug } from "@/lib/public-cache";
import {
  localizePartnerContent,
  normalizePartnershipType,
  normalizeRelationRole,
} from "@/lib/partners";
import { isUnoptimizedImage } from "@/lib/utils";
import type { Locale } from "@/lib/constants";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getCachedPartnerBySlug(slug);

  // `getPartnerBySlug` artıq `publicPartnerWhere()`-dən keçir: qaralama,
  // dayandırılmış və müddəti bitmiş tərəfdaş buraya çatmır və 404 alır.
  if (!data) notFound();

  const t = await getTranslations({ locale, namespace: "partners" });
  const { partner } = data;
  const { shortDescription, description } = localizePartnerContent(partner, locale as Locale);

  const fallbackDescription =
    shortDescription ||
    (description ? truncateAtWord(description.replace(/<[^>]*>/g, " "), 160) : "") ||
    t("detail.metaDescriptionFallback", { name: partner.name });
  // Admin paneldəki SEO sahələri AZ əsas səhifəyə aiddir. Digər dillərdə
  // Azərbaycan dilində metadata göstərməkdənsə lokallaşdırılmış məzmun işlədilir.
  const useCustomSeo = locale === "az";

  return buildMetadata({
    title: (useCustomSeo && partner.seoTitle) || t("detail.metaTitle", { name: partner.name }),
    description: (useCustomSeo && partner.seoDescription) || fallbackDescription,
    path: `/terefdaslar/${partner.slug}`,
    image: partner.coverImage ?? partner.logoUrl ?? undefined,
    ogImage: partner.ogImage,
    locale: locale as Locale,
    keywords: useCustomSeo && partner.seoKeywords
      ? partner.seoKeywords.split(",").map((word) => word.trim()).filter(Boolean)
      : undefined,
  });
}

export default async function PartnerDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const resolvedLocale = locale as Locale;
  const data = await getCachedPartnerBySlug(slug);

  if (!data) notFound();

  const [t, navigationText] = await Promise.all([
    getTranslations({ locale, namespace: "partners" }),
    getTranslations({ locale, namespace: "navigation" }),
  ]);

  const { partner, properties, projects, agencies } = data;
  const { shortDescription, description, disclaimer } = localizePartnerContent(
    partner,
    resolvedLocale,
  );
  const type = normalizePartnershipType(partner.partnershipType);
  const location = [partner.city, partner.country].filter(Boolean).join(", ");
  const officialSinceYear = partner.officialSince
    ? new Date(partner.officialSince).getUTCFullYear()
    : null;

  // Rollar dəst kimi göstərilir: eyni tərəfdaş bir neçə elanda müxtəlif rolda
  // ola bilər, siyahıda təkrarlanmamalıdır.
  const roles = [
    ...new Set([...properties.map((link) => link.role), ...projects.map((link) => link.role)]),
  ];

  return (
    <>
      <script
        {...jsonLd(
          partnerSchema(
            {
              name: partner.name,
              slug: partner.slug,
              legalName: partner.legalName,
              description: shortDescription,
              logoUrl: partner.logoUrl ?? partner.logoLight ?? partner.logoDark,
              websiteUrl: partner.websiteUrl,
              email: partner.email,
              phone: partner.phone,
              address: partner.address,
              city: partner.city,
              country: partner.country,
            },
            resolvedLocale,
          ),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema(
            [
              { name: navigationText("home"), path: "/" },
              { name: t("navLabel"), path: "/terefdaslar" },
              { name: partner.name, path: `/terefdaslar/${partner.slug}` },
            ],
            resolvedLocale,
          ),
        )}
      />

      <AnalyticsEventBeacon
        event="partner_profile_view"
        payload={{ partner_id: partner.id, partner_type: type }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                               */}
      {/* ------------------------------------------------------------------ */}
      <PageHeader
        compact
        eyebrow={t("partnership")}
        title={partner.name}
        description={shortDescription || undefined}
        breadcrumbs={[
          { label: navigationText("home"), href: "/" },
          { label: t("navLabel"), href: "/terefdaslar" },
          { label: partner.name },
        ]}
        actions={<PartnerLogo partner={partner} size="lg" priority />}
      />

      <Section tone="ivory" spacing="compact" className="border-b border-line">
        <Container>
          <div className="flex flex-col gap-4 rounded-md border border-line bg-paper p-5 shadow-sm sm:p-6">
            <PartnerBadges partner={partner} locale={resolvedLocale} />

            <div className="flex min-w-0 flex-col gap-1 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:gap-x-6">
              {location ? (
                <span className="flex min-h-11 min-w-0 items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="[overflow-wrap:anywhere]">{location}</span>
                </span>
              ) : null}

              {/* Tarix yalnız real `officialSince` varsa göstərilir — təxmin edilmir. */}
              {officialSinceYear ? (
                <span className="flex min-h-11 min-w-0 items-center gap-2">
                  <CalendarCheck className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  {t("officialSince", { year: officialSinceYear })}
                </span>
              ) : null}

              {partner.phone ? (
                <a
                  href={`tel:${partner.phone}`}
                  className="flex min-h-11 min-w-0 items-center gap-2 rounded-xs hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Phone className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="[overflow-wrap:anywhere]">{partner.phone}</span>
                </a>
              ) : null}

              {partner.email ? (
                <a
                  href={`mailto:${partner.email}`}
                  className="flex min-h-11 min-w-0 items-center gap-2 rounded-xs hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Mail className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="[overflow-wrap:anywhere]">{partner.email}</span>
                </a>
              ) : null}

              {partner.websiteUrl ? (
                <PartnerExternalLink
                  href={partner.websiteUrl}
                  partnerId={partner.id}
                  partnerType={type}
                  placement="partner_detail"
                  ariaLabel={t("externalSiteAria", { name: partner.name })}
                  className="min-w-0 text-ink-soft hover:text-gold-deep"
                >
                  <Globe className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="break-all">{partner.websiteUrl}</span>
                </PartnerExternalLink>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* ƏMƏKDAŞLIQ HAQQINDA                                                */}
      {/* ------------------------------------------------------------------ */}
      {description || roles.length > 0 ? (
        <Section tone="paper" spacing="cozy">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
              {description ? (
                <div className="flex flex-col gap-4">
                  <h2 className="font-display text-2xl text-ink sm:text-3xl">
                    {t("detail.aboutPartnership")}
                  </h2>
                  {/*
                    HTML saxlama anında `sanitizeContentHtml()` ilə süzülür
                    (bax: `admin/terefdaslar/actions.ts`), ona görə bazadakı
                    dəyər həmişə təhlükəsiz vəziyyətdədir.
                  */}
                  <div
                    className="prose-luxe max-w-none"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              ) : (
                <div />
              )}

              {roles.length > 0 ? (
                <aside className="flex h-fit flex-col gap-4 rounded-md border border-line bg-ivory p-5">
                  <h2 className="font-display text-lg text-ink">{t("detail.directions")}</h2>
                  <ul className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <li key={role}>
                        <Badge tone="neutral">
                          {t(`roles.${normalizeRelationRole(role)}`)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </aside>
              ) : null}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* ƏLAQƏLİ YAŞAYIŞ KOMPLEKSLƏRİ                                       */}
      {/* ------------------------------------------------------------------ */}
      {projects.length > 0 ? (
        <Section tone="ivory" spacing="cozy">
          <Container size="wide">
            <h2 className="mb-8 font-display text-2xl text-ink sm:text-3xl">
              {t("detail.relatedProjects")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((link) => (
                <ProjectCard key={link.project.id} project={link.project} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* ƏLAQƏLİ ELANLAR                                                    */}
      {/* ------------------------------------------------------------------ */}
      {properties.length > 0 ? (
        <Section tone="paper" spacing="cozy">
          <Container size="wide">
            <h2 className="mb-8 font-display text-2xl text-ink sm:text-3xl">
              {t("detail.relatedProperties")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((link) => (
                <PartnerListingTracker
                  key={link.property.id}
                  partnerId={partner.id}
                  partnerType={type}
                  propertyId={link.property.id}
                >
                  <PropertyCard property={link.property} />
                </PartnerListingTracker>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* ƏLAQƏLİ AGENTLİKLƏR                                                */}
      {/* ------------------------------------------------------------------ */}
      {agencies.length > 0 ? (
        <Section tone="ivory" spacing="cozy">
          <Container>
            <h2 className="mb-8 font-display text-2xl text-ink sm:text-3xl">
              {t("detail.relatedAgencies")}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agencies.map((link) => (
                <li key={link.agency.id}>
                  <Link
                    href={`/agentlikler/${link.agency.slug}`}
                    className="flex min-h-20 items-center gap-4 rounded-md border border-line bg-paper p-4 transition-colors hover:border-gold-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-beige">
                      {link.agency.logoUrl ? (
                        <Image
                          src={link.agency.logoUrl}
                          alt=""
                          fill
                          unoptimized={isUnoptimizedImage(link.agency.logoUrl)}
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <Building2 className="size-5 text-ink-muted" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 font-medium text-ink">{link.agency.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Heç bir əlaqəli məzmun yoxdursa səhifə boş görünməsin */}
      {projects.length === 0 && properties.length === 0 && agencies.length === 0 && !description ? (
        <Section tone="paper" spacing="cozy">
          <Container>
            <EmptyState
              title={t("detail.aboutPartnership")}
              description={t("detail.metaDescriptionFallback", { name: partner.name })}
              action={{ label: t("navLabel"), href: "/terefdaslar" }}
            />
          </Container>
        </Section>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* KƏNAR SAYT CTA                                                     */}
      {/* ------------------------------------------------------------------ */}
      {partner.websiteUrl ? (
        <Section tone="beige" spacing="cozy">
          <Container>
            <div className="flex flex-col items-start gap-5 sm:items-center sm:text-center">
              <PartnerLogo partner={partner} size="lg" />
              <p className="max-w-xl text-base leading-relaxed text-ink-soft">
                {shortDescription || t("detail.metaDescriptionFallback", { name: partner.name })}
              </p>
              <PartnerExternalLink
                href={partner.websiteUrl}
                partnerId={partner.id}
                partnerType={type}
                placement="partner_detail"
                ariaLabel={t("externalSiteAria", { name: partner.name })}
                className={buttonClassName("primary")}
              >
                {t("detail.visitWebsite")}
              </PartnerExternalLink>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Hüquqi bildiriş — mətn tamamilə admin tərəfindən idarə olunur */}
      {disclaimer ? (
        <Section tone="paper" spacing="compact">
          <Container>
            <p className="max-w-[70ch] text-xs leading-6 text-ink-muted">{disclaimer}</p>
          </Container>
        </Section>
      ) : null}

      {/* Alt naviqasiya — ziyarətçi tərəfdaşlar siyahısına qayıda bilsin */}
      <Section tone="ivory" spacing="compact">
        <Container>
          <Link
            href="/terefdaslar"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-gold-deep"
          >
            {t("navLabel")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Container>
      </Section>
    </>
  );
}
