"use client";

import { useTranslations } from "next-intl";

import { LocationPicker } from "@/components/map/location-picker";
import { useFieldError } from "./form-shell";

/**
 * Koordinat seçicisinin panel variantı.
 *
 * `LocationPicker` namespace-ə bağlanmır — mətnləri prop kimi alır ki, eyni
 * komponent həm panel, həm də ictimai kataloqla işləyə bilsin. Bu sarğı panel
 * tərəfini bir yerə yığır: 19 tərcümə açarı və `AdminInput`-larda olduğu kimi
 * kontekstdən gələn sahə xətaları.
 */
export function AdminLocationPicker({
  defaultLatitude,
  defaultLongitude,
  initialQuery,
  latitudeName = "latitude",
  longitudeName = "longitude",
}: {
  defaultLatitude?: string | number | null;
  defaultLongitude?: string | number | null;
  initialQuery?: string;
  /** Forma sahələrinin adı — elan forması `latitude`, parametrlər `contactLatitude`. */
  latitudeName?: string;
  longitudeName?: string;
}) {
  const t = useTranslations("admin");

  return (
    <LocationPicker
      defaultLatitude={defaultLatitude}
      defaultLongitude={defaultLongitude}
      initialQuery={initialQuery}
      latitudeName={latitudeName}
      longitudeName={longitudeName}
      latitudeError={useFieldError(latitudeName)}
      longitudeError={useFieldError(longitudeName)}
      labels={{
        latitude: t("components.locationPicker.latitude"),
        longitude: t("components.locationPicker.longitude"),
        searchLabel: t("components.locationPicker.searchLabel"),
        searchPlaceholder: t("components.locationPicker.searchPlaceholder"),
        searchAction: t("components.locationPicker.searchAction"),
        searching: t("components.locationPicker.searching"),
        noResults: t("components.locationPicker.noResults"),
        searchError: t("components.locationPicker.searchError"),
        useMyLocation: t("components.locationPicker.useMyLocation"),
        locationDenied: t("components.locationPicker.locationDenied"),
        clear: t("components.locationPicker.clear"),
        hint: t("components.locationPicker.hint"),
        map: {
          region: t("components.locationPicker.map.region"),
          zoomIn: t("components.locationPicker.map.zoomIn"),
          zoomOut: t("components.locationPicker.map.zoomOut"),
          expand: t("components.locationPicker.map.expand"),
          collapse: t("components.locationPicker.map.collapse"),
          recenter: t("components.locationPicker.map.recenter"),
          scrollHint: t("components.locationPicker.map.scrollHint"),
        },
      }}
    />
  );
}
