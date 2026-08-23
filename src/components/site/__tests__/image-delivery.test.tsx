import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Logo } from "../logo";

describe("ictimai şəkil çatdırılması", () => {
  it("qlobal loqonu hər route-da LCP şəkli kimi preload etmir", () => {
    const html = renderToStaticMarkup(<Logo />);

    expect(html).not.toMatch(/fetchPriority="high"|fetchpriority="high"/);
    expect(html).not.toContain('rel="preload"');
  });
});
