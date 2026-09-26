import { describe, expect, it } from "vitest";
import { rankSuggestions, relaxFilters, widenedMaxPrice } from "@/lib/search-relaxation";

describe("axtarışın yumşaldılması", () => {
  const filters = { listingType: "SALE", rooms: 3, maxPrice: 150000, featureSlugs: ["hovuz", "lift"], page: 3 };

  it("çipə uyğun sahəni çıxarır və səhifəni 1-ə qaytarır", () => {
    expect(relaxFilters(filters, "otaq")).toEqual({ listingType: "SALE", maxPrice: 150000, featureSlugs: ["hovuz", "lift"], page: 1 });
    expect(relaxFilters(filters, "max")).not.toHaveProperty("maxPrice");
  });

  it("xüsusiyyət çipindən yalnız həmin xüsusiyyəti çıxarır", () => {
    expect(relaxFilters(filters, "xususiyyet:hovuz")?.featureSlugs).toEqual(["lift"]);
  });

  it("tanınmayan açar (sıralama) üçün null qaytarır", () => {
    expect(relaxFilters(filters, "siralama")).toBeNull();
  });

  it("maksimum qiyməti 20% qaldırıb minliyə yuvarlaqlaşdırır", () => {
    expect(widenedMaxPrice(150000)).toBe(180000);
    expect(widenedMaxPrice(99999)).toBe(120000);
  });

  it("sıfır nəticəli təklifləri atır və çoxdan aza sıralayır", () => {
    const ranked = rankSuggestions([
      { key: "a", label: "a", href: "/a", count: 0 },
      { key: "b", label: "b", href: "/b", count: 2 },
      { key: "c", label: "c", href: "/c", count: 9 },
    ]);
    expect(ranked.map((item) => item.key)).toEqual(["c", "b"]);
  });
});
