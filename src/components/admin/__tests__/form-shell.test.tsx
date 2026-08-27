import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormJumpNav, FormSection } from "../form-shell";

describe("uzun admin formalarının naviqasiyası", () => {
  it("bölmə linklərini toxunma ölçüsü və əlçatan nav adı ilə yaradır", () => {
    const html = renderToStaticMarkup(
      <FormJumpNav
        items={[
          { id: "esas", label: "Əsas" },
          { id: "seo", label: "SEO" },
        ]}
      />,
    );

    expect(html).toContain('aria-label="Forma bölmələri"');
    expect(html).toContain('href="#esas"');
    expect(html).toContain('href="#seo"');
    expect(html).toContain("min-h-11");
  });

  it("bölməyə anchor və sticky başlıq üçün scroll məsafəsi verir", () => {
    const html = renderToStaticMarkup(
      <FormSection id="esas" title="Əsas məlumat">
        <input name="title" />
      </FormSection>,
    );

    expect(html).toContain('id="esas"');
    expect(html).toContain("scroll-mt-32");
  });
});
