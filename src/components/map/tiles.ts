/**
 * Xəritə tile mənbələri.
 *
 * OpenStreetMap-ın standart tile-ları (`tile.openstreetmap.org`) rəngli POI
 * ikonları ilə doludur — əmlak elanının yanında xəritə səliqəsiz görünürdü — və
 * OSMF-in istifadə siyasəti kommersiya yükünü açıq şəkildə məhdudlaşdırır.
 *
 * CARTO basemap-ları eyni OSM datasından qurulur, amma sadələşdirilmiş dizayna
 * malikdir və **açıq/tünd üçün ayrı stil** verir: `.dark` klassı ilə işləyən
 * dizayn sistemində xəritənin də temaya uyğunlaşması vacibdir, əks halda tünd
 * səhifədə ağ düzbucaqlı kimi görünür. API açarı tələb olunmur; atribusiya
 * məcburidir və `attribution` sətrində saxlanılır.
 */

export const MAP_TILES = {
  light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png",
} as const;

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>';

/** CSP `img-src` siyahısına düşməli olan tile hostu (`src/middleware.ts`). */
export const MAP_TILE_HOST = "https://*.basemaps.cartocdn.com";

export const MAP_SUBDOMAINS = "abcd";

/** Bakının mərkəzi — koordinatı olmayan xəritələr üçün başlanğıc nöqtə. */
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
