import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_PARTNER_LOGO_SIZE,
  MAX_UPLOAD_SIZE,
} from "@/lib/constants";

/**
 * R2-yə şəkil yükləmə qatı.
 *
 * Fayl adı **heç vaxt** istifadəçidən gəlmir: açar server tərəfdə təsadüfi qurulur.
 * Əks halda `../` və ya çoxqat uzantı (`shell.php.jpg`) ilə bucket strukturuna
 * müdaxilə mümkün olardı. Orijinal ad yalnız `Media.originalName` sahəsində məlumat
 * kimi saxlanılır və heç bir yolda istifadə edilmir.
 *
 * Yüklənən fayl olduğu kimi saxlanılmır: Cloudflare Images binding-i ilə WebP-ə
 * çevrilir və ölçüsü məhdudlaşdırılır. Telefondan gələn 6 MB-lıq JPEG adətən
 * 300-500 KB-a düşür. Master format WebP-dir, AVIF deyil — AVIF kodlaşdırması
 * Workers-də xeyli çox CPU yeyir və böyük şəkildə limitə dəyir. Ziyarətçiyə AVIF
 * onsuz da `next/image` tərəfindən Accept başlığına görə verilir.
 */

export const MEDIA_FOLDERS = [
  "emlaklar",
  "layiheler",
  "bloq",
  "xidmetler",
  "terefdaslar",
  "terefdaslar-logo",
  "umumi",
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

type AllowedMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const EXTENSIONS: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Master şəklin maksimum eni — 4K ekranda tam ekran qalereya üçün kifayətdir. */
const MASTER_WIDTH = 2400;
const MASTER_QUALITY = 82;
/** Kart və siyahı önbaxışları üçün kiçik nüsxə. */
const THUMB_WIDTH = 640;
const THUMB_QUALITY = 74;

/**
 * Fayl imzası (magic bytes) yoxlaması.
 *
 * `Content-Type` başlığını göndərən tərəf yazır — ona etibar etmək olmaz. Bayt
 * imzası isə faylın həqiqi növünü göstərir: `.jpg` adı altında gələn HTML və ya
 * SVG faylı burada tutulur (SVG icazəli siyahıda yoxdur, çünki skript daşıya bilir).
 */
export function sniffImageType(bytes: Uint8Array): AllowedMime | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (PNG.every((byte, index) => bytes[index] === byte)) return "image/png";

  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));

  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ascii(8, 12).startsWith("avif")) return "image/avif";

  return null;
}

type Converted = {
  bytes: ArrayBuffer;
  contentType: string;
  extension: string;
};

/** Bir ArrayBuffer-dən təkrar oxuna bilən axın qurur. */
function streamOf(buffer: ArrayBuffer): ReadableStream {
  return new Response(buffer).body!;
}

/**
 * Şəkli WebP-ə çevirir və eni məhdudlaşdırır.
 *
 * Binding olmayan mühitdə (lokal `next dev`) orijinal bayt dəsti qaytarılır ki,
 * axın hər halda işləsin.
 */
async function toWebp(
  buffer: ArrayBuffer,
  source: AllowedMime,
  width: number,
  quality: number,
): Promise<Converted> {
  const images = getCloudflareContext().env.IMAGES;
  if (!images) {
    return { bytes: buffer, contentType: source, extension: EXTENSIONS[source] };
  }

  try {
    const result = await images
      .input(streamOf(buffer))
      // `scale-down` kiçik şəkli böyütmür — yalnız böyükləri kiçildir
      .transform({ width, fit: "scale-down" })
      .output({ format: "image/webp", quality });

    return {
      bytes: await result.response().arrayBuffer(),
      contentType: "image/webp",
      extension: "webp",
    };
  } catch (error) {
    // Çevirmə alınmasa, elan şəkilsiz qalmasın deyə orijinal saxlanılır
    console.error("[media] WebP çevirməsi alınmadı:", error);
    return { bytes: buffer, contentType: source, extension: EXTENSIONS[source] };
  }
}

async function dimensions(buffer: ArrayBuffer): Promise<{ width?: number; height?: number }> {
  const images = getCloudflareContext().env.IMAGES;
  if (!images) return {};

  try {
    const info = await images.info(streamOf(buffer));
    return "width" in info ? { width: info.width, height: info.height } : {};
  } catch {
    return {};
  }
}

export type UploadResult =
  | {
      ok: true;
      key: string;
      url: string;
      thumbUrl: string | null;
      mimeType: string;
      size: number;
      width?: number;
      height?: number;
    }
  | { ok: false; error: string };

export async function putImage(file: File, folder: MediaFolder): Promise<UploadResult> {
  const maxSize = folder === "terefdaslar-logo" ? MAX_PARTNER_LOGO_SIZE : MAX_UPLOAD_SIZE;
  if (file.size === 0) return { ok: false, error: "Fayl boşdur." };
  if (file.size > maxSize) {
    return {
      ok: false,
      error: `Fayl ${Math.round(maxSize / 1024 / 1024)} MB-dan böyükdür.`,
    };
  }

  const buffer = await file.arrayBuffer();
  const sourceType = sniffImageType(new Uint8Array(buffer.slice(0, 16)));
  if (!sourceType) {
    return { ok: false, error: "Yalnız JPEG, PNG, WebP və AVIF şəkilləri qəbul edilir." };
  }

  const bucket = getCloudflareContext().env.MEDIA;
  if (!bucket) return { ok: false, error: "Media anbarı əlçatan deyil." };

  const master = await toWebp(buffer, sourceType, MASTER_WIDTH, MASTER_QUALITY);
  const thumb = await toWebp(buffer, sourceType, THUMB_WIDTH, THUMB_QUALITY);
  const size = await dimensions(master.bytes);

  const now = new Date();
  const prefix = [
    folder,
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    crypto.randomUUID(),
  ].join("/");

  const key = `${prefix}.${master.extension}`;
  const thumbKey = `${prefix}-thumb.${thumb.extension}`;

  const httpMetadata = (contentType: string) => ({
    contentType,
    // Açar təsadüfidir və məzmun dəyişmir — uzun keş təhlükəsizdir
    cacheControl: "public, max-age=31536000, immutable",
  });

  await bucket.put(key, master.bytes, { httpMetadata: httpMetadata(master.contentType) });
  await bucket
    .put(thumbKey, thumb.bytes, { httpMetadata: httpMetadata(thumb.contentType) })
    .catch(() => undefined);

  return {
    ok: true,
    key,
    url: `/media/${key}`,
    thumbUrl: `/media/${thumbKey}`,
    mimeType: master.contentType,
    size: master.bytes.byteLength,
    ...size,
  };
}

/** Master və kiçik nüsxəni birlikdə silir. */
export async function deleteImage(url: string): Promise<void> {
  const key = keyFromUrl(url);
  if (!key) return;

  const bucket = getCloudflareContext().env.MEDIA;
  if (!bucket) return;

  const dot = key.lastIndexOf(".");
  const thumbKey = dot > 0 ? `${key.slice(0, dot)}-thumb${key.slice(dot)}` : null;

  await bucket.delete(key);
  if (thumbKey) await bucket.delete(thumbKey).catch(() => undefined);
}

/** `/media/emlaklar/2026/08/uuid.webp` → `emlaklar/2026/08/uuid.webp` */
export function keyFromUrl(url: string): string | null {
  const match = /^\/media\/(.+)$/.exec(url);
  return match ? match[1] : null;
}
