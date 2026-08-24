import { describe, expect, it } from "vitest";
import { PUBLIC_CACHE_TAGS, contentInvalidation } from "@/lib/cache-tags";

describe("public cache invalidation matrix", () => {
  it("əmlak dəyişikliyində home, list, sitemap və detail-i yeniləyir", () => {
    expect(contentInvalidation("property", "test-elan")).toEqual({
      tags: [PUBLIC_CACHE_TAGS.home, PUBLIC_CACHE_TAGS.properties, PUBLIC_CACHE_TAGS.sitemap],
      paths: [
        "/az", "/en", "/ru",
        "/az/emlaklar", "/en/emlaklar", "/ru/emlaklar",
        "/sitemap.xml",
        "/az/emlaklar/test-elan", "/en/emlaklar/test-elan", "/ru/emlaklar/test-elan",
      ],
    });
  });

  it("hər public content növü üçün ayrıca tag/path qaytarır, private route daxil etmir", () => {
    expect(contentInvalidation("post", "test-yazi").paths).toContain("/az/blog/test-yazi");
    expect(contentInvalidation("project", "test-layihe").tags).toContain(PUBLIC_CACHE_TAGS.projects);
    expect(contentInvalidation("service", "test-xidmet").tags).toContain(PUBLIC_CACHE_TAGS.services);
    expect(contentInvalidation("agency", "test-agentlik").paths).not.toContain("/admin");
    expect(contentInvalidation("taxonomy").paths).toEqual([
      "/az", "/en", "/ru",
      "/az/emlaklar", "/en/emlaklar", "/ru/emlaklar",
      "/sitemap.xml",
    ]);
  });
});
