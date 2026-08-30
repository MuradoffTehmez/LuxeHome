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
});
