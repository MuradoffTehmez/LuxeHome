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

  it("AI axtarış botlarına açıq icazə verir, eyni qadağaları saxlayır (#289)", () => {
    const result = buildRobots(false);
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const agents = (rule: (typeof rules)[number]) => (Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]);
    const aiRule = rules.find((rule) => agents(rule).includes("GPTBot"));

    for (const bot of ["OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      expect(agents(aiRule!)).toContain(bot);
    }
    expect(aiRule?.allow).toBe("/");
    expect(aiRule?.disallow).toContain("/admin/");
    expect(aiRule?.disallow).toContain("/giris");

    const blocked = rules.find((rule) => agents(rule).includes("Bytespider"));
    expect(blocked?.disallow).toBe("/");
  });

  it("staging-də bütün crawl-u bağlayır və sitemap elan etmir", () => {
    const result = buildRobots(true);

    expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(result.sitemap).toBeUndefined();
  });
});
