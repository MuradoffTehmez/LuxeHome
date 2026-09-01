"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Check, Navigation, CarFront } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/constants";
import { LeafletMap, type MapMarker } from "./leaflet-map";
import { directionsLinks } from "./tiles";

type PlaceMapProps = {
  latitude: number;
  longitude: number;
  title: string;
  /** Popup-da və ekran oxuyucusunda göstərilən ikinci sətir (ünvan). */
  subtitle?: string | null;
  className?: string;
  /** Xəritə qutusunun hündürlüyü — çağıran tərəf verir. */
  mapClassName?: string;
  /** Naviqasiya keçidləri sırası göstərilsin. */
  showActions?: boolean;
};

/**
 * Tək ünvanın xəritəsi + xarici naviqasiya keçidləri.
 *
 * Elan, layihə, əlaqə səhifəsi və footer eyni komponenti işlədir — xəritənin
 * davranışı (tema, zoom qaydası, tam ekran) bir yerdən idarə olunsun deyə.
 */
export function PlaceMap({
  latitude,
  longitude,
  title,
  subtitle,
  className,
  mapClassName = "h-80",
  showActions = true,
}: PlaceMapProps) {
  const t = useTranslations("content.map");
  const locale = useLocale() as Locale;
  const [copied, setCopied] = useState(false);
  const [boltCopied, setBoltCopied] = useState(false);

  const markers = useMemo<MapMarker[]>(
    () => [{ id: "place", latitude, longitude, title, subtitle }],
    [latitude, longitude, title, subtitle],
  );

  const links = directionsLinks(latitude, longitude, { title, address: subtitle, locale });
  const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

  async function copyCoordinates() {
    try {
      await navigator.clipboard.writeText(coordinates);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard icazəsi yoxdursa səssiz qalırıq — koordinat onsuz da ekrandadır.
    }
  }

  function copyDestinationForBolt() {
    const destination = [title, subtitle, coordinates].filter(Boolean).join(", ");
    void navigator.clipboard.writeText(destination).then(() => {
      setBoltCopied(true);
      window.setTimeout(() => setBoltCopied(false), 2500);
    }).catch(() => {
      // Clipboard bloklansa belə rəsmi Bolt səhifəsi yeni tabda açılır.
    });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <LeafletMap
        markers={markers}
        className={mapClassName}
        labels={{
          region: t("region", { title }),
          zoomIn: t("zoomIn"),
          zoomOut: t("zoomOut"),
          expand: t("expand"),
          collapse: t("collapse"),
          recenter: t("recenter"),
          scrollHint: t("scrollHint"),
        }}
      />

      {showActions && (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-line px-3 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
          >
            <Navigation className="size-4" aria-hidden="true" />
            {t("openInGoogle")}
          </a>
          <a
            href={links.waze}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-line px-3 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
          >
            {t("openInWaze")}
          </a>
          <a
            href={links.uber}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-line px-3 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
          >
            <CarFront className="size-4" aria-hidden="true" />
            {t("openInUber")}
          </a>
          <a
            href={links.bolt}
            target="_blank"
            rel="noopener noreferrer"
            onClick={copyDestinationForBolt}
            title={t("boltCopyHint")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-line px-3 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
          >
            {boltCopied ? <Check className="size-4 text-success" aria-hidden="true" /> : <CarFront className="size-4" aria-hidden="true" />}
            <span aria-live="polite">{boltCopied ? t("boltAddressCopied") : t("openInBolt")}</span>
          </a>
          <button
            type="button"
            onClick={copyCoordinates}
            className="tabular inline-flex min-h-11 items-center gap-2 rounded-xs border border-line px-3 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
          >
            {copied ? (
              <Check className="size-4 text-success" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            <span aria-live="polite">{copied ? t("coordinatesCopied") : coordinates}</span>
          </button>
        </div>
      )}
    </div>
  );
}
