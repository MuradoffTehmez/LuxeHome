import { DEFAULT_IMAGE_QUALITY } from "./image-sizes";

/**
 * Qlobal `next/image` loader-i (#167).
 *
 * OpenNext-in `/_next/image` marşrutu nisbi URL-i yalnız `ASSETS` (build vaxtı statik fayllar)
 * üzərindən axtarır və R2-dəki `/media/...` şəkillərini tapmır. Ona görə `/media` ünvanı birbaşa
 * `?w=&q=` ilə qaytarılır — `worker.ts` onu R2-dən IMAGES binding-i ilə kiçildib keşləyir.
 * Qalan ünvanlar Next-in defolt loader-i ilə eyni formada `/_next/image`-ə gedir.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  const q = quality ?? DEFAULT_IMAGE_QUALITY;
  if (src.startsWith("/media/")) {
    const [path] = src.split(/[?#]/, 1);
    return `${path}?w=${width}&q=${q}`;
  }
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
