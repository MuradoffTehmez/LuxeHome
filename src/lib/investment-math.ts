import { LISTING_TYPES, PRICE_PERIODS } from "@/lib/constants";
import { MIN_COMPARABLES, medianOf } from "@/lib/stats";

/**
 * İnvestor hesablamaları (#107) — saf funksiyalar. Brauzerdəki gəlirlilik kalkulyatoru
 * da bunu idxal edir, ona görə burada D1/Prisma yoxdur (yükləyici `investment.ts`-dədir).
 */

export type YieldRow = {
  districtId: string;
  name: string;
  slug: string;
  salePerSqm: number;
  rentPerSqm: number;
  grossYield: number;
  saleSamples: number;
  rentSamples: number;
  source: "listings" | "profile";
};

type Sample = { districtId: string | null; listingType: string; pricePeriod: string | null; price: number; area: number | null };

/** Saf hesablama — elan nümunələrindən rayon gəlirliyi. */
export function computeDistrictYields(
  samples: Sample[],
  districts: Map<string, { name: string; slug: string }>,
): YieldRow[] {
  const groups = new Map<string, { sale: number[]; rent: number[] }>();
  for (const sample of samples) {
    if (!sample.districtId || !sample.area || sample.area <= 0 || sample.price <= 0) continue;
    const group = groups.get(sample.districtId) ?? { sale: [], rent: [] };
    if (sample.listingType === LISTING_TYPES.SALE) group.sale.push(sample.price / sample.area);
    else if (sample.listingType === LISTING_TYPES.RENT && sample.pricePeriod === PRICE_PERIODS.MONTH) group.rent.push(sample.price / sample.area);
    groups.set(sample.districtId, group);
  }

  const rows: YieldRow[] = [];
  for (const [districtId, group] of groups) {
    const district = districts.get(districtId);
    if (!district || group.sale.length < MIN_COMPARABLES || group.rent.length < MIN_COMPARABLES) continue;
    const salePerSqm = medianOf(group.sale)!;
    const rentPerSqm = medianOf(group.rent)!;
    rows.push({
      districtId,
      ...district,
      salePerSqm,
      rentPerSqm,
      grossYield: Math.round(((rentPerSqm * 12) / salePerSqm) * 1000) / 10,
      saleSamples: group.sale.length,
      rentSamples: group.rent.length,
      source: "listings",
    });
  }
  return rows.sort((left, right) => right.grossYield - left.grossYield);
}

export type YieldInput = {
  price: number;
  monthlyRent: number;
  /** İllik xərclər (təmir, idarəetmə, vergi) — illik kirayənin faizi. */
  expensesPercent: number;
  /** İldə boş qalan ay sayı. */
  vacancyMonths: number;
};

export type YieldResult = { grossYield: number; netYield: number; netAnnualIncome: number; paybackYears: number | null };

export function calculateYield(input: YieldInput): YieldResult | null {
  const { price, monthlyRent, expensesPercent, vacancyMonths } = input;
  if (![price, monthlyRent, expensesPercent, vacancyMonths].every(Number.isFinite)) return null;
  if (price <= 0 || monthlyRent <= 0 || expensesPercent < 0 || expensesPercent >= 100 || vacancyMonths < 0 || vacancyMonths >= 12) return null;
  const grossAnnual = monthlyRent * 12;
  const netAnnualIncome = monthlyRent * (12 - vacancyMonths) * (1 - expensesPercent / 100);
  const round1 = (value: number) => Math.round(value * 10) / 10;
  return {
    grossYield: round1((grossAnnual / price) * 100),
    netYield: round1((netAnnualIncome / price) * 100),
    netAnnualIncome: Math.round(netAnnualIncome),
    paybackYears: netAnnualIncome > 0 ? round1(price / netAnnualIncome) : null,
  };
}

