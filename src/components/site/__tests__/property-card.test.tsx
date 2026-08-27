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

describe("PropertyCard — şəkil çatdırılması", () => {
  const withImage = {
    ...property,
    images: [
      {
        url: "/media/emlaklar/2026/08/master.webp",
        thumbUrl: "/media/emlaklar/2026/08/master-thumb.webp",
        alt: "Mənzilin qonaq otağı",
        width: 2400,
        height: 1600,
      },
    ],
  } as PropertyCardData;

  it("adi kartda master şəkli deyil, kiçik nüsxəni yükləyir", () => {
    // `/media/` ünvanları `next/image` optimizasiyasından yan keçir: master
    // verilsə, 12 kartlıq siyahı bir neçə meqabayt yükləyir
    const html = renderToStaticMarkup(
      <ToastProvider>
        <PropertyCard property={withImage} />
      </ToastProvider>,
    );

    expect(html).toContain("master-thumb.webp");
  });

  it("featured kartda master şəkli saxlayır — o, adətən LCP elementidir", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <PropertyCard property={withImage} variant="featured" />
      </ToastProvider>,
    );

    expect(html).toContain("master.webp");
    expect(html).not.toContain("master-thumb.webp");
  });

  it("kiçik nüsxə yoxdursa master şəklə düşür", () => {
    const withoutThumb = {
      ...withImage,
      images: [{ ...withImage.images[0], thumbUrl: null }],
    } as PropertyCardData;

    const html = renderToStaticMarkup(
      <ToastProvider>
        <PropertyCard property={withoutThumb} />
      </ToastProvider>,
    );

    expect(html).toContain("master.webp");
  });
});
