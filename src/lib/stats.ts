/**
 * Serversiz statistik köməkçilər — həm server (qiymət göstəricisi, investor hesabatı),
 * həm də brauzer kalkulyatorları işlədir, ona görə Prisma və ya `next/cache` idxal etmir.
 */

/** Etibarlı median üçün minimum nümunə — 2-3 elandan çıxarılan «bazar» yanıldardı. */
export const MIN_COMPARABLES = 5;

export function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
