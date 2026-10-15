/**
 * R2-dəki şəkillərin (`/media/<açar>`) ictimai cavabı.
 *
 * Bucket-ın öz custom domeni yoxdur, ona görə fayllar Worker üzərindən verilir. Açar təsadüfi
 * UUID-dir və məzmun heç vaxt dəyişmir — cavab bir il `immutable` keşlə göndərilir.
 *
 * Worker cavabı Cloudflare CDN-ində avtomatik keşlənmir: `worker.ts` bu modulu OpenNext-dən
 * **əvvəl** çağırır və nəticəni Cache API-də saxlayır (#165). Əvvəllər hər şəkil tam OpenNext
 * marşrutlaşdırmasından keçib R2-dən oxunurdu (~250 ms). `src/app/media/[...key]/route.ts`
 * eyni funksiyanı işlədir — `next dev` və sarğıdan yan keçən sorğular üçün.
 *
 * Cavabda `Content-Disposition: inline` və `X-Content-Type-Options: nosniff` var:
 * yüklənmiş fayl brauzerdə HTML kimi şərh olunub sayt daxilində skript işlətməməlidir.
 */

import {
  DEFAULT_IMAGE_QUALITY,
  IMAGE_DEVICE_SIZES,
  IMAGE_QUALITIES,
  IMAGE_SIZES,
  isAllowedImageQuality,
  isAllowedImageWidth,
} from "./image-sizes";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
export const MEDIA_CLIENT_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * Kənar keşdəki nüsxənin ömrü. Brauzer faylı bir il saxlayır (URL dəyişməz UUID-dir), amma
 * paneldən silinən şəkil kənarda da tez yox olmalıdır: `purgeMediaCache()` yalnız silmənin
 * baş verdiyi data mərkəzini təmizləyə bilir (Cache API lokaldır), digərlərində nüsxə ən çox
 * bu müddət yaşayır.
 */
export const MEDIA_EDGE_TTL = 86_400;

/**
 * Cache API açarı. Host-dan asılı deyil (kanonik domen, workers.dev) — silmə zamanı açarı
 * sorğu kontekstindən kənarda da eyni şəkildə qurmaq olsun.
 */
export function mediaCacheKey(pathname: string, variant?: MediaVariant | null): string {
  const suffix = variant ? `?w=${variant.width}&q=${variant.quality}` : "";
  return `https://media-cache.internal${pathname}${suffix}`;
}

/** Bir faylın bütün mümkün kənar nüsxələri: orijinal + hər icazəli en × keyfiyyət (#167). */
function allMediaCacheKeys(pathname: string): string[] {
  const keys = [mediaCacheKey(pathname)];
  for (const width of [...IMAGE_DEVICE_SIZES, ...IMAGE_SIZES]) {
    for (const quality of IMAGE_QUALITIES) keys.push(mediaCacheKey(pathname, { width, quality }));
  }
  return keys;
}

/**
 * Kiçiltmə alınmayıb orijinal verilən cavabın işarəsi: worker onu kənar keşə yazmır (başlığı
 * silib klientə verir), yoxsa həmin data mərkəzi çevirməni bir də sınamazdı (Codex rəyi, #168).
 */
export const MEDIA_NO_EDGE_CACHE_HEADER = "x-media-no-edge-cache";
/** Ehtiyat (kiçildilməmiş) cavabın brauzer ömrü — çevirmə bərpa olunanda tez yenilənsin. */
const MEDIA_FALLBACK_CACHE_CONTROL = "public, max-age=300";

/**
 * Silinən şəklin kənar nüsxələrini (orijinal + bütün ölçülər) bu data mərkəzində təmizləyir
 * (best-effort, heç vaxt atmır). Digər data mərkəzlərində nüsxə `MEDIA_EDGE_TTL` bitəndə düşür.
 */
export async function purgeMediaCache(pathnames: string[]): Promise<void> {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (!cache) return;
  const keys = pathnames.flatMap(allMediaCacheKeys);
  await Promise.all(keys.map((key) => cache.delete(key).catch(() => false)));
}

// `..` seqmenti R2-də qovluq mənası daşımır, amma açarın gözlənilən formada
// olduğunu yoxlamaq gələcək dəyişikliklərdə də qorunma verir.
const MEDIA_KEY = /^[a-z0-9/_-]+\.(jpg|png|webp|avif)$/i;
const MEDIA_PREFIX = "/media/";

