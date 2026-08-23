import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

import { Navbar } from "../navbar";

describe("Navbar", () => {
  it("desktop əsas sətrini yığcam naviqasiya və əsas əməl ilə məhdudlaşdırır", () => {
    const html = renderToStaticMarkup(<Navbar />);

    expect(html).toContain("Komplekslər");
    expect(html).not.toContain("Yaşayış kompleksləri");
    expect(html).not.toContain("+994 51 922 85 85");
    expect(html).toContain("Elan ver");
    expect(html).not.toContain("Əmlak əlavə et");
  });
});
