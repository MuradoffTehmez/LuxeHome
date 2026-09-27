import { describe, expect, it } from "vitest";
import { PLACES } from "../../../prisma/locations-data";
import { slugify } from "@/lib/utils";
import { REGIONS, regionForCitySlug } from "@/lib/regions";
import {
  addressParts,
  composeStreetAddress,
  formatFullAddress,
  placeLabel,
  shortLocation,
} from "@/lib/location-path";

describe("region xəritəsi", () => {
  it("rəsmi təsnifatdakı 75 şəhər və rayonun hər biri tam bir regiona aiddir", () => {
    const slugs = PLACES.map((place) => slugify(place.name));
    expect(slugs).toHaveLength(75);
    for (const slug of slugs) {
      expect(regionForCitySlug(slug), slug).not.toBeNull();
    }
    const assigned = REGIONS.flatMap((region) => region.citySlugs);
    expect(new Set(assigned).size).toBe(assigned.length);
    expect(assigned.every((slug) => slugs.includes(slug))).toBe(true);
  });

  it("Naxçıvan muxtar respublika kimi göstərilir", () => {
    expect(regionForCitySlug("serur")?.key).toBe("naxcivan");
    expect(regionForCitySlug("naxcivan")?.autonomous).toBe(true);
  });
});

describe("tam ünvan", () => {
  const naxcivan = { name: "Naxçıvan", slug: "naxcivan", kind: "CITY" };

  it("«Əliabad» əvəzinə region, şəhər və qəsəbəni birlikdə yazır", () => {
    expect(
      formatFullAddress(
        {
          city: naxcivan,
          district: { name: "Əliabad", slug: "naxcivan-eliabad", kind: "SETTLEMENT" },
          street: "Heydər Əliyev prospekti",
          building: "12",
        },
        "az",
      ),
    ).toBe(
      "Naxçıvan Muxtar Respublikası, Naxçıvan şəhəri, Əliabad qəsəbəsi, Heydər Əliyev prospekti, 12",
    );
  });

  it("Bakıda regionu təkrarlamır, qəsəbənin rayonunu və massivi göstərir", () => {
    const parts = addressParts(
      {
        city: { name: "Bakı", slug: "baki", kind: "CITY" },
        district: {
          name: "Böyükşor",
          slug: "baki-boyuksor",
          kind: "NEIGHBORHOOD",
          parent: { name: "Nərimanov", slug: "baki-nerimanov", kind: "DISTRICT" },
        },
        neighborhoodName: "Böyükşor",
      },
      "az",
    );
    expect(parts).toEqual(["Bakı şəhəri", "Nərimanov rayonu", "Böyükşor"]);
  });

  it("rayon, rayon tabeli şəhər və kəndi düzgün adlandırır", () => {
    expect(placeLabel({ name: "Quba", slug: "quba", kind: "CITY" }, "az")).toBe("Quba rayonu");
    expect(placeLabel({ name: "Xırdalan", slug: "abseron-xirdalan", kind: "SETTLEMENT" }, "az")).toBe("Xırdalan şəhəri");
    expect(placeLabel({ name: "Xınalıq", slug: "quba-xinaliq", kind: "VILLAGE" }, "ru")).toBe("с. Xınalıq");
  });

  it("köhnə elanın sərbəst ünvanını yeni sahələr boş olanda saxlayır", () => {
    expect(
      formatFullAddress({ city: { name: "Quba", slug: "quba", kind: "CITY" }, address: "Mərkəz küç. 3" }, "en"),
    ).toBe("Guba-Khachmaz economic region, Quba District, Mərkəz küç. 3");
  });

  it("kart üçün qısa yer və küçə sətri", () => {
    expect(
      shortLocation({ city: naxcivan, district: { name: "Əliabad", slug: "naxcivan-eliabad", kind: "SETTLEMENT" } }, "az"),
    ).toBe("Əliabad qəsəbəsi, Naxçıvan");
    expect(composeStreetAddress({ street: " Nizami küç. ", building: "" })).toBe("Nizami küç.");
    expect(composeStreetAddress({ street: null, building: null })).toBeNull();
  });
});
