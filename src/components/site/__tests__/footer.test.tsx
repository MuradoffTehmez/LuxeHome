import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { legalNavigation, siteConfig } from "@/config/site";
import { Footer } from "../footer";

describe("Footer", () => {
  it("eyni məlumat bölmələrini mobil disclosure və desktop sütun kimi təqdim edir", async () => {
    const html = renderToStaticMarkup(await Footer());

    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html.match(/Naviqasiya/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html.match(/Əmlaklar/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("lg:hidden");
    expect(html).toContain("hidden lg:block");
  });

  it("hüquqi sahiblik və bütün legal linkləri qoruyur", async () => {
    const html = renderToStaticMarkup(await Footer());

    expect(html).toContain(siteConfig.owner.name);
    for (const item of legalNavigation) {
      expect(html).toContain(`href="${item.href}"`);
      expect(html).toContain(item.label);
    }
  });
});
