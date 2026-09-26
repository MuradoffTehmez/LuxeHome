/**
 * Cloudflare D1 bir sorğuda **ən çox 100 bound parametr** qəbul edir.
 *
 * Prisma `IN (…)` siyahısını özü hissələrə bölür (adapter 98 bildirir), amma
 * `where`-dəki digər şərtlərin parametrlərini saymır: `entityType`, `locale`,
 * `status` ilə birlikdə 98 + 3 > 100 olur və sorğu `too many SQL variables` ilə
 * düşür (#74, #85). Bu köməkçi siyahını əlavə parametrlər üçün yer saxlayaraq
 * bölür. Həddin real tətbiqi `*.integration.test.ts`-də yoxlanır.
 */
export const D1_MAX_BOUND_PARAMS = 100;

/** Prisma-nın öz əlavə etdiyi parametrlər (məs. LIMIT/OFFSET) üçün ehtiyat. */
const SAFETY_MARGIN = 10;

/** Təkrarları atıb siyahını D1 həddinə sığan hissələrə bölür. */
export function chunkForD1<T>(values: readonly T[], reservedParams: number): T[][] {
  const size = Math.max(1, D1_MAX_BOUND_PARAMS - SAFETY_MARGIN - Math.max(0, reservedParams));
  const unique = [...new Set(values)];
  const chunks: T[][] = [];
  for (let index = 0; index < unique.length; index += size) chunks.push(unique.slice(index, index + size));
  return chunks;
}

/**
 * `IN (…)` sorğusunu hissələrlə icra edib nəticələri birləşdirir.
 *
 * `reservedParams` — `where`-dəki `IN` xaricindəki parametrlərin sayı.
 */
export async function findManyInChunks<T, R>(
  values: readonly T[],
  reservedParams: number,
  query: (chunk: T[]) => Promise<R[]>,
): Promise<R[]> {
  const results = await Promise.all(chunkForD1(values, reservedParams).map(query));
  return results.flat();
}
