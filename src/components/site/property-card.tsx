"use client";

import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BedDouble, Building2, Crown, Layers, Maximize, MapPin } from "lucide-react";
import { cn, isUnoptimizedImage } from "@/lib/utils";
import {
  LISTING_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_TONE,
  type PropertyStatus,
  type Locale,
} from "@/lib/constants";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { Badge } from "@/components/ui/badge";
import type { PropertyCardData } from "@/lib/queries";
import { FavoriteButton } from "./favorite-button";
import { CompareButton } from "./compare-button";

type PropertyCardProps = {
  property: PropertyCardData;
  /** Siyahının ilk kartları üçün `priority` — LCP-ni yaxşılaşdırır. */
  priority?: boolean;
  className?: string;
  variant?: "standard" | "featured";
};

const STATUS_KEYS: Record<PropertyStatus, "draft" | "pending" | "published" | "reserved" | "sold" | "rented" | "archived"> = {
  DRAFT: "draft", PENDING: "pending", PUBLISHED: "published", RESERVED: "reserved",
  SOLD: "sold", RENTED: "rented", ARCHIVED: "archived",
};

/**
 * Kartda göstəriləcək şəkil ünvanı.
 *
 * `/media/` ünvanları `next/image` optimizasiyasından yan keçir (zona
 * səviyyəsində Cloudflare Images transformations hələ açılmayıb), ona görə
 * `url` verilsə brauzer 2400 px-lik master faylı yükləyir — 12 kartlıq siyahıda
 * bu bir neçə meqabayt deməkdir. Yükləmə zamanı hazırlanan 640 px-lik nüsxə
 * kart ölçüsü üçün kifayətdir.
 *
 * `featured` variantı desktopda genişdir; orada master şəkil saxlanılır, çünki
 * o, adətən səhifənin LCP elementidir və 640 px orada yumşaq görünür.
 */
