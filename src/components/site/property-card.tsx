import Image from "next/image";
import Link from "next/link";
import { BedDouble, Building2, Layers, Maximize, MapPin } from "lucide-react";
import { cn, formatArea, formatNumber, formatPrice } from "@/lib/utils";
import {
  LISTING_TYPES,
  PRICE_PERIOD_LABELS,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_TONE,
  type PricePeriod,
  type PropertyStatus,
} from "@/lib/constants";
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

const PLACEHOLDER_ALT = "Əmlak fotosu";

export function PropertyCard({
  property,
  priority = false,
  className,
  variant = "standard",
}: PropertyCardProps) {
  const image = property.images[0];
  const status = property.status as PropertyStatus;
  const isSale = property.listingType === LISTING_TYPES.SALE;
  const isClosed =
    status === PROPERTY_STATUSES.SOLD || status === PROPERTY_STATUSES.RENTED;

  const location = [property.district?.name, property.city.name]
    .filter(Boolean)
    .join(", ");

  const period = property.pricePeriod
    ? PRICE_PERIOD_LABELS[property.pricePeriod as PricePeriod]
    : null;

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
            src={image.url}
            alt={image.alt || `${property.title} — ${location}`}
            fill
            priority={priority}
            loading={priority ? undefined : "lazy"}
            sizes={
              variant === "featured"
                ? "(max-width: 1024px) 100vw, 58vw"
                : "(max-width: 639px) calc(100vw - 2rem), (max-width: 1279px) calc(50vw - 2rem), 33vw"
            }
            className={cn(
              "image-lift object-cover",
              isClosed && "opacity-70 grayscale-[0.35]",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <Building2 className="size-10" aria-hidden="true" />
            <span className="sr-only">{PLACEHOLDER_ALT} mövcud deyil</span>
          </div>
        )}

      </div>

      {/* --- Məzmun --- */}
      <div className={cn("flex flex-1 flex-col gap-4 p-5", variant === "featured" && "sm:p-7")}>
        <div className="flex flex-wrap gap-2">
          <Badge tone={isSale ? "dark" : "gold"}>
            {isSale ? "Satılır" : "Kirayə"}
          </Badge>
          {isClosed && (
            <Badge tone={PROPERTY_STATUS_TONE[status]}>
              {PROPERTY_STATUS_LABELS[status]}
            </Badge>
          )}
          {status === PROPERTY_STATUSES.RESERVED && (
            <Badge tone="warning">{PROPERTY_STATUS_LABELS[status]}</Badge>
          )}
        </div>

        <p className="tabular font-display text-2xl leading-none tracking-[-0.02em] text-ink">
          {formatPrice(property.price, property.currency)}
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
              <dt className="sr-only">Otaq sayı</dt>
              <dd className="tabular">{property.rooms} otaq</dd>
            </div>
          )}

          {property.area != null && (
            <div className="flex items-center gap-1.5">
              <Maximize className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <dt className="sr-only">Sahə</dt>
              <dd className="tabular">{formatArea(property.area)}</dd>
            </div>
          )}

          {property.landArea != null && property.area == null && (
            <div className="flex items-center gap-1.5">
              <Maximize className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <dt className="sr-only">Torpaq sahəsi</dt>
              <dd className="tabular">{formatNumber(property.landArea)} sot</dd>
            </div>
          )}

          {property.floor != null && property.totalFloors != null && (
            <div className="flex items-center gap-1.5">
              <Layers className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <dt className="sr-only">Mərtəbə</dt>
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

/** Yan panel və oxşar əmlaklar üçün kompakt sətir. */
export function PropertyRow({ property }: { property: PropertyCardData }) {
  const image = property.images[0];
  const location = [property.district?.name, property.city.name]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="group relative flex gap-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xs bg-beige">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || property.title}
            fill
            loading="lazy"
            sizes="96px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-muted">
            <Building2 className="size-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-1">
        <h3 className="truncate font-display text-base text-ink">
          <Link
            href={`/emlaklar/${property.slug}`}
            className="after:absolute after:inset-0 after:content-[''] transition-colors duration-300 ease-out-soft hover:text-gold-deep"
          >
            {property.title}
          </Link>
        </h3>
        {location && <p className="truncate text-xs text-ink-muted">{location}</p>}
        <p className="tabular text-sm font-semibold text-ink">
          {formatPrice(property.price, property.currency)}
        </p>
      </div>
    </article>
  );
}
