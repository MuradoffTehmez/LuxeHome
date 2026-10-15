/**
 * Panel üçün real istifadəçi Core Web Vitals statistikası (#173).
 *
 * Sadə ədədi orta istifadə edilmir: fon tabında açılıb saatlarla sonra görünən səhifə
 * LCP-ni milyonlarla millisaniyə yazır və bir neçə belə ölçü ortanı 110 s-yə çıxarırdı
 * (real p75 ~2 s idi). Core Web Vitals hesabatı kimi **p75** götürülür və qeyri-real
 * dəyərlər (`MAX_PLAUSIBLE_MS`-dən böyük) atılır.
 */

/** Bundan uzun ölçü səhifənin yüklənməsini deyil, fon tabını və ya yuxu rejimini əks etdirir. */
export const MAX_PLAUSIBLE_MS = 60_000;

/** Nearest-rank faiz dərəcəsi; boş siyahıda `null`. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1];
}

/** Verilmiş ölçünün p75-i (ms, yuvarlaqlaşdırılmış); ölçü yoxdursa `null`. */
export function vitalP75(metrics: { name: string; value: number }[], name: string): number | null {
  const values = metrics
    .filter((metric) => metric.name === name && Number.isFinite(metric.value) && metric.value >= 0 && metric.value <= MAX_PLAUSIBLE_MS)
    .map((metric) => metric.value);
  const value = percentile(values, 75);
  return value === null ? null : Math.round(value);
}
