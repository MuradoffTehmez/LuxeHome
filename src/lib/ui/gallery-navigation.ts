/**
 * Qalereya naviqasiyasının saf qaydaları — lightbox komponenti və testlər
 * eyni mənbədən oxuyur.
 */

/** Dövri indeks: sonuncudan sonra birinci, birincidən əvvəl sonuncu gəlir. */
export function wrapIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return ((index % total) + total) % total;
}

export type GalleryKeyAction = "next" | "previous" | "first" | "last" | "close" | null;

/** Klaviatura düyməsinin lightbox-dakı mənası. */
export function galleryKeyAction(key: string): GalleryKeyAction {
  switch (key) {
    case "ArrowRight":
      return "next";
    case "ArrowLeft":
      return "previous";
    case "Home":
      return "first";
    case "End":
      return "last";
    case "Escape":
    case "Esc":
      return "close";
    default:
      return null;
  }
}

/** Sürüşdürmənin qəbul edildiyi minimum məsafə (px). */
export const SWIPE_DISTANCE = 50;
/** Qısa, sürətli «flick» jesti üçün minimum sürət (px/ms). */
export const SWIPE_VELOCITY = 0.35;

/**
 * Toxunma jestindən istiqamət çıxarır.
 *
 * Şaquli hərəkət üstündürsə jest sürüşdürmə sayılmır — istifadəçi səhifəni
 * aşağı-yuxarı sürüşdürmək istəyir. Qısa, amma sürətli hərəkət də qəbul olunur.
 */
export function swipeDirection(
  deltaX: number,
  deltaY: number,
  durationMs: number,
): "next" | "previous" | null {
  const horizontal = Math.abs(deltaX);
  if (horizontal < Math.abs(deltaY)) return null;
  const velocity = durationMs > 0 ? horizontal / durationMs : 0;
  if (horizontal < SWIPE_DISTANCE && !(horizontal >= 20 && velocity >= SWIPE_VELOCITY)) return null;
  // Sola sürüşdürmə (mənfi dx) növbəti şəklə aparır — telefon qalereyalarındakı kimi.
  return deltaX < 0 ? "next" : "previous";
}