function cardImageSrc(
  image: { url: string; thumbUrl?: string | null },
  preferFullSize: boolean,
): string {
  if (preferFullSize) return image.url;
  return image.thumbUrl || image.url;
}
export function PropertyCard({
  property: sourceProperty,
  priority = false,
  className,
  variant = "standard",
}: PropertyCardProps) {
  const t = useTranslations("property");
  const contentT = useTranslations("content.phase2");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  const localizedProperty = localizeKnownContent("property", sourceProperty, locale);
  const property = {
    ...localizedProperty,
    type: localizeKnownContent("propertyType", localizedProperty.type, locale),
    city: localizeLocation(localizedProperty.city, locale),
    district: localizedProperty.district ? localizeLocation(localizedProperty.district, locale) : null,
  };
  const image = property.images[0];
  const status = property.status as PropertyStatus;
  const isSale = property.listingType === LISTING_TYPES.SALE;
  const isClosed =
    status === PROPERTY_STATUSES.SOLD || status === PROPERTY_STATUSES.RENTED;
  const isPremium = property.isFeatured && (!property.featuredUntil || new Date(property.featuredUntil).getTime() >= Date.now());

  const location = [property.district?.name, property.city.name]
    .filter(Boolean)
    .join(", ");

  const period = property.pricePeriod === "MONTH"
    ? t("pricePeriod.month")
    : property.pricePeriod === "DAY" ? t("pricePeriod.day") : null;
  const number = (value: number) => format.number(value, { maximumFractionDigits: 0 });
  const currency = property.currency === "AZN" ? "₼" : property.currency === "USD" ? "$" : property.currency === "EUR" ? "€" : property.currency;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-sm border border-line bg-paper",
        "transition-colors duration-300 ease-out-soft hover:border-line-strong",
        className,
      )}
    >
      {/* --- Şəkil --- */}
      <div
        className={cn(
          "relative overflow-hidden bg-beige",
          variant === "featured"
            ? "aspect-16/10 lg:min-h-[34rem]"
            : "aspect-4/3 sm:aspect-[16/11]",
        )}
      >
        {image ? (
          <Image
            src={cardImageSrc(image, variant === "featured")}
            alt={image.alt || `${property.title} — ${location}`}
            fill
            unoptimized={isUnoptimizedImage(image.url)}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes={
              variant === "featured"
                ? "(max-width: 1024px) 100vw, 58vw"
                : "(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1279px) calc(50vw - 2.25rem), 448px"
            }
            className={cn(
              "image-lift object-cover",
              isClosed && "opacity-70 grayscale-[0.35]",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <Building2 className="size-10" aria-hidden="true" />
            <span className="sr-only">{t("photoUnavailable")}</span>
          </div>
        )}

      </div>

      {/* --- Məzmun --- */}
      <div className={cn("flex flex-1 flex-col gap-4 p-5", variant === "featured" && "sm:p-7")}>
        <div className="flex flex-wrap gap-2">
          {isPremium && <Badge tone="gold"><Crown className="mr-1 size-3" aria-hidden="true" />{contentT("premium")}</Badge>}
          <Badge tone={isSale ? "dark" : "gold"}>
            {isSale ? t("listingType.sale") : t("listingType.rent")}
          </Badge>
          {isClosed && (
            <Badge tone={PROPERTY_STATUS_TONE[status]}>
              {t(`status.${STATUS_KEYS[status]}`)}
            </Badge>
          )}
          {status === PROPERTY_STATUSES.RESERVED && (
            <Badge tone="warning">{t(`status.${STATUS_KEYS[status]}`)}</Badge>
          )}
        </div>

        <p className="tabular font-display text-2xl leading-none tracking-[-0.02em] text-ink">
          {number(property.price)} {currency}
          {period && (
            <span className="ml-1 font-sans text-xs font-normal text-ink-muted">
              / {period}
            </span>
          )}
        </p>

        <div className="flex flex-col gap-1.5">
          <h3
            className={cn(
              "font-display leading-snug text-ink",
              variant === "featured" ? "text-2xl sm:text-3xl" : "text-lg",
            )}
          >
            {/* Bütün kart klikləndikdə detala keçir; overlay link fokus sırasını pozmur */}
            <Link
              href={`/emlaklar/${property.slug}`}
              className="after:absolute after:inset-0 after:content-[''] transition-colors duration-300 ease-out-soft hover:text-gold-deep"
            >
              {property.title}
            </Link>
          </h3>

          {location && (
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {location}
            </p>
          )}
        </div>

        <p className="text-xs font-medium tracking-wide text-gold-deep uppercase">
          {property.type.name}
        </p>

        {/* Xüsusiyyət sətri */}
        <dl className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-ink-soft">
          {property.rooms != null && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <dt className="sr-only">{t("rooms", { count: property.rooms })}</dt>
              <dd className="tabular">{t("rooms", { count: property.rooms })}</dd>
            </div>
          )}

          {property.area != null && (
            <div className="flex items-center gap-1.5">
              <Maximize className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <dt className="sr-only">{t("area", { value: property.area })}</dt>
              <dd className="tabular">{t("area", { value: property.area })}</dd>
            </div>
          )}

          {property.landArea != null && property.area == null && (
            <div className="flex items-center gap-1.5">
              <Maximize className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <dt className="sr-only">{t("landArea")}</dt>
              <dd className="tabular">{t("landUnit", { value: property.landArea })}</dd>
            </div>
          )}

          {property.floor != null && property.totalFloors != null && (
            <div className="flex items-center gap-1.5">
              <Layers className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <dt className="sr-only">{t("floor")}</dt>
              <dd className="tabular">
                {property.floor}/{property.totalFloors}
              </dd>
            </div>
          )}
        </dl>

        {/* Mobil məlumat axınında əməl düymələri xüsusiyyətlərdən sonra gəlir.
            z-10 onları kartın tam-səth linkindən yuxarı saxlayır. */}
        <div className="relative z-10 flex items-center justify-end gap-2 border-t border-line pt-3">
          <FavoriteButton propertyId={property.id} />
          <CompareButton propertyId={property.id} />
        </div>
      </div>
    </article>
  );
}
