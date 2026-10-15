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

import { DEFAULT_IMAGE_QUALITY, isAllowedImageQuality, isAllowedImageWidth } from "./image-sizes";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const IMMUTABLE = "public, max-age=31536000, immutable";

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
      "Cache-Control": IMMUTABLE,
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
  if (!key || !bucket || !images) return mediaResponse(bucket, key);
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
        "Cache-Control": IMMUTABLE,
        "X-Content-Type-Options": "nosniff",
        etag: `"${object.etag}-w${variant.width}q${variant.quality}"`,
      },
    });
  } catch (error) {
    console.error("[media] kiçiltmə alınmadı", key, error);
    return mediaResponse(bucket, key);
  }
}
