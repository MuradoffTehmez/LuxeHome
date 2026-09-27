import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache-tags";
import { LISTING_TYPES } from "@/lib/constants";
import { publicPropertyWhere } from "@/lib/queries";

/**
 * «Qiymət bazara uyğundur?» göstəricisi (#105).
 *
 * Elanın m² qiyməti eyni rayonda (çatmasa eyni şəhərdə) eyni növ, elan tipi, valyuta və
 * kirayə dövründəki oxşar elanların m² **medianı** ilə müqayisə olunur. Median seçilib,
 * çünki bir neçə ifrat elan (villa, səhv daxil edilmiş qiymət) ortalamanı çox sürüşdürür.
 *
 * Nümunə azdırsa göstərici **heç göstərilmir** — 2-3 elandan çıxarılan «bazar qiyməti»
 * alıcını yanıldardı. Satış elanı üçün son ehtiyat mənbə paneldə daxil edilmiş rayon
 * profilidir (`NeighborhoodProfile.averagePricePerSqm`).
 */

export const MIN_COMPARABLES = 5;
/** ±bu faiz aralığı «bazara uyğun» sayılır. */
export const FAIR_BAND_PERCENT = 10;
const MAX_SAMPLE = 400;

export type PriceBand = "below" | "fair" | "above";

export type PriceBenchmark = {
  pricePerSqm: number;
  sampleSize: number;
  scope: "district" | "city" | "profile";
};

export type PriceAssessment = PriceBenchmark & { band: PriceBand; diffPercent: number };

export function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function classifyPrice(pricePerSqm: number, benchmark: PriceBenchmark): PriceAssessment {
  const diffPercent = Math.round(((pricePerSqm - benchmark.pricePerSqm) / benchmark.pricePerSqm) * 100);
  const band: PriceBand =
    diffPercent <= -FAIR_BAND_PERCENT ? "below" : diffPercent >= FAIR_BAND_PERCENT ? "above" : "fair";
  return { ...benchmark, band, diffPercent };
}

export type BenchmarkKey = {
  listingType: string;
  typeId: string;
  cityId: string;
  districtId: string | null;
  currency: string;
  pricePeriod: string | null;
};

type Sample = { id: string; perSqm: number };
type BenchmarkSamples = { district: Sample[]; city: Sample[]; profilePerSqm: number | null };

async function comparableSamples(key: BenchmarkKey, scope: "district" | "city"): Promise<Sample[]> {
  const rows = await prisma.property.findMany({
    where: {
      ...(await publicPropertyWhere()),
      listingType: key.listingType,
      typeId: key.typeId,
      currency: key.currency,
      pricePeriod: key.listingType === LISTING_TYPES.RENT ? key.pricePeriod : null,
      area: { gt: 0 },
      price: { gt: 0 },
      ...(scope === "district" ? { districtId: key.districtId } : { cityId: key.cityId }),
    },
    select: { id: true, price: true, area: true },
    orderBy: { publishedAt: "desc" },
    take: MAX_SAMPLE,
  });
  return rows.map((row) => ({ id: row.id, perSqm: row.price / (row.area as number) }));
}

async function loadSamples(key: BenchmarkKey): Promise<BenchmarkSamples> {
  const [district, city, profile] = await Promise.all([
    key.districtId ? comparableSamples(key, "district") : Promise.resolve([]),
    comparableSamples(key, "city"),
    key.listingType === LISTING_TYPES.SALE && key.currency === "AZN" && key.districtId
      ? prisma.neighborhoodProfile.findUnique({ where: { locationId: key.districtId }, select: { averagePricePerSqm: true } })
      : Promise.resolve(null),
  ]);
  const profilePerSqm = profile?.averagePricePerSqm && profile.averagePricePerSqm > 0 ? profile.averagePricePerSqm : null;
  return { district, city, profilePerSqm };
}

