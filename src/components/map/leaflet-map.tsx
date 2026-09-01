"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Expand, Minimize2, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BAKU_CENTER,
  MAP_ATTRIBUTION,
  MAP_SUBDOMAINS,
  MAP_TILES,
} from "./tiles";

import "leaflet/dist/leaflet.css";
// Ardıcıllıq vacibdir: override-lar Leaflet-in öz stillərindən sonra gəlməlidir.
import "./leaflet-theme.css";

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  /** Popup-da başlığın altındakı sətir — ünvan, rayon və s. */
  subtitle?: string | null;
  /** Popup-dakı qiymət etiketi (artıq formatlanmış). */
  priceLabel?: string | null;
  /** Popup başlığı bu ünvana keçid olur. */
  href?: string | null;
  imageUrl?: string | null;
};

export type LeafletMapLabels = {
  /** Konteynerin `aria-label`-ı. */
  region: string;
  zoomIn: string;
  zoomOut: string;
  expand: string;
  collapse: string;
  recenter: string;
  /** Scroll zoom bağlı olanda göstərilən ipucu. */
  scrollHint: string;
};

type LeafletMapProps = {
  markers: MapMarker[];
  labels: LeafletMapLabels;
  className?: string;
  /** Marker olmadıqda və ya `fit` sönülü olduqda istifadə olunan mərkəz. */
  center?: [number, number];
  zoom?: number;
  /** Bütün markerləri əhatə edən görünüş qurulsun (siyahı xəritəsi üçün). */
  fitToMarkers?: boolean;
  /** Seçim rejimi: markeri sürükləmək və xəritəyə klikləməklə koordinat verilir. */
  selectable?: boolean;
  onSelect?: (latitude: number, longitude: number) => void;
  /** Tam ekran düyməsi göstərilsin. */
  allowFullscreen?: boolean;
};

/** Marker piktoqramı — kənar CDN-dən şəkil çəkilmir, ona görə CSP təmiz qalır. */
function pinMarkup(selectable: boolean): string {
  return `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 0.9C6.8 0.9 1 6.7 1 13.9c0 9.4 11.4 22.2 11.9 22.7a1.5 1.5 0 0 0 2.2 0C15.6 36.1 27 23.3 27 13.9 27 6.7 21.2 0.9 14 0.9Z" fill="${selectable ? "#806237" : "#aa8754"}" stroke="#17202b" stroke-width="1.6"/>
    <circle cx="14" cy="13.8" r="4.6" fill="#f7f3ec"/>
  </svg>`;
}

// `append()` deyil, `appendChild()`: layihədə Cloudflare Workers tipləri qlobaldır və
// `Element.append` HTMLRewriter-in imzasına (`string | ReadableStream | Response`) düşür.
function popupElement(marker: MapMarker): HTMLElement {
  const root = document.createElement("div");
  root.className = "flex flex-col gap-1 p-3";

  if (marker.imageUrl) {
    const image = document.createElement("img");
    image.src = marker.imageUrl;
    image.alt = "";
    image.loading = "lazy";
    image.className = "mb-1 h-24 w-full rounded-xs object-cover";
    root.appendChild(image);
  }

  // Mətn `textContent` ilə yazılır — başlıq və ünvan istifadəçi məzmunudur.
  const heading = document.createElement(marker.href ? "a" : "span");
  heading.textContent = marker.title;
  heading.className = "font-display text-sm leading-snug text-ink";
  if (marker.href && heading instanceof HTMLAnchorElement) {
    heading.href = marker.href;
    heading.className += " transition-colors hover:text-gold-deep";
  }
  root.appendChild(heading);

  if (marker.priceLabel) {
    const price = document.createElement("strong");
    price.textContent = marker.priceLabel;
    price.className = "tabular text-sm font-semibold text-ink";
    root.appendChild(price);
  }

  if (marker.subtitle) {
    const subtitle = document.createElement("span");
    subtitle.textContent = marker.subtitle;
    subtitle.className = "text-xs text-ink-muted";
    root.appendChild(subtitle);
  }

  return root;
}

