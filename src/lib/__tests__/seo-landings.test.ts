import { describe, expect, it } from "vitest";
import {
  MIN_INDEXABLE_LISTINGS,
  SEO_LANDINGS,
  buildTaxonomyLandingDescriptor,
  findSeoLanding,
  propertyFiltersToLandingPath,
  seoLandingIndexPolicy,
} from "@/lib/seo-landings";

const requiredPaths = [
  "/satilan-emlaklar",
  "/kiraye-emlaklar",
  "/bakida-satilan-menziller",
  "/bakida-kiraye-menziller",
  "/villalar",
  "/heyet-evleri",
  "/torpaq-saheleri",
  "/kommersiya-obyektleri",
  "/ofisler",
];

describe("SEO landing registry", () => {
  it("bütün ilkin kommersiya niyyətlərini unikal route kimi saxlayır", () => {
    expect(SEO_LANDINGS.map((landing) => landing.path)).toEqual(requiredPaths);
    expect(new Set(SEO_LANDINGS.map((landing) => landing.title)).size).toBe(SEO_LANDINGS.length);
    expect(new Set(SEO_LANDINGS.map((landing) => landing.description)).size).toBe(
      SEO_LANDINGS.length,
    );
    expect(new Set(SEO_LANDINGS.map((landing) => landing.h1)).size).toBe(SEO_LANDINGS.length);
  });

  it("hər landing üçün 250–500 söz faydalı copy, FAQ və əlaqəli route verir", () => {
    for (const landing of SEO_LANDINGS) {
      const words = landing.content.join(" ").trim().split(/\s+/).length;
      expect(words, landing.path).toBeGreaterThanOrEqual(250);
      expect(words, landing.path).toBeLessThanOrEqual(500);
      expect(landing.faq.length, landing.path).toBeGreaterThanOrEqual(2);
      expect(landing.relatedPaths.length, landing.path).toBeGreaterThanOrEqual(2);
    }
  });

  it("slug və tam ekvivalent filter mapping-i resolve edir", () => {
    expect(findSeoLanding("villalar")?.path).toBe("/villalar");
    expect(propertyFiltersToLandingPath({ listingType: "SALE" })).toBe("/satilan-emlaklar");
    expect(
      propertyFiltersToLandingPath({ listingType: "SALE", typeSlug: "menziller" }),
    ).toBe("/bakida-satilan-menziller");
    expect(propertyFiltersToLandingPath({ listingType: "SALE", rooms: 3 })).toBeNull();
  });

  it("nazik landing üçün minimum üç real elan tələb edir", () => {
    expect(MIN_INDEXABLE_LISTINGS).toBe(3);
  });

  it("az inventarlı landing-i 404 etmədən noindex saxlayır", () => {
    expect(seoLandingIndexPolicy(0)).toBe("noindex-follow");
    expect(seoLandingIndexPolicy(2)).toBe("noindex-follow");
    expect(seoLandingIndexPolicy(3)).toBe("index");
  });
});

describe("taxonomy landing descriptor", () => {
  it("rayon üçün unikal metadata, doğru filtr və kifayət qədər faydalı mətn qurur", () => {
    const landing = buildTaxonomyLandingDescriptor("DISTRICT", {
      name: "Nərimanov",
      slug: "nerimanov",
      parent: { name: "Bakı" },
    });

    expect(landing.path).toBe("/rayon/nerimanov");
    expect(landing.filters).toEqual({ districtSlug: "nerimanov" });
    expect(landing.h1).toContain("Nərimanov");
    expect(landing.description).not.toEqual(landing.title);
    expect(landing.faq.length).toBeGreaterThanOrEqual(2);
    const words = landing.content.join(" ").trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(250);
    expect(words).toBeLessThanOrEqual(500);
  });

  it("metro üçün metro filtrindən istifadə edir", () => {
    expect(
      buildTaxonomyLandingDescriptor("METRO", {
        name: "Gənclik",
        slug: "genclik",
        parent: null,
      }).filters,
    ).toEqual({ metroSlug: "genclik" });
  });
});
