import { describe, expect, it } from "vitest";
import { adminNav } from "../admin-nav";

describe("adminNav", () => {
  it("bütün əsas iş axınlarını kompakt alt menyularda saxlayır", () => {
    const parentLabels = adminNav.flatMap((group) => group.items.map((item) => item.labelKey));
    expect(parentLabels).toEqual([
      "dashboard",
      "portfolio",
      "contentHub",
      "crm",
      "serp",
      "analytics",
      "aiAssistant",
      "administration",
      "profile",
    ]);
  });

  it("SERP və SEO-nun bütün alətlərini alt menyuda verir", () => {
    const serp = adminNav.flatMap((group) => group.items).find((item) => item.labelKey === "serp");
    expect(serp?.children).toHaveLength(19);
    expect(serp?.children?.map((item) => item.href)).toContain("/admin/seo");
    expect(serp?.children?.map((item) => item.href)).toContain("/admin/serp/search-console");
    expect(serp?.children?.map((item) => item.href)).toContain("/admin/redirects#not-found");
  });
});