/**
 * Bütün xəritələrin ortaq bazası: elan detalı, layihə, əlaqə, footer və panelin
 * koordinat seçicisi eyni komponenti işlədir.
 *
 * Leaflet `window`-dan asılıdır, ona görə yalnız effekt içində dinamik idxal
 * olunur. Mətnlər `labels` propu ilə gəlir: ictimai sayt `content`, panel isə
 * `admin` namespace-indən oxuyur — komponentin özü namespace-ə bağlanmır.
 */
export function LeafletMap({
  markers,
  labels,
  className,
  center,
  zoom = 15,
  fitToMarkers = false,
  selectable = false,
  onSelect,
  allowFullscreen = true,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const tileRef = useRef<import("leaflet").TileLayer | null>(null);
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Klik handler-i effektin asılılığına düşməsin deyə ref-də saxlanılır:
  // əks halda hər render xəritəni yenidən qurardı.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const initialCenter = useMemo<[number, number]>(
    () =>
      center
      ?? (markers[0]
        ? [markers[0].latitude, markers[0].longitude]
        : ([...BAKU_CENTER] as [number, number])),
    // Yalnız ilk mərkəz üçün lazımdır; sonrakı marker dəyişiklikləri ayrıca effektdə.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [center?.[0], center?.[1], markers[0]?.latitude, markers[0]?.longitude],
  );

  // 1) Xəritənin qurulması — bir dəfə.
  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        center: initialCenter,
        zoom,
        // Təkərlə zoom səhifə sürüşməsini oğurlayır; yalnız xəritəyə klikləndikdən
        // sonra açılır (aşağıdakı `focus`/`blur` bağlantısı).
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.control.zoom({ position: "topleft", zoomInTitle: labels.zoomIn, zoomOutTitle: labels.zoomOut }).addTo(map);
      map.attributionControl.setPrefix(false);

      markerLayerRef.current = L.layerGroup().addTo(map);

      map.on("click", (event: import("leaflet").LeafletMouseEvent) => {
        onSelectRef.current?.(event.latlng.lat, event.latlng.lng);
      });

      // Təkərlə zoom yalnız istifadəçi xəritə ilə işləməyə başlayandan sonra açılır
      // və kursor kənara çıxanda bağlanır — səhifə sürüşməsi oğurlanmır.
      // Leaflet `Map`-in `focus`/`blur` hadisəsi yoxdur, ona görə DOM səviyyəsində
      // (`focusin` fokus daxildəki elementdən də qabarır) dinlənilir.
      const element = containerRef.current;
      const enable = () => map.scrollWheelZoom.enable();
      const disable = () => map.scrollWheelZoom.disable();
      element.addEventListener("click", enable);
      element.addEventListener("focusin", enable);
      element.addEventListener("mouseleave", disable);
      element.addEventListener("focusout", disable);
      cleanupRef.current = () => {
        element.removeEventListener("click", enable);
        element.removeEventListener("focusin", enable);
        element.removeEventListener("mouseleave", disable);
        element.removeEventListener("focusout", disable);
      };

      setReady(true);
    });

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      tileRef.current = null;
      markerLayerRef.current = null;
      setReady(false);
    };
    // Yalnız mount/unmount: sonrakı dəyişikliklər ayrıca effektlərdə tətbiq olunur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Tema dəyişəndə tile qatı əvəzlənir.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    tileRef.current?.remove();
    tileRef.current = L.tileLayer(isDark ? MAP_TILES.dark : MAP_TILES.light, {
      attribution: MAP_ATTRIBUTION,
      subdomains: MAP_SUBDOMAINS,
      maxZoom: 20,
      // `{r}` Leaflet tərəfindən retina ekranlarda `@2x` ilə əvəzlənir (CARTO hər
      // iki variantı verir). `detectRetina` **qəsdən açılmır**: o, tile ölçüsünü
      // yarıya bölüb zoom offset-i sürüşdürür və `{r}` ilə birlikdə şəkli iki dəfə
      // böyüdərdi.
    }).addTo(map);
    tileRef.current.setZIndex(0);
  }, [ready, isDark]);

  // 3) Markerlərin yenilənməsi.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!ready || !L || !map || !layer) return;

    layer.clearLayers();

    const icon = L.divIcon({
      className: cn("lhe-marker", selectable && "lhe-marker--draggable"),
      html: pinMarkup(selectable),
      iconSize: [28, 38],
      iconAnchor: [14, 37],
      popupAnchor: [0, -32],
    });

    for (const marker of markers) {
      const instance = L.marker([marker.latitude, marker.longitude], {
        icon,
        title: marker.title,
        alt: marker.title,
        keyboard: true,
        draggable: selectable,
      });

      if (selectable) {
        instance.on("dragend", () => {
          const position = instance.getLatLng();
          onSelectRef.current?.(position.lat, position.lng);
        });
      } else {
        instance.bindPopup(popupElement(marker), { closeButton: true, maxWidth: 260 });
      }

      instance.addTo(layer);
    }

    if (markers.length === 0) return;

    if (fitToMarkers && markers.length > 1) {
      map.fitBounds(
        L.latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude] as [number, number])),
        { padding: [40, 40], maxZoom: 16 },
      );
    } else if (selectable || markers.length === 1) {
      // Seçim rejimində koordinat kənardan da dəyişə bilər (ünvan axtarışı) —
      // görünüş markerin ardınca gedir, amma zoom səviyyəsi qorunur.
      map.setView([markers[0].latitude, markers[0].longitude], map.getZoom());
    }
  }, [ready, markers, fitToMarkers, selectable]);

  // 4) Ölçü dəyişəndə (tam ekran, sekme, responsiv grid) tile-lar yenidən hesablanır.
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!ready || !map || !container || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => mapRef.current?.invalidateSize(), 60);
    return () => window.clearTimeout(timer);
  }, [ready, fullscreen]);

  // Tam ekranda Escape bağlayır.
  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  const recenter = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markers.length > 1) {
      map.fitBounds(
        L.latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude] as [number, number])),
        { padding: [40, 40], maxZoom: 16 },
      );
    } else {
      map.setView(markers[0] ? [markers[0].latitude, markers[0].longitude] : initialCenter, zoom);
    }
  }, [markers, initialCenter, zoom]);

  return (
    <div
      className={cn(
        "lhe-map relative isolate overflow-hidden rounded-md border border-line bg-beige",
        fullscreen && "fixed inset-0 z-100 rounded-none border-0",
        className,
      )}
    >
      <div
        ref={containerRef}
        role="region"
        aria-label={labels.region}
        className="size-full min-h-40"
      />

      <div className="pointer-events-none absolute top-3 right-3 z-[500] flex flex-col gap-2">
        <button
          type="button"
          onClick={recenter}
          aria-label={labels.recenter}
          title={labels.recenter}
          className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-xs border border-line bg-paper text-ink-soft shadow-sm transition-colors hover:border-gold hover:text-gold-deep"
        >
          <Crosshair className="size-4" aria-hidden="true" />
        </button>
        {allowFullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen((value) => !value)}
            aria-label={fullscreen ? labels.collapse : labels.expand}
            title={fullscreen ? labels.collapse : labels.expand}
            aria-pressed={fullscreen}
            className="pointer-events-auto inline-flex size-9 items-center justify-center rounded-xs border border-line bg-paper text-ink-soft shadow-sm transition-colors hover:border-gold hover:text-gold-deep"
          >
            {fullscreen ? <Minimize2 className="size-4" aria-hidden="true" /> : <Expand className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      <p className="pointer-events-none absolute bottom-2 left-2 z-[500] hidden rounded-xs bg-charcoal/60 px-2 py-1 text-[0.6875rem] text-white sm:block">
        {labels.scrollHint}
      </p>
    </div>
  );
}
