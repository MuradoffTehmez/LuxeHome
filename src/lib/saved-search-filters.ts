import { z } from "zod";
import type { PropertyFilters } from "@/lib/queries";

/**
 * Saxlanmış axtarışın filtr JSON-u üçün sxem.
 *
 * Əvvəl JSON yalnız `z.string().max(4000)` kimi yoxlanılırdı, sonra
 * `JSON.parse(...) as PropertyFilters` ilə tiplənib birbaşa Prisma `where`
 * qurucusuna verilirdi. Saxta POST ilə `{"citySlug": {"contains": "a"}}` kimi
 * obyekt göndərmək mümkün idi: SQL injection deyil, amma sorğu semantikası
 * dəyişir və ya sorğu çökür — çökən sorğu isə uyğunluq döngəsini dayandırırdı.
 *
 * Sxem **strip** rejimindədir: tanınmayan açarlar səssizcə atılır, çünki
 * `buildPropertyWhere` onsuz da yalnız bildiyi sahələri oxuyur və naməlum açara
 * görə istifadəçinin axtarışını rədd etmək mənasızdır.
 *
 * `sort`, `page` və `pageSize` qəsdən yoxdur — saxlanmış axtarış filtr
 * kombinasiyasını təsvir edir, konkret nəticə səhifəsini yox.
 */

const slug = z.string().trim().min(1).max(120);
const positiveInt = z.number().int().nonnegative().max(1_000_000);
const money = z.number().nonnegative().max(1_000_000_000);

export const savedSearchFiltersSchema = z
  .object({
    listingType: z.string().trim().max(40).optional(),
    typeSlug: slug.optional(),
    citySlug: slug.optional(),
    districtSlug: slug.optional(),
    metroSlug: slug.optional(),
    minPrice: money.optional(),
    maxPrice: money.optional(),
    rooms: positiveInt.optional(),
    minArea: money.optional(),
    maxArea: money.optional(),
    renovation: z.string().trim().max(40).optional(),
    documentStatus: z.string().trim().max(40).optional(),
    // Praktikada bir neçə xüsusiyyət seçilir; hədd sorğunun AND zəncirini qoruyur
    featureSlugs: z.array(slug).max(30).optional(),
    search: z.string().trim().max(200).optional(),
    buildingType: z.string().trim().max(40).optional(),
    pricePeriod: z.string().trim().max(40).optional(),
    minFloor: positiveInt.optional(),
    maxFloor: positiveInt.optional(),
    excludeFirstFloor: z.boolean().optional(),
    excludeLastFloor: z.boolean().optional(),
    withImagesOnly: z.boolean().optional(),
    mortgageOnly: z.boolean().optional(),
    installmentOnly: z.boolean().optional(),
  })
  .strip();

/**
 * JSON sətrini təhlükəsiz filtr obyektinə çevirir.
 * Sətir pozulubsa və ya sxemə uyğun gəlmirsə `null` qaytarır — çağıran
 * həmin saxlanmış axtarışı atlamalıdır, istisna atmamalıdır.
 */
export function parseSavedSearchFilters(raw: string): PropertyFilters | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const result = savedSearchFiltersSchema.safeParse(parsed);
  if (!result.success) return null;

  // Boş sahələri atırıq ki, saxlanılan JSON yığcam qalsın
  const clean = Object.fromEntries(
    Object.entries(result.data).filter(([, value]) => value !== undefined),
  );
  return clean as PropertyFilters;
}
