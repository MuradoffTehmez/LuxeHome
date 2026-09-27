import { describe, expect, it } from "vitest";
import {
  SEO_LIMITS,
  fallbackListingSeo,
  fallbackPageSeo,
  normalizeKeywords,
  sanitizeSeoCopy,
  type ListingSeoFacts,
} from "@/lib/seo-copy";

const facts: ListingSeoFacts = {
  title: "Nərimanovda 3 otaqlı təmirli mənzil",
  description: "Metroya yaxın, yeni tikilidə, tam təmirli və əşyalı mənzil.",
  listingType: "SALE",
  propertyType: "Mənzillər",
  place: "Bakı şəhəri, Nərimanov rayonu",
  placeShort: "Nərimanov",
  city: "Bakı",
  price: 185000,
  currency: "AZN",
  pricePeriod: null,
  rooms: 3,
  area: 96,
  landArea: null,
  floor: 7,
  totalFloors: 16,
  features: ["Lift", "Kombi"],
};

describe("elan SEO mətni (AI olmadan)", () => {
  it("bütün sahələri limitlər daxilində və yalnız faktlardan qurur", () => {
    const copy = fallbackListingSeo(facts);
    expect(copy.metaTitle.length).toBeLessThanOrEqual(SEO_LIMITS.metaTitle);
    expect(copy.metaDescription.length).toBeLessThanOrEqual(SEO_LIMITS.metaDescription);
    expect(copy.ogTitle.length).toBeLessThanOrEqual(SEO_LIMITS.ogTitle);
    expect(copy.socialText.length).toBeLessThanOrEqual(SEO_LIMITS.socialText);
    expect(copy.metaTitle).toContain("Nərimanov");
    expect(copy.metaDescription).toContain("96 m²");
    expect(copy.keywords.length).toBeGreaterThan(2);
    expect(copy.keywords).toContain("nərimanov mənzillər satılır");
  });

  it("kirayədə dövrü yazır, satış sözünü yazmır", () => {
    const copy = fallbackListingSeo({ ...facts, listingType: "RENT", price: 900, pricePeriod: "MONTH" });
    expect(copy.metaDescription).toContain("/ ay");
    expect(copy.metaTitle).toContain("Kirayə");
  });
});

describe("AI çıxışının təmizlənməsi", () => {
  const fallback = fallbackListingSeo(facts);

  it("link və markdown-u atır, uzun mətni kəsir, boş sahəni ehtiyatdan doldurur", () => {
    const copy = sanitizeSeoCopy(
      {
        metaTitle: "**Satılır** https://spam.example mənzil",
        metaDescription: "x".repeat(400),
        ogTitle: "",
        keywords: ["Mənzil", "mənzil", " Bakı ", 42],
        socialText: 12,
      },
      fallback,
    );
    expect(copy.metaTitle).toBe("Satılır mənzil");
    expect(copy.metaDescription.length).toBeLessThanOrEqual(SEO_LIMITS.metaDescription);
    expect(copy.ogTitle).toBe(fallback.ogTitle);
    expect(copy.keywords).toEqual(["mənzil", "bakı"]);
    expect(copy.socialText).toBe(fallback.socialText);
  });

  it("açar sözləri vergüllü sətirdən də oxuyur və 10-la məhdudlaşdırır", () => {
    expect(normalizeKeywords("a1, b2; c3")).toEqual(["a1", "b2", "c3"]);
    expect(normalizeKeywords(Array.from({ length: 20 }, (_, index) => `söz ${index}`))).toHaveLength(10);
  });

  it("səhifə üçün başlıq və mətndən SEO qurur", () => {
    const copy = fallbackPageSeo({ title: "Bakıda mənzil almaq bələdçisi", body: "Alıcı üçün addım-addım hüquqi yoxlama siyahısı." });
    expect(copy.metaTitle).toBe("Bakıda mənzil almaq bələdçisi");
    expect(copy.metaDescription).toContain("hüquqi yoxlama");
    expect(copy.keywords[0]).toBe("bakıda mənzil almaq bələdçisi");
  });
});
