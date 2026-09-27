import { describe, expect, it } from "vitest";
import { cabinetBreadcrumbTrail } from "../cabinet-navigation";
import { SHORT_LINKS } from "../short-links";
import { NEVER_CACHED_PREFIXES } from "@/lib/public-cache-policy";

describe("kabinet breadcrumb-ları", () => {
  it("yeni elan və redaktə səhifələri üçün tam zəncir qurur", () => {
    expect(cabinetBreadcrumbTrail("/kabinet/elanlar/yeni").map((item) => item.labelKey)).toEqual([
      "eyebrow",
      "listings",
      "newListing",
    ]);
    expect(cabinetBreadcrumbTrail("/kabinet/elanlar/abc123").at(-1)?.labelKey).toBe("editListing");
    expect(cabinetBreadcrumbTrail("/kabinet/profil").map((item) => item.href)).toEqual(["/kabinet", "/kabinet/profil"]);
  });

  it("kabinetdən kənarda və naməlum bölmədə boş/qısa zəncir verir", () => {
    expect(cabinetBreadcrumbTrail("/emlaklar")).toEqual([]);
    expect(cabinetBreadcrumbTrail("/kabinet")).toHaveLength(1);
  });
});

describe("qısa ünvanlar", () => {
  it("hamısı kabinetə aparır və paylaşılan keşə düşmür", () => {
    for (const [short, target] of Object.entries(SHORT_LINKS)) {
      expect(target.startsWith("/kabinet")).toBe(true);
      expect(NEVER_CACHED_PREFIXES).toContain(short);
    }
  });
});
