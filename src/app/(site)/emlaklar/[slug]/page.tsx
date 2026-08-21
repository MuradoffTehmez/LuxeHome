import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BedDouble,
  FileCheck,
  Maximize,
  MapPin,
  Layers,
  CheckCircle2,
  Phone,
  ArrowRight,
} from "lucide-react";
import { formatNumber, formatPrice, formatArea } from "@/lib/utils";
import {
  LISTING_TYPES,
  PRICE_PERIOD_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_TONE,
  RENOVATION_LABELS,
  DOCUMENT_STATUS_LABELS,
  type PricePeriod,
  type PropertyStatus,
  type Renovation,
  type DocumentStatus,
} from "@/lib/constants";
import { getPropertyBySlug, getSimilarProperties } from "@/lib/queries";
import { buildMetadata, jsonLd, propertySchema, breadcrumbSchema } from "@/lib/seo";
import { siteConfig } from "@/config/site";

import { Container, Section } from "@/components/ui/container";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import { Gallery } from "@/components/site/gallery";
import { PropertyCard } from "@/components/site/property-card";
import { FavoriteButton } from "@/components/site/favorite-button";
import { ShareButtons } from "@/components/site/share-buttons";
import { WhatsAppIcon } from "@/components/site/brand-icons";
import { ContactForm } from "@/app/(site)/elaqe/contact-form";

// Məlumat Cloudflare D1 binding-i üzərindən oxunur; binding yalnız sorğu
// kontekstində əlçatandır, ona görə səhifə build zamanı deyil, sorğu anında render olunur.
export const dynamic = "force-dynamic";


type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) return { title: "Əmlak tapılmadı" };

  const image = property.images[0]?.url || null;

  const location = [property.district?.name, property.city.name]
    .filter(Boolean)
    .join(", ");

  return buildMetadata({
    title: `${property.title} | ${location}`,
    description: property.description.slice(0, 160),
    path: `/emlaklar/${property.slug}`,
    image,
    type: "article",
    publishedTime: property.publishedAt?.toISOString(),
  });
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) notFound();

  const isSale = property.listingType === LISTING_TYPES.SALE;
  const status = property.status as PropertyStatus;
  const isClosed = status === "SOLD" || status === "RENTED";
  const period = property.pricePeriod
    ? PRICE_PERIOD_LABELS[property.pricePeriod as PricePeriod]
    : null;

  const location = [property.district?.name, property.city.name]
    .filter(Boolean)
    .join(", ");

  const similarProperties = await getSimilarProperties(property, 4);

  return (
    <>
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
          }),
        )}
      />
      <script
        {...jsonLd(
          breadcrumbSchema([
            { name: "Ana səhifə", path: "/" },
            { name: "Əmlaklar", path: "/emlaklar" },
            { name: property.title, path: `/emlaklar/${property.slug}` },
          ]),
        )}
      />

      <div className="bg-ivory pt-6 pb-12 sm:pt-8 sm:pb-16">
        <Container>
          {/* Üst başlıq hissəsi */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={isSale ? "dark" : "gold"}>
                  {isSale ? "Satılır" : "Kirayə"}
                </Badge>
                {status !== "PUBLISHED" && (
                  <Badge tone={PROPERTY_STATUS_TONE[status]}>
                    {PROPERTY_STATUS_LABELS[status]}
                  </Badge>
                )}
                <Badge tone="neutral" className="bg-paper border-line">
                  {property.type.name}
                </Badge>
                {property.isDemo && <DemoBadge />}
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
              <div className="flex items-center gap-3">
                <ShareButtons
                  title={property.title}
                  path={`/emlaklar/${property.slug}`}
                />
                <div className="h-6 w-px bg-line" aria-hidden="true" />
                <FavoriteButton propertyId={property.id} />
              </div>
            </div>
          </div>

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
                    <span className="text-xs font-medium text-ink-muted uppercase">Otaqlar</span>
                    <span className="tabular font-medium text-ink">{property.rooms}</span>
                  </div>
                )}
                {property.area != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Maximize className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">Sahə</span>
                    <span className="tabular font-medium text-ink">{formatArea(property.area)}</span>
                  </div>
                )}
                {property.floor != null && property.totalFloors != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Layers className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">Mərtəbə</span>
                    <span className="tabular font-medium text-ink">
                      {property.floor} / {property.totalFloors}
                    </span>
                  </div>
                )}
                {property.renovation != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <CheckCircle2 className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">Təmir</span>
                    <span className="font-medium text-ink">
                      {RENOVATION_LABELS[property.renovation as Renovation]}
                    </span>
                  </div>
                )}
                {property.documentStatus != null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <FileCheck className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">Sənəd</span>
                    <span className="font-medium text-ink">
                      {DOCUMENT_STATUS_LABELS[property.documentStatus as DocumentStatus]}
                    </span>
                  </div>
                )}
                {property.landArea != null && property.area == null && (
                  <div className="flex flex-col items-center gap-1.5 bg-paper p-4 text-center">
                    <Maximize className="size-5 text-ink-muted" aria-hidden="true" />
                    <span className="text-xs font-medium text-ink-muted uppercase">Torpaq sahəsi</span>
                    <span className="tabular font-medium text-ink">
                      {formatNumber(property.landArea)} sot
                    </span>
                  </div>
                )}
              </div>

              {/* Təsvir */}
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-xl text-ink">Təsvir</h2>
                <div className="prose prose-ink max-w-none text-base leading-relaxed text-ink-soft">
                  {property.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Əlavə Xüsusiyyətlər (əgər varsa) */}
              {property.features.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h2 className="font-display text-xl text-ink">Xüsusiyyətlər</h2>
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

              {/* Layihəyə bağlantı */}
              {property.project && (
                <div className="rounded-md border border-line bg-paper p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Layihə</span>
                      <h3 className="font-display text-lg text-ink">{property.project.name}</h3>
                    </div>
                    <ButtonLink href={`/layiheler/${property.project.slug}`} variant="outline" size="sm">
                      Layihəyə bax <ArrowRight className="ml-2 size-4" />
                    </ButtonLink>
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
                    {isClosed ? "Bu əmlak artıq mövcud deyil" : "Əlaqə saxlayın"}
                  </h3>
                  <p className="text-sm text-ink-soft">
                    {isClosed
                      ? `Elan «${PROPERTY_STATUS_LABELS[status]}» statusundadır. Oxşar variantlar üçün bizimlə əlaqə saxlayın — portfelimizdə uyğun əmlak tapa bilərik.`
                      : "Bu əmlakla maraqlanırsınız? Müraciət göndərin və ya zəng edin."}
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
                    href={`https://wa.me/994519228585?text=${encodeURIComponent(`Salam, "${property.title}" elanı ilə bağlı məlumat almaq istəyirəm.`)}`}
                    variant="ghost"
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                    className="border border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/50"
                  >
                    <WhatsAppIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    WhatsApp ilə yaz
                  </ButtonAnchor>
                </div>

                <div className="relative mb-6 text-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-line" />
                  </div>
                  <span className="relative bg-paper px-3 text-xs font-medium uppercase text-ink-muted">və ya müraciət yazın</span>
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
              <h2 className="font-display text-2xl text-ink sm:text-3xl">Oxşar əmlaklar</h2>
              <p className="text-sm text-ink-soft">Bu əmlaka oxşar digər təkliflərə göz atın.</p>
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
