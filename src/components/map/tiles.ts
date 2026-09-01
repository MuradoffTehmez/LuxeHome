/**
 * Xeritə tile mənbələri.
 *
 * OpenStreetMap-ın standart tile-ları (`tile.openstreetmap.org`) rəngli POI
 * ikonları ilə doludur və OSMF siyasəti kommersiya yükünü məhdudlaşdırır.
 * CARTO basemap-ları isə artıq açarsız işləmir: sorğu cavab verir, amma hər
 * tile-ın üstünə «API KEY REQUIRED» yazısı basılır.
 *
 * Ona görə tile-lar layihədə onsuz da mövcud olan **Geoapify** açarı ilə
 * çəkilir. URL öz mənşəyimizə baxır (`/api/map-tiles/...`): proxy açarı
 * serverdə saxlayır və panelin sərt CSP-si üçün `img-src 'self'` kifayət edir.
 *
 * `{r}` Leaflet tərəfindən retina ekranlarda `@2x` ilə əvəzlənir.
 */

export const MAP_TILES = {
  light: "/api/map-tiles/light/{z}/{x}/{y}{r}.png",
  dark: "/api/map-tiles/dark/{z}/{x}/{y}{r}.png",
} as const;

/** Provayderin atribusiya tələbi — xəritədən silinməməlidir. */
export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · <a href="https://www.geoapify.com/" target="_blank" rel="noopener">Geoapify</a>';

export const BAKU_CENTER: readonly [number, number] = [40.3777, 49.892];

/** Xarici naviqasiya tətbiqlərinə keçidlər. */
export function directionsLinks(
  latitude: number,
  longitude: number,
  destination?: { title?: string | null; address?: string | null; locale?: "az" | "en" | "ru" },
) {
  const title = destination?.title?.trim() || `${latitude}, ${longitude}`;
  const address = destination?.address?.trim() || `${latitude}, ${longitude}`;
  const uber = new URL("https://m.uber.com/looking");
  uber.searchParams.set("pickup", "my_location");
  uber.searchParams.set("drop[0]", JSON.stringify({
    latitude,
    longitude,
    addressLine1: title,
    addressLine2: address,
  }));

  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    googlePlace: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
    uber: uber.toString(),
    // Bolt ixtiyari koordinatla təyinat nöqtəsi verən ictimai deep-link təqdim
    // etmir. Rəsmi Bakı səhifəsi açılır; PlaceMap eyni anda ünvanı kopyalayır.
    bolt: destination?.locale === "az"
      ? "https://bolt.eu/az-az/cities/baku/"
      : "https://bolt.eu/en-az/cities/baku/",
  };
}
