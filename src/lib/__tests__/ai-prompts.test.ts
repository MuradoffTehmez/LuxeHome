import { describe, expect, it } from "vitest";
import { AI_SYSTEM_PROMPTS } from "@/lib/ai-prompts";
import { parseSearchFallback } from "@/lib/phase3-search";

describe("AI fakt sərhədi", () => {
  it("hər modul promptunda uydurmanı qadağan edir", () => {
    for (const prompt of Object.values(AI_SYSTEM_PROMPTS)) {
      expect(prompt).toContain("Heç bir elan");
      expect(prompt).toContain("uydurma");
      expect(prompt).toContain("INPUT");
    }
  });

  it("provider olmadıqda açıq meyarları deterministik çıxarır", () => {
    expect(parseSearchFallback("200 000 AZN qədər 3 otaqlı kirayə, parkingli mənzil")).toMatchObject({
      listingType: "RENT",
      maxPrice: 200000,
      rooms: 3,
      featureSlugs: ["parking"],
    });
  });

  it("deyilməyən qiymət və otaq meyarını uydurmur", () => {
    const parsed = parseSearchFallback("Bakıda sakit mənzil axtarıram");
    expect(parsed.maxPrice).toBeUndefined();
    expect(parsed.rooms).toBeUndefined();
  });

  /**
   * Fallback həm model xətasının, həm də AI kvota limitinin düşdüyü yoldur.
   * Burada atılan istisna `parseQuery()`-dən keçib səhifə xətasına çevrilir,
   * yəni limitə düşən istifadəçi 500 görərdi.
   */
  describe("sxem hədlərini aşan sorğu", () => {
    const cases: Array<[string, string]> = [
      ["otaq sayı yuxarı həddi aşır", "50 otaq ev"],
      ["sahə yuxarı həddi aşır", "min 200000 m2 anbar"],
      ["qiymət yuxarı həddi aşır", "2000000000 azn villa"],
      ["tək söz 80 simvoldan uzundur", `${"x".repeat(120)} mənzil`],
    ];

    for (const [name, query] of cases) {
      it(`atmır: ${name}`, () => {
        expect(() => parseSearchFallback(query)).not.toThrow();
      });
    }

    it("həddi aşan dəyəri sxem diapazonuna sıxır", () => {
      expect(parseSearchFallback("50 otaq ev").rooms).toBe(20);
      expect(parseSearchFallback("min 200000 m2 anbar").minArea).toBe(100_000);
      expect(parseSearchFallback("2000000000 azn villa").maxPrice).toBe(1_000_000_000);
    });

    it("uzun sözü kəsir, meyarı atmır", () => {
      const parsed = parseSearchFallback(`${"x".repeat(120)} kirayə mənzil`);
      expect(parsed.listingType).toBe("RENT");
      for (const term of parsed.semanticTerms) expect(term.length).toBeLessThanOrEqual(80);
    });
  });
});
