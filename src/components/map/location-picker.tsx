"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";

import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { LeafletMap, type LeafletMapLabels, type MapMarker } from "./leaflet-map";

export type LocationPickerLabels = {
  latitude: string;
  longitude: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchAction: string;
  searching: string;
  noResults: string;
  searchError: string;
  useMyLocation: string;
  locationDenied: string;
  clear: string;
  hint: string;
  map: LeafletMapLabels;
};

type GeocodeResult = { label: string; latitude: number; longitude: number };

type LocationPickerProps = {
  labels: LocationPickerLabels;
  defaultLatitude?: string | number | null;
  defaultLongitude?: string | number | null;
  /** Server action-ın oxuduğu sahə adları — forma sxemi ilə eyni qalmalıdır. */
  latitudeName?: string;
  longitudeName?: string;
  latitudeError?: string;
  longitudeError?: string;
  /** Axtarış qutusuna ilkin dəyər (adətən elanın ünvanı). */
  initialQuery?: string;
  className?: string;
};

function toFieldValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

/**
 * Koordinatın xəritədən seçilməsi.
 *
 * Elan yerləşdirən adam enlik/uzunluğu əl ilə tapmır: burada ünvan yazılır və ya
 * xəritəyə klikləmək (markeri sürükləmək) kifayətdir. Rəqəm sahələri yenə də
 * görünən qalır — həm dəqiq düzəliş, həm də mövcud server action sxemi (`latitude`,
 * `longitude`) üçün; komponent sadəcə onları doldurur.
 *
 * Ünvan axtarışı `/api/geocode` üzərindən gedir: kənar xidmətə birbaşa müraciət
 * həm CSP (`connect-src 'self'`), həm də Nominatim-in `User-Agent` tələbi ilə
 * bağlıdır.
 */
export function LocationPicker({
  labels,
  defaultLatitude,
  defaultLongitude,
  latitudeName = "latitude",
  longitudeName = "longitude",
  latitudeError,
  longitudeError,
  initialQuery = "",
  className,
}: LocationPickerProps) {
  const [latitude, setLatitude] = useState(() => toFieldValue(defaultLatitude));
  const [longitude, setLongitude] = useState(() => toFieldValue(defaultLongitude));
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error" | "denied">("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const hasPoint =
    latitude !== "" &&
    longitude !== "" &&
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude);

  const markers = useMemo<MapMarker[]>(
    () =>
      hasPoint
        ? [{ id: "picked", latitude: parsedLatitude, longitude: parsedLongitude, title: labels.searchLabel }]
        : [],
    [hasPoint, parsedLatitude, parsedLongitude, labels.searchLabel],
  );

  const select = useCallback((nextLatitude: number, nextLongitude: number) => {
    // Altı onluq rəqəm ≈ 10 sm dəqiqlik — elan üçün lazım olandan artıqdır.
    setLatitude(nextLatitude.toFixed(6));
    setLongitude(nextLongitude.toFixed(6));
    setResults([]);
    setStatus("idle");
  }, []);

  async function search() {
    const trimmed = query.trim();
    if (trimmed.length < 3) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(String(response.status));
      const payload = (await response.json()) as { results?: GeocodeResult[] };
      const found = payload.results ?? [];
      setResults(found);
      setStatus(found.length === 0 ? "empty" : "idle");
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("[location-picker]", error);
      setResults([]);
      setStatus("error");
    }
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => select(position.coords.latitude, position.coords.longitude),
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              label={labels.searchLabel}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // Forma daxilindədir: Enter elanı göndərməməli, ünvanı axtarmalıdır.
                if (event.key === "Enter") {
                  event.preventDefault();
                  void search();
                }
              }}
              placeholder={labels.searchPlaceholder}
              hint={labels.hint}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2 sm:pb-6">
            <button
              type="button"
              onClick={() => void search()}
              disabled={status === "loading" || query.trim().length < 3}
              className="inline-flex min-h-12 items-center gap-2 rounded-xs border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-deep disabled:cursor-not-allowed disabled:text-ink-muted"
            >
              {status === "loading" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="size-4" aria-hidden="true" />
              )}
              {status === "loading" ? labels.searching : labels.searchAction}
            </button>

            <button
              type="button"
              onClick={locateMe}
              title={labels.useMyLocation}
              aria-label={labels.useMyLocation}
              className="inline-flex min-h-12 items-center justify-center rounded-xs border border-line-strong px-4 text-ink transition-colors hover:border-gold hover:text-gold-deep"
            >
              <LocateFixed className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-xs border border-line bg-paper p-1">
            {results.map((result) => (
              <li key={`${result.latitude},${result.longitude}`}>
                <button
                  type="button"
                  onClick={() => select(result.latitude, result.longitude)}
                  className="flex w-full items-start gap-2 rounded-xs px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-beige hover:text-ink"
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                  {result.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {status === "empty" && <p className="text-xs text-ink-muted">{labels.noResults}</p>}
        {status === "error" && <p className="text-xs font-medium text-danger">{labels.searchError}</p>}
        {status === "denied" && <p className="text-xs font-medium text-danger">{labels.locationDenied}</p>}
      </div>

      <LeafletMap
        markers={markers}
        labels={labels.map}
        className="h-72 sm:h-80"
        selectable
        onSelect={select}
        center={hasPoint ? [parsedLatitude, parsedLongitude] : undefined}
        zoom={hasPoint ? 16 : 12}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name={latitudeName}
          label={labels.latitude}
          type="number"
          step="any"
          inputMode="decimal"
          value={latitude}
          error={latitudeError}
          onChange={(event) => setLatitude(event.target.value)}
        />
        <Input
          name={longitudeName}
          label={labels.longitude}
          type="number"
          step="any"
          inputMode="decimal"
          value={longitude}
          error={longitudeError}
          onChange={(event) => setLongitude(event.target.value)}
        />
      </div>

      {hasPoint && (
        <button
          type="button"
          onClick={() => {
            setLatitude("");
            setLongitude("");
          }}
          className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-ink-muted transition-colors hover:text-danger"
        >
          <X className="size-4" aria-hidden="true" />
          {labels.clear}
        </button>
      )}
    </div>
  );
}
