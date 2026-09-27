import { describe, expect, it } from "vitest";
import { FAIR_BAND_PERCENT, benchmarkFromSamples, classifyPrice, roundEstimate } from "@/lib/price-benchmark";
import { medianOf } from "@/lib/stats";

describe("qiymət müqayisəsi", () => {
  it("medianı tək və cüt nümunə üçün hesablayır, ifrat dəyərdən təsirlənmir", () => {
    expect(medianOf([])).toBeNull();
    expect(medianOf([3, 1, 2])).toBe(2);
    expect(medianOf([1, 2, 3, 4])).toBe(2.5);
    expect(medianOf([2000, 2100, 2200, 2300, 90000])).toBe(2200);
  });

  it("±10% aralığını bazara uyğun, kənarlarını ucuz/baha sayır", () => {
    const benchmark = { pricePerSqm: 2000, sampleSize: 12, scope: "district" as const };
    expect(classifyPrice(1700, benchmark)).toMatchObject({ band: "below", diffPercent: -15 });
    expect(classifyPrice(2000 * (1 - FAIR_BAND_PERCENT / 100), benchmark).band).toBe("below");
    expect(classifyPrice(2100, benchmark)).toMatchObject({ band: "fair", diffPercent: 5 });
    expect(classifyPrice(2400, benchmark)).toMatchObject({ band: "above", diffPercent: 20 });
    expect(classifyPrice(2400, benchmark)).toMatchObject({ sampleSize: 12, scope: "district" });
  });

  it("satışda minliyə, kirayədə onluğa yuvarlaqlaşdırır", () => {
    expect(roundEstimate(187_640, "SALE")).toBe(188_000);
    expect(roundEstimate(987.4, "RENT")).toBe(990);
  });

  it("qiymətləndirilən elanı öz müqayisəsindən çıxarır, nümunə azalanda şəhərə keçir", () => {
    const sample = (id: string, perSqm: number) => ({ id, perSqm });
    const district = [sample("self", 5000), sample("a", 2000), sample("b", 2100), sample("c", 2200), sample("d", 2300)];
    const city = [...district, sample("e", 1800), sample("f", 1900)];

    // Elanın özü daxil olsaydı rayonda 5 nümunə olardı; çıxarılandan sonra 4 qalır → şəhər.
    const assessed = benchmarkFromSamples({ district, city, profilePerSqm: null }, "self");
    expect(assessed).toMatchObject({ scope: "city", sampleSize: 6, pricePerSqm: 2050 });
    // Qiymətləndirmə alətində (elan yoxdur) hamısı sayılır.
    expect(benchmarkFromSamples({ district, city, profilePerSqm: null })).toMatchObject({ scope: "district", sampleSize: 5, pricePerSqm: 2200 });
    expect(benchmarkFromSamples({ district: [], city: [], profilePerSqm: 1900 }, "self")).toMatchObject({ scope: "profile", pricePerSqm: 1900 });
    expect(benchmarkFromSamples({ district: [], city: [], profilePerSqm: null })).toBeNull();
  });
});
