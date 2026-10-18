/**
 * Oxşar elanlar (#254, PRD 18.3) — saf modul. Oxşarlıq ərazi, qiymət, otaq sayı, sahə və əmlak növü üzrə
 * ballanır (0–100). Namizədlər əvvəlcə bazada eyni elan tipi + şəhər üzrə süzülür, bal isə burada hesablanır.
 */

export type SimilarityInput = {
  typeId: string;
  cityId: string;
  districtId: string | null;
  price: number;
  area: number | null;
  rooms: number | null;
  currency: string;
};

const WEIGHTS = { district: 25, type: 25, price: 25, rooms: 15, area: 10 } as const;

/** 0..1 — iki ədədin nisbi yaxınlığı; fərq `tolerance`-dan böyükdürsə 0. */
function closeness(a: number, b: number, tolerance: number): number {
  if (a <= 0 || b <= 0) return 0;
  const diff = Math.abs(a - b) / Math.max(a, b);
  return diff >= tolerance ? 0 : 1 - diff / tolerance;
}

export function similarityScore(base: SimilarityInput, candidate: SimilarityInput): number {
  let score = 0;
  if (base.districtId && candidate.districtId === base.districtId) score += WEIGHTS.district;
  else if (candidate.cityId === base.cityId) score += WEIGHTS.district * 0.4;
  if (candidate.typeId === base.typeId) score += WEIGHTS.type;
  // Fərqli valyutada qiymət müqayisə olunmur (məzənnə burada tətbiq edilmir).
  if (candidate.currency === base.currency) score += WEIGHTS.price * closeness(base.price, candidate.price, 0.5);
  if (base.rooms != null && candidate.rooms != null) {
    const gap = Math.abs(base.rooms - candidate.rooms);
    score += WEIGHTS.rooms * (gap === 0 ? 1 : gap === 1 ? 0.5 : 0);
  }
  if (base.area && candidate.area) score += WEIGHTS.area * closeness(base.area, candidate.area, 0.5);
  return Math.round(score);
}

/** Ən oxşar `take` namizəd; bərabər balda daha təzə olan (çağıranın verdiyi sıra) qalır. */
export function rankSimilar<T extends SimilarityInput & { id: string }>(base: SimilarityInput & { id: string }, candidates: T[], take: number): T[] {
  return candidates
    .filter((candidate) => candidate.id !== base.id)
    .map((candidate, index) => ({ candidate, index, score: similarityScore(base, candidate) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, take)
    .map((row) => row.candidate);
}
