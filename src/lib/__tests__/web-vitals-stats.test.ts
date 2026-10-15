import { describe, expect, it } from "vitest";
import { MAX_PLAUSIBLE_MS, percentile, vitalP75 } from "@/lib/web-vitals-stats";

describe("Core Web Vitals statistikası", () => {
  it("nearest-rank faiz dərəcəsi", () => {
    expect(percentile([], 75)).toBeNull();
    expect(percentile([5], 75)).toBe(5);
    expect(percentile([4, 1, 3, 2], 75)).toBe(3);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 75)).toBe(8);
    expect(percentile([1, 2, 3, 4], 100)).toBe(4);
  });

  it("p75 qeyri-real fon tabı ölçülərindən təsirlənmir (#173)", () => {
    const metrics = [
      ...[900, 1000, 1100, 1500, 2000, 2100].map((value) => ({ name: "LCP", value })),
      // Production-da görünən dəyər: səhifə fon tabında ~2,5 saat sonra görünüb.
      { name: "LCP", value: 9_214_056 },
      { name: "LCP", value: MAX_PLAUSIBLE_MS + 1 },
      { name: "INP", value: 40 },
    ];
    expect(vitalP75(metrics, "LCP")).toBe(2000);
    expect(vitalP75(metrics, "INP")).toBe(40);
    expect(vitalP75(metrics, "CLS")).toBeNull();
  });

  it("mənfi və ədəd olmayan dəyəri atır, nəticəni yuvarlaqlaşdırır", () => {
    expect(vitalP75([{ name: "INP", value: -1 }, { name: "INP", value: Number.NaN }, { name: "INP", value: 16.6 }], "INP")).toBe(17);
  });
});
