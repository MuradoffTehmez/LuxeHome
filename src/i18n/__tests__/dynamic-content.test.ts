import { describe, expect, it } from "vitest";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";

describe("production dynamic content localization", () => {
  it("property title, description and SEO fields no longer leak AZ content", () => {
    const property = localizeKnownContent(
      "property",
      {
        slug: "xetai-rayonunda-3-otaqli-yeni-tikili-menzil",
        title: "AZ title",
        description: "AZ description",
        metaTitle: "AZ meta",
        metaDescription: "AZ meta description",
        ogTitle: "AZ OG",
        ogDescription: "AZ OG description",
      },
      "ru",
    );

    expect(property.title).toBe("Трёхкомнатная квартира в новостройке в Хатаинском районе");
    expect(property.metaTitle).toBe(property.title);
    expect(property.metaDescription).toBe(property.description);
    expect(property.ogTitle).toBe(property.title);
    expect(property.ogDescription).toBe(property.description);
  });

  it("service metadata uses the translated title and summary", () => {
    const service = localizeKnownContent(
      "service",
      {
        slug: "alqi-satqi",
        title: "Alqı-Satqı",
        shortDescription: "AZ short",
        description: "AZ description",
        metaTitle: "AZ meta",
        metaDescription: "AZ meta description",
      },
      "en",
    );

    expect(service.title).toBe("Buying and selling");
    expect(service.metaTitle).toBe("Buying and selling");
    expect(service.metaDescription).toBe(service.shortDescription);
  });

  it("localizes city, district and metro names without AZ alphabet leakage", () => {
    expect(localizeLocation({ name: "Bakı", slug: "baki" }, "en").name).toBe("Baku");
    expect(localizeLocation({ name: "Nərimanov", slug: "baki-nerimanov" }, "ru").name).toBe("Нариманов");
    expect(localizeLocation({ name: "28 May", slug: "metro-28-may" }, "ru").name).toBe("28 Мая");
    expect(localizeLocation({ name: "Ağcabədi", slug: "agcabedi" }, "en").name).toBe("Aghjabadi");
  });

  it("covers production property types and feature values", () => {
    expect(localizeKnownContent("propertyType", { slug: "mini-otel", name: "Mini otel" }, "ru").name).toBe("Мини-отели / хостелы");
    expect(localizeKnownContent("feature", { slug: "hazir-ipoteka", name: "Hazır ipoteka" }, "en").name).toBe("Existing mortgage");
  });
});
