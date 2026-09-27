import { describe, expect, it } from "vitest";
import { composeImageAlt, fallbackImageAlt, parseImageRoom, placeLocative } from "@/lib/image-alt";

const facts = {
  listingType: "SALE",
  typeSlug: "menziller",
  typeName: "Mənzillər",
  rooms: 3,
  place: { name: "Nərimanov", slug: "baki-nerimanov", kind: "DISTRICT" },
};

describe("şəkil ALT mətni", () => {
  it("AI-ın seçdiyi sahə ilə SEO uyğun ALT qurur", () => {
    expect(composeImageAlt(facts, "bedroom")).toBe("Nərimanov rayonunda satılan 3 otaqlı mənzilin yataq otağı");
    expect(composeImageAlt({ ...facts, listingType: "RENT", typeSlug: "villalar", rooms: null }, "pool")).toBe(
      "Nərimanov rayonunda kirayə verilən villanın hovuzu",
    );
  });

  it("AI olmadan sıra nömrəli ehtiyat ALT verir", () => {
    expect(fallbackImageAlt(facts, 1)).toBe("Nərimanov rayonunda satılan 3 otaqlı mənzil — şəkil 2");
  });

  it("model cavabından yalnız icazəli sahəni qəbul edir", () => {
    expect(parseImageRoom({ room: "Living Room" })).toBe("living_room");
    expect(parseImageRoom("kitchen")).toBe("kitchen");
    expect(parseImageRoom({ room: "spaceship" })).toBe("other");
    expect(parseImageRoom(null)).toBe("other");
  });

  it("yerin növünə görə yerlik hal şəkilçisi", () => {
    expect(placeLocative({ name: "Bakı", slug: "baki", kind: "CITY" })).toBe("Bakı şəhərində");
    expect(placeLocative({ name: "Quba", slug: "quba", kind: "CITY" })).toBe("Quba rayonunda");
    expect(placeLocative({ name: "Mərdəkan", slug: "baki-merdekan", kind: "SETTLEMENT" })).toBe("Mərdəkan qəsəbəsində");
    expect(placeLocative({ name: "Xınalıq", slug: "quba-xinaliq", kind: "VILLAGE" })).toBe("Xınalıq kəndində");
  });
});
