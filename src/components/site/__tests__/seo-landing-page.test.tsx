import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import type { PropertyCardData } from "@/lib/queries";
import { SEO_LANDINGS } from "@/lib/seo-landings";
import { SeoLandingPage } from "../seo-landing-page";

const property = {
  id: "property-1",
  title: "Nərimanovda 3 otaqlı mənzil",
  slug: "nerimanov-3-otaqli",
  listingType: "SALE",
  status: "PUBLISHED",
  price: 235000,
  currency: "AZN",
  pricePeriod: null,
  rooms: 3,
  area: 118,
  landArea: null,
  floor: 7,
  totalFloors: 16,
  isFeatured: false,
  publishedAt: new Date("2026-08-20T00:00:00Z"),
  createdAt: new Date("2026-08-20T00:00:00Z"),
  type: { name: "Mənzil", slug: "menziller" },
  city: { name: "Bakı", slug: "baki" },
  district: { name: "Nərimanov", slug: "nerimanov" },
  images: [],
} as PropertyCardData;

describe("SEO landing template", () => {
  it("bir H1, visible breadcrumb, nəticə, faydalı copy, FAQ və related linklər göstərir", () => {
    const landing = SEO_LANDINGS[0];
    const html = renderToStaticMarkup(
      <ToastProvider>
        <SeoLandingPage landing={landing} items={[property]} total={3} page={1} totalPages={1} />
      </ToastProvider>,
    );

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(landing.h1);
    expect(html).toContain('aria-label="Naviqasiya yolu"');
    expect(html).toContain("3 aktiv elan");
    expect(html).toContain(landing.content[0]);
    expect(html).toContain(landing.faq[0].question);
    expect(html).toContain(`href="${landing.relatedPaths[0]}"`);
    expect(html).toContain('href="/emlaklar/nerimanov-3-otaqli"');
  });

  it("elan olmadıqda boş grid əvəzinə bərpa yolu göstərir", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <SeoLandingPage
          landing={SEO_LANDINGS[0]}
          items={[]}
          total={0}
          page={1}
          totalPages={1}
        />
      </ToastProvider>,
    );

    expect(html).toContain("Bu kateqoriyada hazırda aktiv elan yoxdur");
    expect(html).toContain('href="/emlaklar"');
  });
});