/**
 * Nümunələrdən müqayisə bazası. Qiymətləndirilən elan **öz** müqayisəsinə daxil edilmir —
 * əks halda kiçik nümunədə median elanın öz qiymətinə çəkilir və nəticə «bazara uyğun»a
 * sürüşür. Çıxarıldıqdan sonra nümunə hədd altına düşərsə növbəti səviyyəyə keçilir.
 */
export function benchmarkFromSamples(samples: BenchmarkSamples, excludeId?: string): PriceBenchmark | null {
  const usable = (list: Sample[]) => list.filter((sample) => sample.id !== excludeId).map((sample) => sample.perSqm);
  const district = usable(samples.district);
  if (district.length >= MIN_COMPARABLES) {
    return { pricePerSqm: medianOf(district)!, sampleSize: district.length, scope: "district" };
  }
  const city = usable(samples.city);
  if (city.length >= MIN_COMPARABLES) {
    return { pricePerSqm: medianOf(city)!, sampleSize: city.length, scope: "city" };
  }
  return samples.profilePerSqm ? { pricePerSqm: samples.profilePerSqm, sampleSize: 0, scope: "profile" } : null;
}

/** Nümunələr açar üzrə keşlənir — siyahı səhifəsində eyni rayon/növ üçün sorğu təkrarlanmır. */
const getCachedSamples = unstable_cache(
  async (key: BenchmarkKey) => loadSamples(key),
  ["price-benchmark-samples-v1"],
  { tags: [PUBLIC_CACHE_TAGS.properties], revalidate: 3600 },
);

type AssessableProperty = BenchmarkKey & { id?: string; price: number; area: number | null };

export async function assessPropertyPrice(property: AssessableProperty): Promise<PriceAssessment | null> {
  if (!property.area || property.area <= 0 || property.price <= 0) return null;
  const samples = await getCachedSamples({
    listingType: property.listingType,
    typeId: property.typeId,
    cityId: property.cityId,
    districtId: property.districtId,
    currency: property.currency,
    pricePeriod: property.pricePeriod,
  });
  const benchmark = benchmarkFromSamples(samples, property.id);
  return benchmark ? classifyPrice(property.price / property.area, benchmark) : null;
}

/** Siyahı kartları üçün: yalnız bant (id → band). Göstərici olmayan elan xəritəyə düşmür. */
export async function assessPriceBands(
  properties: (AssessableProperty & { id: string })[],
): Promise<Record<string, PriceBand>> {
  const entries = await Promise.all(
    properties.map(async (property) => {
      const assessment = await assessPropertyPrice(property);
      return assessment ? ([property.id, assessment.band] as const) : null;
    }),
  );
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, PriceBand] => entry !== null));
}

export type ValueEstimate = {
  low: number;
  mid: number;
  high: number;
  pricePerSqm: number;
  sampleSize: number;
  scope: PriceBenchmark["scope"];
};

/** Qiymət aralığının yarısı — müqayisə medianı dəqiq qiymət deyil, istiqamətdir. */
export const ESTIMATE_SPREAD = 0.1;

/** Satışda minliyə, kirayədə onluğa yuvarlaqlaşdırır. */
export function roundEstimate(value: number, listingType: string): number {
  const step = listingType === LISTING_TYPES.SALE ? 1000 : 10;
  return Math.round(value / step) * step;
}

/** «Evimi qiymətləndir» (#105): sahə × müqayisə medianı, ±10% aralıq. */
export async function estimateValue(key: BenchmarkKey & { area: number }): Promise<ValueEstimate | null> {
  if (!(key.area > 0)) return null;
  const { area, ...benchmarkKey } = key;
  const benchmark = benchmarkFromSamples(await getCachedSamples(benchmarkKey));
  if (!benchmark) return null;
  const mid = benchmark.pricePerSqm * area;
  return {
    low: roundEstimate(mid * (1 - ESTIMATE_SPREAD), key.listingType),
    mid: roundEstimate(mid, key.listingType),
    high: roundEstimate(mid * (1 + ESTIMATE_SPREAD), key.listingType),
    pricePerSqm: benchmark.pricePerSqm,
    sampleSize: benchmark.sampleSize,
    scope: benchmark.scope,
  };
}
