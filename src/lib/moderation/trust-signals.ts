import type { AccountRestrictionKind } from "@/lib/constants";

/**
 * Hesab etibarlılığı (#258, PRD 20.2) — saf modul. Davranış siqnalları çəkili cəmlə 0–100 bal verir;
 * bal yalnız moderatora tövsiyədir, tədbiri insan tətbiq edir (avtomatik bloklama yoxdur).
 */

export const TRUST_SIGNALS = [
  "DUPLICATE_BURST",
  "REJECTION_STREAK",
  "CONFIRMED_REPORTS",
  "AUTOMATION",
  "CROSS_PROFILE_CONTENT",
  "REVIEW_BURST",
] as const;
export type TrustSignal = (typeof TRUST_SIGNALS)[number];
export type TrustFlag = { code: TrustSignal; value: number };

const WEIGHTS: Record<TrustSignal, number> = {
  DUPLICATE_BURST: 25,
  REJECTION_STREAK: 25,
  CONFIRMED_REPORTS: 30,
  AUTOMATION: 30,
  CROSS_PROFILE_CONTENT: 20,
  REVIEW_BURST: 25,
};

/** Hədlər — bu dəyərlərdən aşağı siqnal yaranmır. */
export const TRUST_THRESHOLDS = {
  duplicateTitles: 3, // 24 saatda eyni başlıqlı elan
  rejections: 3, // 30 gündə rədd/dayandırılmış elan
  confirmedReports: 2, // 90 gündə təsdiqlənmiş şikayət
  automationListings: 15, // 1 saatda yeni elan
  crossProfile: 1, // başqa hesabın elanı ilə eyni təsvir
  suspiciousReviews: 2, // şübhə siqnallı rəy
} as const;

export function scoreTrust(flags: TrustFlag[]): number {
  return Math.min(100, flags.reduce((sum, flag) => sum + WEIGHTS[flag.code], 0));
}

export type TrustLevel = "none" | "watch" | "high";
export function trustLevel(score: number): TrustLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "watch";
  return "none";
}

/** Bal səviyyəsinə uyğun tövsiyə olunan ilk tədbir (moderator dəyişə bilər). */
export function suggestedRestriction(flags: TrustFlag[]): AccountRestrictionKind | null {
  const codes = new Set(flags.map((flag) => flag.code));
  const level = trustLevel(scoreTrust(flags));
  if (level === "none") return null;
  if (codes.has("AUTOMATION") || codes.has("DUPLICATE_BURST")) return "POSTING_LIMIT";
  if (codes.has("CONFIRMED_REPORTS") || codes.has("REJECTION_STREAK")) return "MODERATION_REVIEW";
  if (codes.has("CROSS_PROFILE_CONTENT")) return "EXTRA_VERIFICATION";
  return "WARNING";
}

export function parseTrustFlags(raw: string | null | undefined): TrustFlag[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value)
      ? value.filter((item): item is TrustFlag => Boolean(item) && typeof item === "object" && (TRUST_SIGNALS as readonly string[]).includes((item as TrustFlag).code) && typeof (item as TrustFlag).value === "number")
      : [];
  } catch {
    return [];
  }
}

/** Başlıqların normallaşdırılması: kiçik hərf, boşluqlar sıxılır — «eyni elan» müqayisəsi üçün. */
export function normalizeTitle(title: string): string {
  return title.toLocaleLowerCase("az").replace(/\s+/g, " ").trim();
}

/** Ən çox təkrarlanan normallaşdırılmış başlığın sayı. */
export function maxDuplicateCount(titles: string[]): number {
  const counts = new Map<string, number>();
  for (const title of titles) {
    const key = normalizeTitle(title);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}
