import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Reveal } from "../reveal";

describe("Reveal", () => {
  it("kontenti client state olmadan CSS animasiyası üçün işarələyir", () => {
    const html = renderToStaticMarkup(
      <Reveal as="article" delay={120} className="card">
        Məzmun
      </Reveal>,
    );

    expect(html).toContain("<article");
    expect(html).toContain('data-reveal=""');
    expect(html).toContain("--reveal-delay:120ms");
    expect(html).not.toContain("data-reveal-ready");
    expect(html).not.toContain("data-revealed");
  });
});
