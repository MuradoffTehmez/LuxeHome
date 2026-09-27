/**
 * Xəritədə çəkilmiş axtarış sahəsi (#107) — saf funksiyalar (server və brauzer).
 *
 * URL formatı: `?sahe=40.40123,49.86712;40.41,49.88;...` — nöqtələr 5 onluq rəqəmə
 * (~1 m) yuvarlaqlaşdırılır ki, link qısa qalsın. Ən az 3, ən çox `MAX_POLYGON_POINTS`
 * nöqtə; Azərbaycan hüdudlarından kənar koordinat rədd edilir (saxta və ya pozulmuş link).
 */

export type LatLng = [number, number];

export const MAX_POLYGON_POINTS = 20;
/** Təxmini Azərbaycan sərhəd qutusu — kənar koordinat filtri boşa çıxarmasın. */
const BOUNDS = { minLat: 38.3, maxLat: 41.95, minLng: 44.7, maxLng: 50.7 };

const round = (value: number) => Math.round(value * 1e5) / 1e5;

export function parsePolygon(raw: string | undefined | null): LatLng[] | null {
  if (!raw) return null;
  const points = raw.split(";").map((pair) => pair.split(",").map(Number));
  if (points.length < 3 || points.length > MAX_POLYGON_POINTS) return null;
  const result: LatLng[] = [];
  for (const point of points) {
    if (point.length !== 2 || !point.every(Number.isFinite)) return null;
    const [lat, lng] = point;
    if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lng < BOUNDS.minLng || lng > BOUNDS.maxLng) return null;
    result.push([round(lat), round(lng)]);
  }
  return result;
}

export function serializePolygon(points: LatLng[]): string {
  return points.map(([lat, lng]) => `${round(lat)},${round(lng)}`).join(";");
}

export function boundingBox(points: LatLng[]) {
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
}

/** Şüa kəsişmə (ray casting) üsulu — şəhər miqyasında düz müstəvi yaxınlaşması kifayətdir. */
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const [y, x] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