/** `/media/emlaklar/2026/10/x.webp` → `emlaklar/2026/10/x.webp`; uyğun deyilsə `null`. */
export function mediaKeyFromPath(pathname: string): string | null {
  if (!pathname.startsWith(MEDIA_PREFIX)) return null;
  const key = pathname.slice(MEDIA_PREFIX.length);
  return MEDIA_KEY.test(key) ? key : null;
}

function notFound(): Response {
  return new Response("Tapılmadı", { status: 404, headers: { "Cache-Control": "no-store" } });
}

/** R2 obyektini təhlükəsiz başlıqlarla cavaba çevirir; açar etibarsızdırsa və ya yoxdursa 404. */
export async function mediaResponse(bucket: R2Bucket | undefined, key: string | null): Promise<Response> {
  if (!key || !bucket) return notFound();
  const object = await bucket.get(key);
  if (!object) return notFound();

  const contentType = object.httpMetadata?.contentType ?? "";
  return new Response(object.body, {
    headers: {
      "Content-Type": ALLOWED_TYPES.has(contentType) ? contentType : "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": MEDIA_CLIENT_CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
      etag: object.httpEtag,
    },
  });
}

export type MediaVariant = { width: number; quality: number };

/**
 * `?w=&q=` (qlobal `image-loader.ts`) → kiçildilmiş nüsxə; `w` yoxdursa `null` (orijinal).
 * Siyahıdan kənar en və ya keyfiyyət `"invalid"` qaytarır — hər ixtiyari dəyər ayrıca
 * ödənişli çevirmə və keş girişi yaratmasın deyə 400 verilir.
 */
export function mediaVariantFromSearch(params: URLSearchParams): MediaVariant | null | "invalid" {
  const rawWidth = params.get("w");
  if (rawWidth === null) return null;
  const width = Number(rawWidth);
  const quality = Number(params.get("q") ?? DEFAULT_IMAGE_QUALITY);
  if (!isAllowedImageWidth(width) || !isAllowedImageQuality(quality)) return "invalid";
  return { width, quality };
}

/**
 * R2 orijinalını IMAGES binding-i ilə verilmiş enə qədər kiçildib WebP verir (#167).
 * Mənbə onsuz da WebP-dir və bütün dəstəklənən brauzerlər onu oxuyur — format `Accept`-dən
 * asılı deyil, ona görə keş açarı da yalnız yol + en + keyfiyyətdir. `scale-down` kiçik
 * mənbəni böyütmür. Çevirmə alınmasa (binding yoxdur, xəta) orijinal verilir: şəkil
 * yavaş gəlsin, amma qırılmasın.
 */
export async function resizedMediaResponse(
  bucket: R2Bucket | undefined,
  images: ImagesBinding | undefined,
  key: string | null,
  variant: MediaVariant,
): Promise<Response> {
  if (!key || !bucket || !images) return fallbackMediaResponse(bucket, key);
  const object = await bucket.get(key);
  if (!object) return notFound();

  try {
    const result = await images
      .input(object.body)
      .transform({ width: variant.width, fit: "scale-down" })
      .output({ format: "image/webp", quality: variant.quality });
    return new Response(result.image(), {
      headers: {
        "Content-Type": result.contentType(),
        "Content-Disposition": "inline",
        "Cache-Control": MEDIA_CLIENT_CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
        etag: `"${object.etag}-w${variant.width}q${variant.quality}"`,
      },
    });
  } catch (error) {
    console.error("[media] kiçiltmə alınmadı", key, error);
    return fallbackMediaResponse(bucket, key);
  }
}

/** Orijinal, amma kənar keşə yazılmayan və brauzerdə qısa yaşayan cavab. */
async function fallbackMediaResponse(bucket: R2Bucket | undefined, key: string | null): Promise<Response> {
  const response = await mediaResponse(bucket, key);
  if (response.status !== 200) return response;
  const fallback = new Response(response.body, response);
  fallback.headers.set("Cache-Control", MEDIA_FALLBACK_CACHE_CONTROL);
  fallback.headers.set(MEDIA_NO_EDGE_CACHE_HEADER, "1");
  return fallback;
}
