import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  BedDouble,
  FileCheck,
  Maximize,
  MapPin,
  Layers,
  CheckCircle2,
  Phone,
  ArrowRight,
  Crown,
  History,
  Navigation,
  Star,
} from "lucide-react";
import { formatPrice, toIsoDateTime } from "@/lib/utils";
import {
  LISTING_TYPES,
  AUTH_KINDS,
  PROPERTY_STATUS_TONE,
  TRANSLATION_ENTITY_TYPES,
  type PropertyStatus,
  type Locale,
} from "@/lib/constants";
import { getPropertyPartners, getSimilarProperties } from "@/lib/queries";
import { getCachedPropertyBySlug } from "@/lib/public-cache";
import { recordView } from "@/lib/view-counter";
import { buildMetadata, jsonLd, propertySchema, breadcrumbSchema, truncateAtWord } from "@/lib/seo";
import { siteConfig, whatsappLink } from "@/config/site";
import { propertyFiltersToLandingPath } from "@/lib/seo-landings";

import { Container, Section } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ButtonAnchor, buttonClassName } from "@/components/ui/button";
import { Gallery } from "@/components/site/gallery";
import { PropertyCard } from "@/components/site/property-card";
import { PropertyActionToolbar } from "@/components/site/property-action-toolbar";
import { PropertyMap } from "@/components/site/property-map";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { AnalyticsEventBeacon } from "@/components/analytics/analytics-event";
import { RecentlyViewedTracker } from "@/components/site/recently-viewed-tracker";
import { PartnerRelations } from "@/components/site/partner-relations";
import { WhatsAppIcon } from "@/components/site/brand-icons";
import { ContactForm } from "@/app/[locale]/(site)/elaqe/contact-form";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { applyContentTranslation, getPublishedContentTranslation } from "@/lib/content-translation";
import { getOptionalUser } from "@/lib/auth/guard";
import { ReservationForm } from "./reservation-form";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const STATUS_KEYS: Record<PropertyStatus, "draft" | "pending" | "published" | "reserved" | "sold" | "rented" | "archived"> = {
  DRAFT: "draft", PENDING: "pending", PUBLISHED: "published", RESERVED: "reserved", SOLD: "sold", RENTED: "rented", ARCHIVED: "archived",
};
const RENOVATION_KEYS: Record<string, "cosmetic" | "renovated" | "designer" | "unrenovated" | "newBuilding"> = {
  COSMETIC: "cosmetic", RENOVATED: "renovated", DESIGNER: "designer", UNRENOVATED: "unrenovated", NEW_BUILDING: "newBuilding",
};
const DOCUMENT_KEYS: Record<string, "titleDeed" | "contract" | "municipal" | "decree" | "powerOfAttorney" | "commercialExtract" | "none"> = {
  TITLE_DEED: "titleDeed", CONTRACT: "contract", MUNICIPAL: "municipal", DECREE: "decree", POWER_OF_ATTORNEY: "powerOfAttorney", COMMERCIAL_EXTRACT: "commercialExtract", NONE: "none",
};
const NEARBY_KEYS: Record<string, "metro" | "bus" | "school" | "university" | "kindergarten" | "hospital" | "clinic" | "pharmacy" | "supermarket" | "restaurant" | "park" | "shoppingCenter"> = {
  METRO: "metro", BUS: "bus", SCHOOL: "school", UNIVERSITY: "university",
  KINDERGARTEN: "kindergarten", HOSPITAL: "hospital", CLINIC: "clinic",
  PHARMACY: "pharmacy", SUPERMARKET: "supermarket", RESTAURANT: "restaurant",
  PARK: "park", SHOPPING_CENTER: "shoppingCenter",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const sourceProperty = await getCachedPropertyBySlug(slug);

  if (!sourceProperty) notFound();
  const knownProperty = localizeKnownContent("property", sourceProperty, locale as Locale);
  const localizedProperty = applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.PROPERTY,
    knownProperty,
    await getPublishedContentTranslation(TRANSLATION_ENTITY_TYPES.PROPERTY, sourceProperty.id, locale as Locale),
  );
  const property = {
    ...localizedProperty,
    city: localizeLocation(localizedProperty.city, locale as Locale),
    district: localizedProperty.district ? localizeLocation(localizedProperty.district, locale as Locale) : null,
  };

  const image = property.images[0]?.url || null;
  const isClosed = property.status === "SOLD" || property.status === "RENTED";

  const location = [property.district?.name, property.city.name]
    .filter(Boolean)
    .join(", ");

  return buildMetadata({
    title: property.metaTitle || `${property.title} | ${location}`,
    description: property.metaDescription || truncateAtWord(property.description, 160),
    path: `/emlaklar/${property.slug}`,
    image,
    type: "website",
    publishedTime: toIsoDateTime(property.publishedAt),
    indexPolicy: property.noIndex || isClosed ? "noindex-follow" : "index",
    canonicalPath: property.canonicalUrl || undefined,
    ogTitle: property.ogTitle,
    ogDescription: property.ogDescription,
    ogImage: property.ogImage,
    locale: locale as Locale,
  });
}

