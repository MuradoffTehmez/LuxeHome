import { describe, expect, it } from "vitest";

import { getCategoryImageUrl } from "../category-images";

const categorySlugs = [
  "menziller",
  "yeni-tikili",
  "kohne-tikili",
  "heyet-evleri",
  "villalar",
  "bag-evleri",
  "torpaq",
  "obyektler",
  "ofisler",
  "qarajlar",
  "mini-otel",
  "istirahet-merkezleri",
  "konteyner-evler",
  "a-frame-evler",
  "xarici-emlak",
] as const;

describe("kateqoriya şəkilləri", () => {
  it("15 əsas kateqoriyanın hamısı üçün yeni lokal şəkil qaytarır", () => {
    const imageUrls = categorySlugs.map((slug) =>
      getCategoryImageUrl(slug, "https://example.com/old-image.jpg"),
    );

    expect(imageUrls).toHaveLength(15);
    expect(new Set(imageUrls).size).toBe(15);

    for (const imageUrl of imageUrls) {
      expect(imageUrl).toMatch(/^\/images\/categories\/[a-z0-9-]+\.webp$/);
    }
  });

  it("tanınmayan kateqoriya üçün bazadakı şəkli qoruyur", () => {
    expect(getCategoryImageUrl("custom-type", "/uploads/custom.webp")).toBe(
      "/uploads/custom.webp",
    );
  });
});
