import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Paylaşım kartları (OG, 1200×630) üçün şəkil köməkçiləri — elan (#103) və agentlik (#157).
 *
 * Yüklənmiş media WebP-dir, ImageResponse (satori/resvg) isə WebP-ni etibarlı oxumur;
 * ona görə şəkil `IMAGES` binding-i ilə kiçildilib JPEG/PNG edilir və data URI kimi
 * yerləşdirilir. Binding yoxdursa (lokal dev) `null` qaytarılır — kart şəkilsiz qurulur.
 */

async function readSourceImage(url: string): Promise<ReadableStream | null> {
  if (url.startsWith("/media/")) {
    const object = await getCloudflareContext().env.MEDIA?.get(url.slice("/media/".length));
    return object?.body ?? null;
  }
  if (!url.startsWith("https://")) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  return response.ok ? response.body : null;
}

function toDataUri(bytes: Uint8Array, mime: string): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

/**
 * Şəkli kartda istifadə üçün data URI-yə çevirir. Loqo şəffaflığını saxlamaq üçün
 * `image/png`, foto üçün `image/jpeg` seçilir.
 */
export async function ogImageDataUri(
  url: string | null | undefined,
  options: { width: number; height: number; fit: "cover" | "contain"; format: "image/jpeg" | "image/png" },
): Promise<string | null> {
  if (!url) return null;
  try {
    const images = getCloudflareContext().env.IMAGES;
    if (!images) return null;
    const source = await readSourceImage(url);
    if (!source) return null;
    const result = await images
      .input(source)
      .transform({ width: options.width, height: options.height, fit: options.fit })
      .output(options.format === "image/jpeg" ? { format: "image/jpeg", quality: 78 } : { format: "image/png" });
    return toDataUri(new Uint8Array(await result.response().arrayBuffer()), options.format);
  } catch (error) {
    console.error("[og] şəkil hazırlanmadı:", error instanceof Error ? error.message : error);
    return null;
  }
}

const CACHE_CONTROL = "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";

/**
 * Hazır kartı cavaba çevirir. PNG ~800 KB olur, WhatsApp isə ~300 KB-dan böyük önizləməni
 * göstərmir — JPEG-ə çevrilir, alınmasa PNG olduğu kimi qaytarılır (bayt dəsti əvvəlcədən
 * oxunur ki, fallback mümkün olsun).
 */
export async function ogJpegResponse(response: Response): Promise<Response> {
  const png = await response.arrayBuffer();
  const images = getCloudflareContext().env.IMAGES;
  if (images) {
    try {
      const jpeg = await images.input(new Response(png).body!).output({ format: "image/jpeg", quality: 82 });
      return new Response(jpeg.response().body, {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": CACHE_CONTROL },
      });
    } catch (error) {
      console.error("[og] JPEG çevrilməsi alınmadı:", error instanceof Error ? error.message : error);
    }
  }
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": CACHE_CONTROL } });
}
