import { describe, expect, it } from "vitest";
import { buildRobots } from "@/app/robots";

describe("robots siyasəti", () => {
  it("noindex direktivi görünməli utility route-ları bloklamır", () => {
    const result = buildRobots(false);
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const appRule = rules.find((rule) => rule.userAgent === "*");
    const disallow = Array.isArray(appRule?.disallow)
      ? appRule.disallow
      : appRule?.disallow
        ? [appRule.disallow]
        : [];

    expect(disallow).toContain("/admin/");
    expect(disallow).toContain("/giris");
    expect(disallow).not.toContain("/favoritler");
    expect(disallow).not.toContain("/muqayise");
    expect(disallow).not.toContain("/daxil-ol");
    expect(disallow).not.toContain("/qeydiyyat");
    expect(disallow).not.toContain("/kabinet/");
  });

  it("staging-də bütün crawl-u bağlayır və sitemap elan etmir", () => {
    const result = buildRobots(true);

    expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(result.sitemap).toBeUndefined();
  });
});
