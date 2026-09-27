"use client";

import { ImageIcon, MapPin } from "lucide-react";
import type { Locale } from "@/lib/constants";
import { addressParts } from "@/lib/location-path";
import { draftReader } from "@/lib/ui/form-wizard";
import { formatPrice } from "@/lib/utils";
import type { LocationFieldPlace } from "./location-fields";

export type ListingPreviewLabels = {
  noImage: string;
  noTitle: string;
  noPrice: string;
  images: (count: number) => string;
  rooms: (count: string) => string;
  area: (value: string) => string;
  floor: (floor: string) => string;
  description: string;
  features: string;
  listingType: (value: string) => string;
  pricePeriod: (value: string) => string;
};

type Props = {
  entries: ReadonlyArray<[string, string]>;
  locale: Locale;
  types: ReadonlyArray<{ id: string; name: string }>;
  cities: ReadonlyArray<{ id: string; name: string; slug: string }>;
  places: ReadonlyArray<LocationFieldPlace>;
  features: ReadonlyArray<{ id: string; name: string }>;
  labels: ListingPreviewLabels;
};

/**
 * Sehrbazın «Ön baxış» addımı: formanın cari dəyərlərindən elan kartı + detalın
 * qısa variantı. Server-ə getmir — dəyərlər `FormData`-dan oxunur, taksonomiya
 * adları isə formaya artıq yüklənmiş seçim siyahısından tapılır.
 *
 * Şəkil `<img>` ilə göstərilir: `/media/` URL-ləri `next/image` optimizasiyasından
 * keçmir və ön baxışda ölçü hesabı lazım deyil.
 */
export function ListingPreview({ entries, locale, types, cities, places, features, labels }: Props) {
  const draft = draftReader(entries);
  const images = draft.json<{ url: string; alt: string; isCover: boolean }>("images");
  const cover = images.find((image) => image.isCover) ?? images[0];
  const city = cities.find((item) => item.id === draft.get("cityId"));
  const district = places.find((item) => item.id === draft.get("districtId"));
  const parent = district?.parentId ? places.find((item) => item.id === district.parentId) : undefined;
  const address = city
    ? addressParts(
        {
          city: { ...city, kind: "CITY" },
          district: district ? { ...district, parent: parent ?? null } : null,
          neighborhoodName: draft.get("neighborhoodName"),
          street: draft.get("street"),
          building: draft.get("building"),
        },
        locale,
      ).join(", ")
    : "";
  const price = Number(draft.get("price"));
  const currency = draft.get("currency") || "AZN";
  const period = draft.get("listingType") === "RENT" ? draft.get("pricePeriod") : "";
  const typeName = types.find((item) => item.id === draft.get("typeId"))?.name;
  const selectedFeatures = draft
    .all("featureIds")
    .map((id) => features.find((item) => item.id === id)?.name)
    .filter(Boolean);
  const facts = [
    draft.get("rooms") && labels.rooms(draft.get("rooms")),
    draft.get("area") && labels.area(draft.get("area")),
    draft.get("floor") &&
      labels.floor(draft.get("totalFloors") ? `${draft.get("floor")}/${draft.get("totalFloors")}` : draft.get("floor")),
  ].filter(Boolean);
  const description = draft.get("description");

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-paper shadow-xs">
      <div className="relative aspect-16/9 bg-beige">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- ön baxış, optimizasiya lazım deyil
          <img src={cover.url} alt={cover.alt} className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-ink-muted">
            <ImageIcon className="size-8" aria-hidden="true" />
            <span className="text-sm">{labels.noImage}</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {draft.get("listingType") && (
            <span className="on-image-chip rounded-full px-3 py-1 text-xs font-semibold">
              {labels.listingType(draft.get("listingType"))}
            </span>
          )}
          {images.length > 0 && (
            <span className="on-image-chip rounded-full px-3 py-1 text-xs">{labels.images(images.length)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {typeName && <p className="text-xs font-semibold tracking-wide text-gold-deep uppercase">{typeName}</p>}
            <h3 className="mt-1 text-xl font-semibold text-ink">{draft.get("title") || labels.noTitle}</h3>
          </div>
          <p className="tabular text-2xl font-semibold text-ink">
            {Number.isFinite(price) && price > 0 ? formatPrice(price, currency) : labels.noPrice}
            {period && <span className="ml-1 text-sm font-normal text-ink-soft">{labels.pricePeriod(period)}</span>}
          </p>
        </div>

        {address && (
          <p className="flex items-start gap-2 text-sm text-ink-soft">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
            {address}
          </p>
        )}

        {facts.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {facts.map((fact) => (
              <li key={String(fact)} className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft">
                {fact}
              </li>
            ))}
          </ul>
        )}

        {description && (
          <div>
            <h4 className="text-sm font-semibold text-ink">{labels.description}</h4>
            <p className="mt-1 line-clamp-6 text-sm whitespace-pre-line text-ink-soft">{description}</p>
          </div>
        )}

        {selectedFeatures.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-ink">{labels.features}</h4>
            <p className="mt-1 text-sm text-ink-soft">{selectedFeatures.join(" · ")}</p>
          </div>
        )}
      </div>
    </article>
  );
}
