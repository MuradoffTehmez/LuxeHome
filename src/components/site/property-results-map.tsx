"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { LeafletMap, type MapMarker } from "@/components/map/leaflet-map";

export type PropertyMapPoint = {
  id: string;
  title: string;
  slug: string;
  latitude: number;
  longitude: number;
  subtitle: string | null;
  priceLabel: string;
  imageUrl: string | null;
};

/**
 * Axtarış nəticələrinin xəritə görünüşü.
 *
 * Marker məlumatı (qiymət, ünvan, şəkil) serverdə hazırlanıb gəlir — qiymət
 * formatlaması və lokalizasiya ictimai səhifənin qalan hissəsi ilə eyni yerdən
 * getsin deyə. Komponentin öz işi yalnız markerləri xəritəyə vermək və
 * hamısını əhatə edən görünüş qurmaqdır.
 */
export function PropertyResultsMap({
  points,
  hrefBase,
  shownCount,
  total,
}: {
  points: PropertyMapPoint[];
  /** Locale prefiksli elan yolu — popup keçidləri buradan qurulur. */
  hrefBase: string;
  shownCount: number;
  total: number;
}) {
  const t = useTranslations("content.map");

  const markers = useMemo<MapMarker[]>(
    () =>
      points.map((point) => ({
        id: point.id,
        latitude: point.latitude,
        longitude: point.longitude,
        title: point.title,
        subtitle: point.subtitle,
        priceLabel: point.priceLabel,
        imageUrl: point.imageUrl,
        href: `${hrefBase}/${point.slug}`,
      })),
    [points, hrefBase],
  );

  if (markers.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-md border border-line bg-paper p-8 text-center text-sm text-ink-muted">
        {t("mapEmpty")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <LeafletMap
        markers={markers}
        fitToMarkers
        className="h-[26rem] sm:h-[32rem]"
        labels={{
          region: t("mapView"),
          zoomIn: t("zoomIn"),
          zoomOut: t("zoomOut"),
          expand: t("expand"),
          collapse: t("collapse"),
          recenter: t("recenter"),
          scrollHint: t("scrollHint"),
        }}
      />
      <p className="text-sm text-ink-muted">
        {t("markerCount", { count: shownCount })}
        {total > shownCount ? ` / ${total}` : ""}
      </p>
    </div>
  );
}
