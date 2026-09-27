import { describe, expect, it } from "vitest";
import { calculateYield, computeDistrictYields } from "@/lib/investment-math";

const districts = new Map([["d1", { name: "Nərimanov", slug: "baki-nerimanov" }], ["d2", { name: "Xətai", slug: "baki-xetai" }]]);
const sale = (districtId: string, perSqm: number) => ({ districtId, listingType: "SALE", pricePeriod: null, price: perSqm * 100, area: 100 });
const rent = (districtId: string, perSqm: number) => ({ districtId, listingType: "RENT", pricePeriod: "MONTH", price: perSqm * 100, area: 100 });

describe("investor hesablamaları", () => {
  it("rayon gəlirliyini median m² qiymətlərindən hesablayır və yalnız kifayət qədər nümunə olanda göstərir", () => {
    const samples = [
      ...[2000, 2100, 2200, 2300, 2400].map((value) => sale("d1", value)),
      ...[10, 11, 11, 12, 13].map((value) => rent("d1", value)),
      ...[1500, 1600, 1700].map((value) => sale("d2", value)),
      ...[9, 9, 9, 9, 9].map((value) => rent("d2", value)),
      { districtId: "d1", listingType: "RENT", pricePeriod: "DAY", price: 99999, area: 50 },
    ];
    const rows = computeDistrictYields(samples, districts);
    expect(rows).toHaveLength(1);
    // (11 × 12) / 2200 = 6%
    expect(rows[0]).toMatchObject({ slug: "baki-nerimanov", grossYield: 6, saleSamples: 5, rentSamples: 5 });
  });

  it("xalis gəlirliyi xərc və boş aylarla, geri qaytarma müddətini hesablayır", () => {
    expect(calculateYield({ price: 150000, monthlyRent: 900, expensesPercent: 10, vacancyMonths: 1 })).toEqual({
      grossYield: 7.2,
      netYield: 5.9,
      netAnnualIncome: 8910,
      paybackYears: 16.8,
    });
    expect(calculateYield({ price: 0, monthlyRent: 900, expensesPercent: 10, vacancyMonths: 1 })).toBeNull();
    expect(calculateYield({ price: 1000, monthlyRent: 10, expensesPercent: 10, vacancyMonths: 12 })).toBeNull();
  });
});
