/**
 * Şəkli yükləmədən əvvəl brauzerdə hazırlayır (#79).
 *
 * Müasir telefon şəkilləri (12–50 MP) çox vaxt 8 MB limitindən böyükdür, iPhone
 * isə HEIC verir — server bu formatı qəbul etmir. Server onsuz da master-i 2400 px
 * WebP-ə kiçildir, ona görə orijinalı tam ölçüdə göndərmək yalnız trafiki və Worker
 * yaddaşını yeyir. Burada şəkil uzun tərəfi 2400 px olmaqla yenidən kodlaşdırılır:
 *
 * - kiçik və icazəli formatdakı fayl olduğu kimi gedir (keyfiyyət itirilmir);
 * - şəffaflıq daşıya bilən PNG/WebP → WebP (brauzer WebP yaza bilmirsə PNG);
 * - qalanı → JPEG.
 *
 * Yenidən kodlaşdırma EXIF-i (o cümlədən GPS koordinatını) da atır.
 */

/** Serverin `sniffImageType()` allowlist-i ilə eyni. */
export const SERVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** Serverdəki `MASTER_WIDTH` ilə eyni — daha böyük göndərmək mənasızdır. */
export const PREPARE_MAX_DIMENSION = 2400;

/** Bu həddən kiçik, icazəli formatdakı və ölçüsü uyğun fayl dəyişdirilmir. */
export const PREPARE_PASSTHROUGH_BYTES = 1.5 * 1024 * 1024;

/** Ardıcıl sınanan keyfiyyətlər — fayl limitə sığana qədər. */
const QUALITY_STEPS = [0.86, 0.78, 0.68] as const;

export type ImagePrepareFailure = "unsupported" | "tooLarge";

export class ImagePrepareError extends Error {
  constructor(readonly kind: ImagePrepareFailure) {
    super(kind);
  }
}

type FileLike = { type: string; size: number; name: string };

/** HEIC/HEIF Windows-da çox vaxt boş MIME ilə gəlir — ad üzrə də tanınır. */
export function isImageCandidate(file: FileLike): boolean {
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}

function isServerType(type: string): boolean {
  return (SERVER_IMAGE_TYPES as readonly string[]).includes(type);
}

/** Yenidən kodlaşdırma lazımdırmı? `dims` yoxdursa yalnız format və ölçüyə baxılır. */
export function needsReencode(file: FileLike, dims?: { width: number; height: number }): boolean {
  if (!isServerType(file.type)) return true;
  if (file.size > PREPARE_PASSTHROUGH_BYTES) return true;
  return Boolean(dims && Math.max(dims.width, dims.height) > PREPARE_MAX_DIMENSION);
}

/** Nisbəti qoruyaraq uzun tərəfi `max`-a endirir; kiçik şəkli böyütmür. */
export function fitWithin(width: number, height: number, max = PREPARE_MAX_DIMENSION) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Sınanacaq çıxış formatları, üstünlük sırası ilə.
 *
 * Şəffaflıq daşıya bilən mənbə (PNG/WebP) əvvəlcə WebP, sonra PNG ilə yazılır —
 * birbaşa JPEG-ə keçsəydi şəffaf loqonun fonu qara olardı. JPEG son çarədir.
 */
export function encodeCandidates(sourceType: string): Array<"image/webp" | "image/png" | "image/jpeg"> {
  return sourceType === "image/png" || sourceType === "image/webp"
    ? ["image/webp", "image/png", "image/jpeg"]
    : ["image/jpeg"];
}

function renamed(name: string, type: string): string {
  const extension = type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg";
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${extension}`;
}

type Canvas = OffscreenCanvas | HTMLCanvasElement;

function createCanvas(width: number, height: number): Canvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function encode(canvas: Canvas, type: string, quality: number): Promise<Blob | null> {
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type, quality }).catch(() => null);
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Faylı serverə göndərməyə hazırlayır.
 *
 * Brauzer şəkli aça bilmirsə (məsələn, Chrome-da HEIC) və format server
 * allowlist-indədirsə, fayl olduğu kimi göndərilir — son qərarı server verir.
 */
export async function prepareImageForUpload(file: File, maxBytes: number): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (isServerType(file.type) && file.size <= maxBytes) return file;
    throw new ImagePrepareError("unsupported");
  }

  try {
    if (!needsReencode(file, bitmap)) return file;

    const size = fitWithin(bitmap.width, bitmap.height);
    const canvas = createCanvas(size.width, size.height);
    const context = canvas.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, size.width, size.height);

    for (const type of encodeCandidates(file.type)) {
      for (const quality of QUALITY_STEPS) {
        const blob = await encode(canvas, type, quality);
        // Brauzer bu formatı yaza bilmir (Safari WebP-də səssizcə PNG qaytarır) —
        // növbəti formata keçilir.
        if (!blob || blob.type !== type) break;
        if (blob.size <= maxBytes) {
          return new File([blob], renamed(file.name, type), { type, lastModified: file.lastModified });
        }
        // PNG keyfiyyət parametrini nəzərə almır — təkrar sınamaq mənasızdır.
        if (type === "image/png") break;
      }
    }
    throw new ImagePrepareError("tooLarge");
  } finally {
    bitmap.close();
  }
}
