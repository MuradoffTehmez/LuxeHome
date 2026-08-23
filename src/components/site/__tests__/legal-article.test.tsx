import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LegalArticle } from "../legal-article";

describe("LegalArticle", () => {
  it("breadcrumb, oxunaqlı mətn eni və uzun məzmun qoruması yaradır", () => {
    const html = renderToStaticMarkup(
      <LegalArticle
        title="Məxfilik siyasəti"
        description="Məlumatların qorunması qaydaları"
        updatedAt="20 avqust 2026"
        path="/mexfilik-siyaseti"
      >
        <h2 id="melumatlar">Məlumatlar</h2>
        <p>{"çox-uzun-mətn-".repeat(20)}</p>
      </LegalArticle>,
    );

    expect(html).toContain('aria-label="Naviqasiya yolu"');
    expect(html).toContain('href="/"');
    expect(html).toContain("max-w-[68ch]");
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).toContain("scroll-mt-28");
  });
});
