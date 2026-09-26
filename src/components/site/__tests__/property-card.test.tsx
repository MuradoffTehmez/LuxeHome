import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { PropertyCardSkeleton } from "@/components/ui/states";
import type { PropertyCardData } from "@/lib/queries";
import { PropertyCard, cardSignals } from "../property-card";

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
  featuredUntil: null,
  publishedAt: new Date("2026-08-20T10:00:00Z"),
  createdAt: new Date("2026-08-20T10:00:00Z"),
  type: { name: "Mənzil", slug: "menzil" },
  city: { name: "Bakı", slug: "baki" },
  district: { name: "Səbail", slug: "sebail" },
  images: [],
  _count: { images: 0 },
  typeId: "type-1",
  cityId: "city-1",
  districtId: null,
  priceHistory: [],
} as PropertyCardData;

describe("PropertyCard", () => {
  it("etiket və əməl düymələrini şəklin üzərində, qiyməti ondan sonra verir", () => {
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
    expect(actionIndex).toBeGreaterThan(badgeIndex);
    expect(priceIndex).toBeGreaterThan(actionIndex);
    expect(titleIndex).toBeGreaterThan(priceIndex);
    expect(locationIndex).toBeGreaterThan(titleIndex);
    expect(factsIndex).toBeGreaterThan(locationIndex);
  });

  it("kart və skeleton üçün eyni responsiv media nisbətini saxlayır", () => {
    const cardHtml = renderToStaticMarkup(
      <ToastProvider>
        <PropertyCard property={property} />
      </ToastProvider>,
    );
    const skeletonHtml = renderToStaticMarkup(<PropertyCardSkeleton />);

    expect(cardHtml).toContain("aspect-4/3");
    expect(skeletonHtml).toContain("aspect-4/3");
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

describe("cardSignals", () => {
  const now = new Date("2026-09-27T12:00:00Z").getTime();
  const day = 24 * 60 * 60 * 1000;

  it("3 gündən təzə elanı «Yeni» sayır, köhnəni saymır", () => {
    expect(cardSignals({ ...property, publishedAt: new Date(now - day) }, now).isNew).toBe(true);
    expect(cardSignals({ ...property, publishedAt: new Date(now - 4 * day) }, now).isNew).toBe(false);
  });

  it("endirimi yalnız son dəyişiklik azalmadırsa və cari qiymətə bərabərdirsə göstərir", () => {
    const drop = { oldPrice: 400000, newPrice: 350000, changedAt: new Date(now - 2 * day) };
    expect(cardSignals({ ...property, priceHistory: [drop] }, now).dropPercent).toBe(13);
    // Sonradan qiymət yenə dəyişib — köhnə endirim göstərilmir.
    expect(cardSignals({ ...property, price: 360000, priceHistory: [drop] }, now).dropPercent).toBeNull();
    // Artım endirim deyil.
    expect(cardSignals({ ...property, priceHistory: [{ ...drop, oldPrice: 300000 }] }, now).dropPercent).toBeNull();
    // 30 gündən köhnə endirim.
    expect(cardSignals({ ...property, priceHistory: [{ ...drop, changedAt: new Date(now - 31 * day) }] }, now).dropPercent).toBeNull();
  });

  it("foto sayını qaytarır və 1-dən çox olanda kartda göstərir", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <PropertyCard property={{ ...property, _count: { images: 7 } }} />
      </ToastProvider>,
    );
    expect(cardSignals({ ...property, _count: { images: 7 } }, now).photoCount).toBe(7);
    expect(html).toContain(">7<");
  });
});
