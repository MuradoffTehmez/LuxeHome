import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SearchPanel } from "../search-panel";

const props = {
  types: [{ value: "villa", label: "Villa" }],
  cities: [{ value: "baki", label: "Bakı", districts: [] }],
  features: [],
};

describe("SearchPanel", () => {
  it("page variantını yalnız desktopda göstərilən real GET form kimi render edir", () => {
    const html = renderToStaticMarkup(
      <SearchPanel {...props} variant="page" initial={{ elan: "SALE" }} />,
    );

    expect(html).toMatch(/class="[^"]*hidden[^"]*lg:block[^"]*"/);
    expect(html).toContain('action="/emlaklar"');
    expect(html).toContain('method="get"');
    expect(html).toContain('name="sahe_min"');
  });

  it("hero variantında yalnız kompakt discovery sahələrini saxlayır", () => {
    const html = renderToStaticMarkup(<SearchPanel {...props} variant="hero" />);

    expect(html).toContain('name="elan"');
    expect(html).toContain('name="axtaris"');
    expect(html).not.toContain('name="sahe_min"');
  });
});
