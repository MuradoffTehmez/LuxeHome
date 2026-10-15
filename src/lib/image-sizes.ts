/**
 * `next/image` ölçü və keyfiyyət siyahıları — yeganə mənbə (#167).
 *
 * `next.config.ts` bunları `images` bölməsinə verir, `worker.ts` isə `/media/...?w=` sorğusunu
 * eyni siyahı ilə yoxlayır: istənilən en qəbul olunsaydı hər yeni dəyər ayrıca (ödənişli)
 * Images çevirməsi və ayrıca keş girişi yaradardı. Fayl heç nə idxal etmir — config də işlədir.
 */

export const IMAGE_DEVICE_SIZES = [360, 640, 750, 828, 1080, 1200, 1600, 1920] as const;
export const IMAGE_SIZES = [64, 96, 128, 256, 384] as const;
/**
 * Hero 65 keyfiyyətindən istifadə edir. OpenNext Cloudflare image worker-i bu ağ siyahı
 * verilməyəndə yalnız defolt 75-i qəbul edib q=65 sorğusuna 400 qaytarır.
 */
export const IMAGE_QUALITIES = [65, 75] as const;
export const DEFAULT_IMAGE_QUALITY = 75;

const ALLOWED_WIDTHS = new Set<number>([...IMAGE_DEVICE_SIZES, ...IMAGE_SIZES]);
const ALLOWED_QUALITIES = new Set<number>(IMAGE_QUALITIES);

export function isAllowedImageWidth(width: number): boolean {
  return ALLOWED_WIDTHS.has(width);
}

export function isAllowedImageQuality(quality: number): boolean {
  return ALLOWED_QUALITIES.has(quality);
}
