import { describe, expect, it } from "vitest";
import { PROJECTS_SECTION_PATH, isHiddenPath, withoutHiddenPaths } from "@/lib/site-section-paths";

describe("gizli bölmə marşrutları (#83)", () => {
  it("bölmənin özünü və alt marşrutlarını tanıyır, oxşar prefiksi yox", () => {
    const hidden = [PROJECTS_SECTION_PATH];
    expect(isHiddenPath("/layiheler", hidden)).toBe(true);
    expect(isHiddenPath("/layiheler/sahil", hidden)).toBe(true);
    expect(isHiddenPath("/layiheler-arxiv", hidden)).toBe(false);
    expect(isHiddenPath("/emlaklar", hidden)).toBe(false);
  });

  it("siyahıdan yalnız gizli keçidləri çıxarır, gizli yoxdursa nüsxə qaytarır", () => {
    const items = [{ href: "/" }, { href: "/layiheler" }, { href: "/elaqe" }];
    expect(withoutHiddenPaths(items, ["/layiheler"]).map((item) => item.href)).toEqual(["/", "/elaqe"]);
    const copy = withoutHiddenPaths(items, []);
    expect(copy).toEqual(items);
    expect(copy).not.toBe(items);
  });
});
