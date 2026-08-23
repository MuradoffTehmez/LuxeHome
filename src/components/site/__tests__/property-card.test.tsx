import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { PropertyCardSkeleton } from "@/components/ui/states";
import type { PropertyCardData } from "@/lib/queries";
import { PropertyCard } from "../property-card";

const property = {
  id: "property-1",
  title: "Dəniz mənzərəli mənzil",
  slug: "deniz-menzileli-menzil",
  listingType: "SALE",
  status: "PUBLISHED",
  price: 350000,
  currency: "AZN",
  pricePeriod: null,
  rooms: 3,
  area: 145,
  landArea: null,
  floor: 8,
  totalFloors: 16,
  isFeatured: false,
  publishedAt: new Date("2026-08-20T10:00:00Z"),
  createdAt: new Date("2026-08-20T10:00:00Z"),
  type: { name: "Mənzil", slug: "menzil" },
  city: { name: "Bakı", slug: "baki" },
  district: { name: "Səbail", slug: "sebail" },
  images: [],
} as PropertyCardData;

describe("PropertyCard", () => {
  it("mobil məlumat iyerarxiyasında əməl düymələrini xüsusiyyətlərdən sonra saxlayır", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <PropertyCard property={property} />
      </ToastProvider>,
    );

    const mediaIndex = html.indexOf("Əmlak fotosu mövcud deyil");
    const badgeIndex = html.indexOf("Satılır");
    const priceIndex = html.indexOf("350.000");
    const titleIndex = html.indexOf("Dəniz mənzərəli mənzil");
    const locationIndex = html.indexOf("Səbail, Bakı");
    const factsIndex = html.indexOf("3 otaq");
    const actionIndex = html.indexOf("Favoritlərə əlavə et");

    expect(mediaIndex).toBeGreaterThanOrEqual(0);
    expect(badgeIndex).toBeGreaterThan(mediaIndex);
    expect(priceIndex).toBeGreaterThan(badgeIndex);
    expect(titleIndex).toBeGreaterThan(priceIndex);
    expect(locationIndex).toBeGreaterThan(titleIndex);
    expect(factsIndex).toBeGreaterThan(locationIndex);
    expect(actionIndex).toBeGreaterThan(factsIndex);
  });

  it("kart və skeleton üçün eyni responsiv media nisbətini saxlayır", () => {
    const cardHtml = renderToStaticMarkup(
      <ToastProvider>
        <PropertyCard property={property} />
      </ToastProvider>,
    );
    const skeletonHtml = renderToStaticMarkup(<PropertyCardSkeleton />);

    expect(cardHtml).toContain("aspect-4/3 sm:aspect-[16/11]");
    expect(skeletonHtml).toContain("aspect-4/3");
    expect(skeletonHtml).toContain("sm:aspect-[16/11]");
  });
});
