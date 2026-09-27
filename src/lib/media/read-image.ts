import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Vision modelinə göndərilən şəklin yuxarı həddi — böyük fayl sorğunu uzadır. */
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

/**
 * Xarici şəkil oxumaq üçün icazəli hostlar — `next.config.ts`-dəki
 * `images.remotePatterns` siyahısının eynisi. İki siyahı ayrılarsa, göstərilə
 * bilməyən bir mənbə oxuna bilən qalar; dəyişiklik hər ikisinə tətbiq olunmalıdır.
 */
const AI_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "media.luxehomeestate.az",
  "treva.realestate",
]);

/**
 * Elan şəklini bayt massivi kimi oxuyur.
 *
 * Paneldən yüklənən şəkillərin URL-i `/media/<açar>` formatındadır və birbaşa R2
 * binding-indən oxunur: bu, bir şəbəkə gedişini aradan qaldırır və hələ dərc
 * edilməmiş elanın şəkli üçün də işləyir.
 *
 * Bazadakı hər şəkil isə R2-də olmur — stok və nümunə elanlar xarici URL daşıyır
 * (`images.unsplash.com`), R2 custom domeni də mütləq URL verir. Əvvəllər belə
 * şəkillər sadəcə `null` qaytarırdı və foto məsləhətçisi «heç bir şəkil analiz
 * edilə bilmədi» deyirdi. İndi mütləq `https:` URL-lər çəkilir.
 *
 * `http:` və digər sxemlər qəsdən qəbul edilmir, ölçü isə həm başlıqla, həm də
 * faktiki bayt sayı ilə yoxlanılır.
 */
async function readImageBytes(url: string): Promise<Uint8Array | null> {
  if (url.startsWith("/media/")) {
    const bucket = getCloudflareContext().env.MEDIA;
    const object = await bucket?.get(url.slice("/media/".length));
    if (!object) return null;
    return new Uint8Array(await object.arrayBuffer());
  }

  if (!url.startsWith("https://")) return null;

  // Host ağ siyahısı `next.config.ts`-dəki `images.remotePatterns` ilə eynidir:
  // şəkil hansı mənbədən göstərilə bilirsə, yalnız onu da oxuyuruq. Siyahısız
  // funksiya ixtiyari ictimai ünvana sorğu atan bir vasitəyə çevrilirdi.
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!AI_IMAGE_HOSTS.has(host)) return null;

  const response = await fetch(url, { headers: { accept: "image/*" } });
  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return null;

  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES) return null;

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

  return new Uint8Array(buffer);
}

/**
 * Əvvəlcə kiçik nüsxəni, alınmasa orijinalı oxuyur.
 *
 * `storeImage()` kiçik nüsxənin yazılma xətasını udur, amma `thumbUrl`-u yenə də
 * qaytarır — bazadakı `thumbUrl` mövcud olmayan fayla işarə edə bilər. Ona görə
 * `thumbUrl || url` kifayət deyil: oxuna bilməyən kiçik nüsxədən sonra orijinal sınanır.
 */
export async function readPreferredImageBytes(thumbUrl: string | null | undefined, url: string): Promise<Uint8Array | null> {
  if (thumbUrl && thumbUrl !== url) {
    const thumb = await readImageBytes(thumbUrl).catch(() => null);
    if (thumb) return thumb;
  }
  return readImageBytes(url);
}
