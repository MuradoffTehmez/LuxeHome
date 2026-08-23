import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SortSelect } from "../sort-select";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const hrefs = {
  newest: "/emlaklar",
  price_asc: "/emlaklar?siralama=price_asc",
  price_desc: "/emlaklar?siralama=price_desc",
  area_desc: "/emlaklar?siralama=area_desc",
  featured: "/emlaklar?siralama=featured",
};

describe("SortSelect", () => {
  it("mobil toolbar üçün 44 px toxunma hədəfli kompakt təqdimat verir", () => {
    const html = renderToStaticMarkup(
      <SortSelect value="newest" hrefs={hrefs} compact />,
    );

    expect(html).toContain("min-h-11");
    expect(html).toContain("max-w-36");
    expect(html).toMatch(/<label[^>]*class="[^"]*sr-only[^"]*"/);
  });
});
