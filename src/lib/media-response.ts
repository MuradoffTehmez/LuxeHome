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
export function mediaCacheKey(pathname: string): string {
  return `https://media-cache.internal${pathname}`;
}

/**
 * Silinən şəklin kənar nüsxəsini bu data mərkəzində təmizləyir (best-effort, heç vaxt atmır).
 * Digər data mərkəzlərində nüsxə `MEDIA_EDGE_TTL` bitəndə düşür.
 */
export async function purgeMediaCache(pathnames: string[]): Promise<void> {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (!cache) return;
  await Promise.all(pathnames.map((pathname) => cache.delete(mediaCacheKey(pathname)).catch(() => false)));
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
