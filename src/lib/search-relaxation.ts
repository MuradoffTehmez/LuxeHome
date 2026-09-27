import type { PropertyFilters } from "@/lib/queries";

/**
 * Boş axtarış nəticəsi üçün «filtri yumşalt» təklifləri (#103).
 *
 * Aktiv filtr çipinin açarı (`?otaq=`, `?max=` …) `PropertyFilters` sahəsinə bağlanır;
 * həmin sahə çıxarılanda neçə elan qaldığı sayılır və ziyarətçiyə «bu filtri çıxarın —
 * 7 elan» kimi göstərilir. Bu fayl yalnız təmiz çevirmə məntiqini saxlayır — sayma
 * sorğusu çağıran tərəfdədir ki, məntiq bazasız test olunsun.
 */

type FilterField = keyof PropertyFilters;

/** Çip açarı → çıxarılacaq filtr sahələri. `seher` çıxanda ona bağlı rayon da gedir. */
const CHIP_FIELDS: Record<string, FilterField[]> = {
  elan: ["listingType"],
  axtaris: ["search"],
  tip: ["typeSlug"],
  seher: ["citySlug"],
  rayon: ["districtSlug"],
  metro: ["metroSlug"],
  otaq: ["rooms"],
  min: ["minPrice"],
  max: ["maxPrice"],
  sahe_min: ["minArea"],
  sahe_max: ["maxArea"],
  temir: ["renovation"],
  sened: ["documentStatus"],
  tikili: ["buildingType"],
  dovr: ["pricePeriod"],
  mertebe_min: ["minFloor"],
  mertebe_max: ["maxFloor"],
  ilk_mertebe_yox: ["excludeFirstFloor"],
  son_mertebe_yox: ["excludeLastFloor"],
  sekilli: ["withImagesOnly"],
  metro_yaxin: ["nearMetro"],
  sahe: ["polygon"],
};

const FEATURE_PREFIX = "xususiyyet:";

/** Boş səhifədə ən çox bu qədər sayma sorğusu işlənir. */
export const MAX_RELAXATIONS = 6;

/** Çipi çıxarılmış filtr dəsti; tanınmayan açar üçün `null` (məs. sıralama). */
export function relaxFilters(filters: PropertyFilters, chipKey: string): PropertyFilters | null {
  if (chipKey.startsWith(FEATURE_PREFIX)) {
    const slug = chipKey.slice(FEATURE_PREFIX.length);
    return { ...filters, featureSlugs: (filters.featureSlugs ?? []).filter((item) => item !== slug), page: 1 };
  }
  const fields = CHIP_FIELDS[chipKey];
  if (!fields) return null;
  const next: PropertyFilters = { ...filters, page: 1 };
  for (const field of fields) delete next[field];
  return next;
}

/** Maksimum qiyməti 20% qaldırıb yuvarlaqlaşdırır (1 000-lik). */
export function widenedMaxPrice(maxPrice: number): number {
  return Math.ceil((maxPrice * 1.2) / 1000) * 1000;
}

export type RelaxationSuggestion = { key: string; label: string; href: string; count: number };

/** Sayı sıfırdan böyük təklifləri çoxdan aza sıralayır və ilk `limit`-i saxlayır. */
export function rankSuggestions(items: RelaxationSuggestion[], limit = 4): RelaxationSuggestion[] {
  return items
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}
