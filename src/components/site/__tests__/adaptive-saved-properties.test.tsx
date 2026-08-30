import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import type { PropertyCardData } from "@/lib/queries";
import {
  ComparePresentation,
  type CompareProperty,
} from "@/app/[locale]/(site)/muqayise/compare-table";
import {
  FavoritesPresentation,
  type FavoriteProperty,
} from "@/app/[locale]/(site)/favoritler/favorites-list";
import { getCompareBarPositionClass } from "../compare-bar";

const cardProperty = {
  id: "property-a",
  title: "Sahil mənzili",
  slug: "sahil-menzili",
  listingType: "SALE",
  status: "PUBLISHED",
  price: 250000,
  currency: "AZN",
  pricePeriod: null,
  rooms: 3,
  area: 120,
  landArea: null,
  floor: 6,
  totalFloors: 14,
  isFeatured: false,
  featuredUntil: null,
  publishedAt: new Date("2026-08-20T10:00:00Z"),
  createdAt: new Date("2026-08-20T10:00:00Z"),
  type: { name: "Mənzil", slug: "menzil" },
  city: { name: "Bakı", slug: "baki" },
  district: { name: "Səbail", slug: "sebail" },
  images: [],
} as PropertyCardData;

const compareProperty = {
  ...cardProperty,
  bedrooms: 2,
  bathrooms: 2,
  renovation: "RENOVATED",
  documentStatus: "TITLE_DEED",
  buildingType: "NEW",
  mortgageAvailable: true,
  installmentAvailable: false,
  features: [{ feature: { name: "Lift", group: "AMENITY" } }],
} as CompareProperty;

describe("adaptiv favorit və müqayisə təqdimatı", () => {
  it("müqayisəni mobil tab/kart və desktop cədvəl kimi eyni row mənbəyindən verir", () => {
    const second = {
      ...compareProperty,
      id: "property-b",
      title: "Şəhər villası",
      slug: "seher-villasi",
    } as CompareProperty;
    const html = renderToStaticMarkup(
      <ComparePresentation
        properties={[compareProperty, second]}
        sourceCount={3}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("lg:hidden");
    expect(html).toMatch(/class="[^"]*hidden[^"]*lg:block[^"]*"/);
    expect(html.match(/Qiymət/g)).toHaveLength(2);
    expect(html).toContain("Bəzi elanlar artıq mövcud deyil");
  });

  it("favorit toolbar, responsiv grid və missing-property xəbərdarlığını saxlayır", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <FavoritesPresentation
          properties={[cardProperty as FavoriteProperty]}
          savedCount={2}
          onClear={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(html).toContain("2 əmlak yadda saxlanılıb");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("xl:grid-cols-3");
    expect(html).toContain("Siyahını təmizlə");
    expect(html).toContain("Bəzi elanlar artıq mövcud deyil");
  });

  it("compare bar-ı detail sticky CTA üzərinə qaldırır, digər səhifələrdə dibdə saxlayır", () => {
    expect(getCompareBarPositionClass("/emlaklar/sahil-menzili")).toContain(
      "bottom-[calc(5rem+var(--safe-bottom))]",
    );
    expect(getCompareBarPositionClass("/emlaklar/sahil-menzili")).toContain("lg:bottom-0");
    expect(getCompareBarPositionClass("/favoritler")).toBe("bottom-0");
  });
});