export default async function PropertyDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const [content, propertyText, navigation, commonContent, reservationText, neighborhoodText] = await Promise.all([
    getTranslations({ locale, namespace: "content.propertyDetail" }),
    getTranslations({ locale, namespace: "property" }),
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "content" }),
    getTranslations({ locale, namespace: "phase2.reservation" }),
    getTranslations({ locale, namespace: "phase2.neighborhood" }),
  ]);
  const sourceProperty = await getCachedPropertyBySlug(slug);

  if (!sourceProperty) notFound();

  // Sayğac cavabı gözlətmir — `waitUntil` ilə render bitdikdən sonra yazılır
  recordView("property", sourceProperty.id, (await headers()).get("user-agent"));

  const knownProperty = localizeKnownContent("property", sourceProperty, locale as Locale);
  const localizedProperty = applyContentTranslation(
    TRANSLATION_ENTITY_TYPES.PROPERTY,
    knownProperty,
    await getPublishedContentTranslation(TRANSLATION_ENTITY_TYPES.PROPERTY, sourceProperty.id, locale as Locale),
  );
  const property = {
    ...localizedProperty,
    type: localizeKnownContent("propertyType", localizedProperty.type, locale as Locale),
    city: localizeLocation(localizedProperty.city, locale as Locale),
    district: localizedProperty.district ? localizeLocation(localizedProperty.district, locale as Locale) : null,
    metro: localizedProperty.metro ? localizeLocation(localizedProperty.metro, locale as Locale) : null,
    features: localizedProperty.features.map((item) => ({
      ...item,
      feature: localizeKnownContent("feature", item.feature, locale as Locale),
    })),
  };

  const isSale = property.listingType === LISTING_TYPES.SALE;
  const status = property.status as PropertyStatus;
  const isClosed = status === "SOLD" || status === "RENTED";
  const isPremium = property.isFeatured && (
    property.featuredUntil == null || new Date(property.featuredUntil).getTime() > Date.now()
  );
  const period = property.pricePeriod
    ? property.pricePeriod === "MONTH" ? propertyText("pricePeriod.month") : propertyText("pricePeriod.day")
    : null;

  const location = [property.district?.name, property.city.name]
    .filter(Boolean)
    .join(", ");

  const [similarProperties, partnerLinks] = await Promise.all([
    getSimilarProperties(property, 4),
    getPropertyPartners(property.id),
  ]);
  const reservationUser = property.reservationEnabled && !isClosed
    ? await getOptionalUser(AUTH_KINDS.PUBLIC)
    : null;
  const propertyPath = `/emlaklar/${property.slug}`;
  const whatsappHref = whatsappLink(
    content("whatsappMessage", { title: property.title }),
  );
  const relatedLandingLinks = [
    {
      href: propertyFiltersToLandingPath({ listingType: property.listingType }) ?? "/emlaklar",
      label: isSale ? content("saleListings") : content("rentListings"),
    },
    {
      href: propertyFiltersToLandingPath({ typeSlug: property.type.slug }),
      label: property.type.name,
    },
    property.district && {
      href: `/rayon/${property.district.slug}`,
      label: locale === "az" ? `${property.district.name} rayonu` : property.district.name,
    },
    property.metro && {
      href: `/metro/${property.metro.slug}`,
      label: locale === "az" ? `${property.metro.name} metrosu` : property.metro.name,
    },
  ].filter((item): item is { href: string; label: string } => Boolean(item && item.href));

  return (
    <>
      <AnalyticsEventBeacon event="property_view" payload={{ property_id: property.id }} />
      <RecentlyViewedTracker propertyId={property.id} />
      <script
        {...jsonLd(
          propertySchema({
            title: property.title,
            description: property.description,
            slug: property.slug,
            price: property.price,
            currency: property.currency,
            listingType: property.listingType,
            images: property.images.map((img) => img.url),
            city: property.city.name,
            district: property.district?.name,
            address: property.address,
            latitude: property.latitude,
            longitude: property.longitude,
            area: property.area,
            rooms: property.rooms,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            status: property.status,
          }, locale as Locale),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: navigation("home"), path: "/" },
            { name: navigation("properties"), path: "/emlaklar" },
            { name: property.title, path: `/emlaklar/${property.slug}` },
          ], locale as Locale),
        )}
      />

      <div className="bg-ivory pt-6 pb-[calc(7rem+var(--safe-bottom))] sm:pt-8 sm:pb-20 lg:pb-12">
        <Container>
          <Breadcrumbs
            locale={locale as Locale}
            items={[
              { label: navigation("home"), href: "/" },
              { label: navigation("properties"), href: "/emlaklar" },
              { label: property.title },
            ]}
            className="mb-6"
          />
          {/* Üst başlıq hissəsi */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={isSale ? "dark" : "gold"}>
                  {isSale ? content("sale") : content("rent")}
                </Badge>
                {status !== "PUBLISHED" && (
                  <Badge tone={PROPERTY_STATUS_TONE[status]}>
                    {propertyText(`status.${STATUS_KEYS[status]}`)}
                  </Badge>
                )}
                <Badge tone="neutral" className="bg-paper border-line">
                  {property.type.name}
                </Badge>
                {isPremium && (
                  <Badge tone="gold">
                    <Crown className="mr-1 size-3.5" aria-hidden="true" />
                    {commonContent("phase2.premium")}
                  </Badge>
                )}
              </div>
              
              <h1 className="font-display text-2xl leading-tight text-ink sm:text-3xl lg:text-4xl">
                {property.title}
              </h1>

              {location && (
                <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />
                  {location}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              <p className="flex items-baseline gap-1 text-ink">
                <span className="tabular font-display text-3xl font-semibold sm:text-4xl">
                  {formatPrice(property.price, property.currency)}
                </span>
                {period && <span className="text-sm text-ink-soft">/ {period}</span>}
              </p>
            </div>
          </div>

          <PropertyActionToolbar
            propertyId={property.id}
            path={propertyPath}
            title={property.title}
            phone={siteConfig.phoneHref}
            whatsappHref={whatsappHref}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
            {/* Sol tərəf: Qalereya və Əsas məlumatlar */}
            <div className="flex flex-col gap-10">
              {/* Qalereya */}
              <Gallery images={property.images} title={property.title} />

              {/* Sürətli parametrlər */}
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
                {property.rooms != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <BedDouble className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">{content("rooms")}</span>
                    <span className="tabular font-medium text-ink">{property.rooms}</span>
                  </div>
                )}
                {property.area != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Maximize className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">{content("area")}</span>
                    <span className="tabular font-medium text-ink">{propertyText("area", { value: property.area })}</span>
                  </div>
                )}
                {property.floor != null && property.totalFloors != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Layers className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">{content("floor")}</span>
                    <span className="tabular font-medium text-ink">
                      {property.floor} / {property.totalFloors}
                    </span>
                  </div>
                )}
                {property.renovation != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <CheckCircle2 className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">{content("renovation")}</span>
                    <span className="font-medium text-ink">
                      {propertyText(`renovation.${RENOVATION_KEYS[property.renovation]}`)}
                    </span>
                  </div>
                )}
                {property.documentStatus != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <FileCheck className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">{content("document")}</span>
                    <span className="font-medium text-ink">
                      {propertyText(`document.${DOCUMENT_KEYS[property.documentStatus]}`)}
                    </span>
                  </div>
                )}
                {property.landArea != null && property.area == null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Maximize className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">{content("landArea")}</span>
                    <span className="tabular font-medium text-ink">
                      {propertyText("landUnit", { value: property.landArea })}
                    </span>
                  </div>
                )}
              </div>

              {/* Təsvir */}
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-xl text-ink">{commonContent("description")}</h2>
                <div className="prose prose-ink max-w-none text-base leading-relaxed text-ink-soft">
                  {property.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {property.priceHistory.length > 0 && (
                <section className="rounded-md border border-line bg-paper p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-display text-xl text-ink">
                    <History className="size-5 text-gold-deep" aria-hidden="true" />
                    {commonContent("phase2.priceHistory")}
                  </h2>
                  <ol className="mt-4 divide-y divide-line">
                    {property.priceHistory.map((entry) => (
                      <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                        <time className="text-sm text-ink-muted" dateTime={entry.changedAt.toISOString()}>
                          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(entry.changedAt)}
                        </time>
                        <span className="tabular text-sm text-ink-soft">
                          <span className="line-through">{formatPrice(entry.oldPrice, entry.currency)}</span>
                          <span aria-hidden="true"> → </span>
                          <strong className="font-semibold text-ink">{formatPrice(entry.newPrice, entry.currency)}</strong>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {property.nearbyPlaces.length > 0 && (
                <section className="rounded-md border border-line bg-paper p-5 sm:p-6">
                  <h2 className="flex items-center gap-2 font-display text-xl text-ink">
                    <Navigation className="size-5 text-gold-deep" aria-hidden="true" />
                    {commonContent("phase2.nearby")}
                  </h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {property.nearbyPlaces.map((place) => (
                      <li key={place.id} className="rounded-xs border border-line bg-paper-light p-3">
                        <p className="text-xs font-semibold tracking-wide text-gold-deep uppercase">
                          {commonContent(`phase2.nearbyCategories.${NEARBY_KEYS[place.category] ?? "park"}`)}
                        </p>
                        <p className="mt-1 font-medium text-ink">{place.name}</p>
                        {(place.distanceMeters != null || place.walkingMinutes != null) && (
                          <p className="mt-1 text-sm text-ink-muted">
                            {place.distanceMeters != null ? `${place.distanceMeters} m` : ""}
                            {place.distanceMeters != null && place.walkingMinutes != null ? " · " : ""}
                            {place.walkingMinutes != null
                              ? commonContent("phase2.walkingMinutes", { count: place.walkingMinutes })
                              : ""}
                          </p>
                        )}
                        {place.source && <p className="mt-1 text-xs text-ink-muted">{commonContent("phase2.source")}: {place.source}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {property.district?.neighborhoodProfile && (
                <section className="rounded-md border border-line bg-paper p-5 sm:p-6">
                  <h2 className="font-display text-xl text-ink">{property.district.name} — {neighborhoodText("title")}</h2>
                  {(() => {
                    const profile = property.district.neighborhoodProfile;
                    const description = locale === "en" ? profile.descriptionEn : locale === "ru" ? profile.descriptionRu : profile.description;
                    const metrics = [
                      profile.averagePrice != null && [neighborhoodText("averagePrice"), formatPrice(profile.averagePrice)],
                      profile.averagePricePerSqm != null && [neighborhoodText("pricePerSqm"), `${formatPrice(profile.averagePricePerSqm)}/m²`],
                      profile.annualChangePercent != null && [neighborhoodText("annualChange"), `${profile.annualChangePercent > 0 ? "+" : ""}${profile.annualChangePercent}%`],
                      profile.averageRent != null && [neighborhoodText("averageRent"), formatPrice(profile.averageRent)],
                      profile.rentalYieldPercent != null && [neighborhoodText("rentalYield"), `${profile.rentalYieldPercent}%`],
                    ].filter((item): item is [string, string] => Boolean(item));
                    return <>
                      {description ? <p className="mt-3 leading-relaxed text-ink-soft">{description}</p> : null}
                      {metrics.length > 0 ? <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label, value]) => <div key={label} className="rounded-xs border border-line bg-paper-light p-3"><dt className="text-xs text-ink-muted">{label}</dt><dd className="tabular mt-1 font-medium text-ink">{value}</dd></div>)}</dl> : null}
                      {(profile.dataSource || profile.measuredAt) ? <p className="mt-4 text-xs text-ink-muted">{profile.dataSource ? `${neighborhoodText("source")}: ${profile.dataSource}` : ""}{profile.dataSource && profile.measuredAt ? " · " : ""}{profile.measuredAt ? `${neighborhoodText("measuredAt")}: ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(profile.measuredAt)}` : ""}</p> : null}
                    </>;
                  })()}
                </section>
              )}

              {property.assignedAgent && (
                <section className="rounded-md border border-line bg-paper p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-gold-deep uppercase">{commonContent("phase2.responsibleAgent")}</p>
                      <h2 className="mt-1 font-display text-xl text-ink">{property.assignedAgent.name}</h2>
                      {property.assignedAgent.agency && <p className="text-sm text-ink-muted">{property.assignedAgent.agency.name}</p>}
                    </div>
                    {property.assignedAgent.reviews.length > 0 && (
                      <p className="flex items-center gap-1 text-sm font-medium text-ink">
                        <Star className="size-4 fill-gold text-gold-deep" aria-hidden="true" />
                        {(property.assignedAgent.reviews.reduce((sum, review) => sum + review.rating, 0) / property.assignedAgent.reviews.length).toFixed(1)}
                      </p>
                    )}
                  </div>
                  <Link href={`/agentler/${property.assignedAgent.slug}`} className={buttonClassName("outline", "sm", false, "mt-4")}>
                    {commonContent("phase2.viewAgent")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </section>
              )}

              {property.reservationEnabled && !isClosed && (
                <ReservationForm
                  propertyId={property.id}
                  initial={reservationUser ? { name: reservationUser.name, phone: null, email: reservationUser.email } : null}
                  labels={{
                    title: reservationText("title"),
                    description: reservationText("description"),
                    firstName: reservationText("firstName"),
                    lastName: reservationText("lastName"),
                    phone: reservationText("phone"),
                    email: reservationText("email"),
                    date: reservationText("date"),
                    message: reservationText("message"),
                    terms: reservationText("terms"),
                    submit: reservationText("submit"),
                  }}
                />
              )}

              {relatedLandingLinks.length > 0 && (
                <nav aria-label={content("relatedSearchesAria")} className="border-y border-line py-5">
                  <h2 className="font-display text-xl text-ink">{content("relatedSearches")}</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {relatedLandingLinks.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="inline-flex min-h-11 items-center rounded-xs border border-line px-3 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {/* Əlavə Xüsusiyyətlər (əgər varsa) */}
              {property.features.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h2 className="font-display text-xl text-ink">{commonContent("features")}</h2>
                  <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {property.features.map(({ feature }) => (
                      <li key={feature.id} className="flex items-center gap-2 text-sm text-ink-soft">
                        <CheckCircle2 className="size-4 text-gold" aria-hidden="true" />
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Xəritədə yerləşmə */}
              {property.latitude != null && property.longitude != null && (
                <div className="flex flex-col gap-4">
                  <h2 className="font-display text-xl text-ink">{content("onMap")}</h2>
                  <PropertyMap
                    latitude={property.latitude}
                    longitude={property.longitude}
                    title={property.title}
                    className="h-80 w-full overflow-hidden rounded-md border border-line"
                  />
                </div>
              )}

              {/* Tərəfdaş bloku — elan ictimai tərəfdaşla əlaqəlidirsə */}
              <PartnerRelations
                links={partnerLinks}
                locale={locale as Locale}
                placement="property_detail"
              />

              {/* Layihəyə bağlantı */}
              {property.project && (
                <div className="rounded-md border border-line bg-paper p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{content("project")}</span>
                      <h3 className="font-display text-lg text-ink">{property.project.name}</h3>
                    </div>
                    <Link href={`/layiheler/${property.project.slug}`} className={buttonClassName("outline", "sm")}>
                      {content("viewProject")} <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sağ tərəf: Əlaqə və Oxşar */}
            <div className="flex flex-col gap-8">
              {/* Əlaqə Forması */}
              <div className="rounded-md border border-line bg-paper p-5 sm:p-6 lg:sticky lg:top-28 lg:shadow-sm">
                <div className="mb-6 flex flex-col gap-2">
                  <h3 className="font-display text-xl text-ink">
                    {isClosed ? content("closedTitle") : content("contactTitle")}
                  </h3>
                  <p className="text-sm text-ink-soft">
                    {isClosed
                      ? content("closedDescription")
                      : content("contactDescription")}
                  </p>
                </div>

                <div className="mb-6 flex flex-col gap-2">
                  <ButtonAnchor
                    href={siteConfig.phoneHref}
                    variant="ghost"
                    fullWidth
                    className="border border-line hover:border-gold hover:text-gold-deep"
                  >
                    <Phone className="size-4" aria-hidden="true" />
                    {siteConfig.phone}
                  </ButtonAnchor>

                  <ButtonAnchor
                    href={whatsappHref}
                    variant="ghost"
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                    className="border border-success/30 bg-success-bg text-success hover:border-success hover:bg-success-bg/70"
                  >
                    <WhatsAppIcon className="size-4 text-success" />
                    WhatsApp
                  </ButtonAnchor>
                </div>

                <div className="relative mb-6 text-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-line" />
                  </div>
                  <span className="relative bg-paper px-3 text-xs font-medium uppercase text-ink-muted">{content("orEnquiry")}</span>
                </div>

                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Bənzər Əmlaklar */}
      {similarProperties.length > 0 && (
        <Section tone="paper" spacing="cozy">
          <Container>
            <div className="mb-8 flex flex-col gap-2">
              <h2 className="font-display text-2xl text-ink sm:text-3xl">{commonContent("similarProperties")}</h2>
              <p className="text-sm text-ink-soft">{content("similarDescription")}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
