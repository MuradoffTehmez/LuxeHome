import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SeoFields } from "@/components/admin/seo-fields";

describe("SeoFields", () => {
  it("sayğac və desktop/mobile SERP preview göstərir", () => {
    const html = renderToStaticMarkup(
      <SeoFields
        initialTitle="Nərimanovda 3 otaqlı mənzil"
        initialDescription="Bakıda satışda olan mənzilin aktual məlumatları."
        fallbackTitle="Elan"
        fallbackDescription="Əmlak təsviri"
        pathname="/emlaklar/test"
      />,
    );
    expect(html).toContain("27 / 60");
    expect(html).toContain("Desktop önbaxış");
    expect(html).toContain("Mobil önbaxış");
    expect(html).toContain("luxehomeestate.az/emlaklar/test");
  });
});
