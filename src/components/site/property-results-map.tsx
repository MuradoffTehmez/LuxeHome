"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, PenLine, Trash2, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { LeafletMap, type MapMarker } from "@/components/map/leaflet-map";
import { MAX_POLYGON_POINTS, serializePolygon, type LatLng } from "@/lib/geo-polygon";

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
  polygon,
  areaBaseHref,
}: {
  points: PropertyMapPoint[];
  /** Locale prefiksli elan yolu — popup keçidləri buradan qurulur. */
  hrefBase: string;
  shownCount: number;
  total: number;
  /** Aktiv axtarış sahəsi (`?sahe=`), yoxdursa `null`. */
  polygon?: LatLng[] | null;
  /**
   * `sahe` parametri olmayan cari axtarış linki (locale-siz). Funksiya server
   * komponentindən ötürülə bilmədiyi üçün sahə dəyəri burada əlavə olunur.
   */
  areaBaseHref?: string;
}) {
  const t = useTranslations("content.map");
  const router = useRouter();
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<LatLng[]>([]);
  const areaHref = areaBaseHref === undefined
    ? undefined
    : (value: string | null) =>
        value ? `${areaBaseHref}${areaBaseHref.includes("?") ? "&" : "?"}sahe=${encodeURIComponent(value)}` : areaBaseHref;

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

  const overlay = useMemo(
    () => (drawing ? { points: draft, closed: false } : polygon ? { points: polygon, closed: true } : undefined),
    [drawing, draft, polygon],
  );

  function finish() {
    if (!areaHref || draft.length < 3) return;
    setDrawing(false);
    router.push(areaHref(serializePolygon(draft)));
  }

  const toolbar = areaHref ? (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={t("drawToolbar")}>
      {drawing ? (
        <>
          <span className="text-sm text-ink-soft" aria-live="polite">{t("drawHint", { count: draft.length })}</span>
          <button type="button" onClick={finish} disabled={draft.length < 3} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm bg-navy px-3.5 text-sm font-semibold text-ivory disabled:opacity-50">
            <Check className="size-4" aria-hidden="true" />
            {t("drawFinish")}
          </button>
          <button type="button" onClick={() => { setDrawing(false); setDraft([]); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line px-3.5 text-sm font-medium text-ink hover:border-gold">
            <X className="size-4" aria-hidden="true" />
            {t("drawCancel")}
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => { setDraft([]); setDrawing(true); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line bg-paper px-3.5 text-sm font-semibold text-ink hover:border-gold hover:text-gold-deep">
            <PenLine className="size-4" aria-hidden="true" />
            {polygon ? t("drawAgain") : t("drawStart")}
          </button>
          {polygon ? (
            <button type="button" onClick={() => router.push(areaHref(null))} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm px-3 text-sm font-medium text-ink-soft hover:text-danger">
              <Trash2 className="size-4" aria-hidden="true" />
              {t("drawClear")}
            </button>
          ) : null}
        </>
      )}
    </div>
  ) : null;

  if (markers.length === 0 && !drawing && !polygon) {
    return (
      <div className="flex flex-col gap-3">
        {toolbar}
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-line bg-paper p-8 text-center text-sm text-ink-muted">
          {t("mapEmpty")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <LeafletMap
        markers={drawing ? [] : markers}
        overlay={overlay}
        drawing={drawing}
        onSelect={drawing ? (latitude, longitude) => setDraft((current) => (current.length >= MAX_POLYGON_POINTS ? current : [...current, [latitude, longitude]])) : undefined}
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
