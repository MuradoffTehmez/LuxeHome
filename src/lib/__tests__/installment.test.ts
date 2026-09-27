import { describe, expect, it } from "vitest";
import { calculateInstallment } from "@/lib/mortgage";

describe("hissə-hissə ödəniş", () => {
  it("faizsiz daxili krediti bərabər aylıq hissələrə bölür", () => {
    expect(calculateInstallment({ price: 120000, downPaymentPercent: 30, months: 24, markupPercent: 0 })).toEqual({
      downPayment: 36000,
      financed: 84000,
      markup: 0,
      monthlyPayment: 3500,
      totalPayment: 120000,
    });
  });

  it("əlavə qiyməti qalan borca bir dəfə tətbiq edir", () => {
    const result = calculateInstallment({ price: 100000, downPaymentPercent: 20, months: 40, markupPercent: 10 });
    expect(result).toMatchObject({ financed: 80000, markup: 8000, monthlyPayment: 2200, totalPayment: 108000 });
  });

  it("mənasız daxiletmədə null qaytarır", () => {
    expect(calculateInstallment({ price: 0, downPaymentPercent: 30, months: 24, markupPercent: 0 })).toBeNull();
    expect(calculateInstallment({ price: 1000, downPaymentPercent: 100, months: 24, markupPercent: 0 })).toBeNull();
    expect(calculateInstallment({ price: 1000, downPaymentPercent: 30, months: 0, markupPercent: 0 })).toBeNull();
    expect(calculateInstallment({ price: 1000, downPaymentPercent: 30, months: 12, markupPercent: -1 })).toBeNull();
    expect(calculateInstallment({ price: Number.NaN, downPaymentPercent: 30, months: 12, markupPercent: 0 })).toBeNull();
  });
});
