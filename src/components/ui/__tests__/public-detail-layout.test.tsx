import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicDetailLayout } from "../public-detail-layout";

describe("PublicDetailLayout", () => {
  it("keeps the main content first and applies overflow-safe adaptive columns", () => {
    const html = renderToStaticMarkup(
      <PublicDetailLayout
        main={<p>Əsas məzmun</p>}
        aside={<p>Əlaqə paneli</p>}
      />,
    );

    expect(html.indexOf("Əsas məzmun")).toBeLessThan(html.indexOf("Əlaqə paneli"));
    expect(html).toContain("min-w-0");
    expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_380px]");
    expect(html).toContain("lg:sticky");
    expect(html).toContain("lg:top-28");
  });
});
