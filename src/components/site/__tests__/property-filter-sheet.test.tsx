import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyFilterSheet } from "../property-filter-sheet";

describe("PropertyFilterSheet", () => {
  it("mobil trigger-də aktiv filtr və nəticə sayını aydın göstərir", () => {
    const html = renderToStaticMarkup(
      <PropertyFilterSheet
        types={[]}
        cities={[]}
        features={[]}
        initial={{}}
        resultCount={124}
        activeCount={3}
      />,
    );

    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("Filtrlər (3)");
    expect(html).toContain("124 nəticə");
    expect(html).toMatch(/<span class="[^"]*hidden[^"]*min-\[390px\]:inline[^"]*">124 nəticə/);
    expect(html).toContain("lg:hidden");
  });
});
