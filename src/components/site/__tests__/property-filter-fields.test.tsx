import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyFilterFields } from "../property-filter-fields";

const options = {
  types: [{ value: "villa", label: "Villa" }],
  cities: [
    {
      value: "baki",
      label: "Bakı",
      districts: [{ value: "sabail", label: "Səbail" }],
    },
  ],
  features: [{ value: "lift", label: "Lift", group: "AMENITY" }],
};

describe("PropertyFilterFields", () => {
  it("full rejimdə bütün URL sahələrini və ilkin seçimləri qoruyur", () => {
    const html = renderToStaticMarkup(
      <PropertyFilterFields
        {...options}
        mode="full"
        initial={{
          elan: "RENT",
          tip: "villa",
          seher: "baki",
          rayon: "sabail",
          dovr: "MONTH",
          sekilli: "1",
          xususiyyet: ["lift"],
          siralama: "price_asc",
        }}
      />,
    );

    for (const name of [
      "elan",
      "axtaris",
      "tip",
      "seher",
      "rayon",
      "otaq",
      "min",
      "max",
      "sahe_min",
      "sahe_max",
      "temir",
      "sened",
      "tikili",
      "dovr",
      "mertebe_min",
      "mertebe_max",
      "ilk_mertebe_yox",
      "son_mertebe_yox",
      "sekilli",
      "xususiyyet",
      "siralama",
    ]) {
      expect(html).toContain(`name="${name}"`);
    }
    expect(html).toMatch(
      /<input(?=[^>]*name="elan")(?=[^>]*checked="")(?=[^>]*value="RENT")[^>]*>/,
    );
    expect(html).toMatch(
      /<option(?=[^>]*value="sabail")(?=[^>]*selected="")[^>]*>/,
    );
    expect(html).toMatch(
      /<input(?=[^>]*name="xususiyyet")(?=[^>]*checked="")(?=[^>]*value="lift")[^>]*>/,
    );
  });

  it("compact rejimdə yalnız əsas discovery sahələrini göstərir", () => {
    const html = renderToStaticMarkup(
      <PropertyFilterFields {...options} mode="compact" initial={{}} />,
    );

    expect(html).toContain('name="elan"');
    expect(html).toContain('name="axtaris"');
    expect(html).toContain('name="tip"');
    expect(html).toContain('name="seher"');
    expect(html).not.toContain('name="sahe_min"');
    expect(html).not.toContain('name="xususiyyet"');
  });

  it("satış rejimində boş kirayə müddəti parametrini form-a əlavə etmir", () => {
    const html = renderToStaticMarkup(
      <PropertyFilterFields
        {...options}
        mode="full"
        initial={{ elan: "SALE" }}
      />,
    );

    expect(html).not.toContain('name="dovr"');
  });
});
