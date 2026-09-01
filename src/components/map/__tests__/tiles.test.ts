import { describe, expect, it } from "vitest";

import { directionsLinks } from "@/components/map/tiles";

describe("directionsLinks", () => {
  it("xəritə və taksi tətbiqlərinə təhlükəsiz təyinat keçidləri qurur", () => {
    const links = directionsLinks(40.403518, 49.871268, {
      title: "Xətai mənzili",
      address: "Xocalı prospekti, Bakı",
      locale: "az",
    });

    expect(links.google).toContain("destination=40.403518,49.871268");
    expect(links.waze).toContain("ll=40.403518,49.871268");
    expect(links.bolt).toBe("https://bolt.eu/az-az/cities/baku/");

    // `/ul/` Uber-in universal link yoludur — mobil brauzerdə tətbiqi açır.
    // `/looking` isə həmişə web görünüşündə qalırdı.
    const uber = new URL(links.uber);
    expect(uber.origin).toBe("https://m.uber.com");
    expect(uber.pathname).toBe("/ul/");
    expect(uber.searchParams.get("action")).toBe("setPickup");
    expect(uber.searchParams.get("pickup")).toBe("my_location");
    expect(uber.searchParams.get("dropoff[latitude]")).toBe("40.403518");
    expect(uber.searchParams.get("dropoff[longitude]")).toBe("49.871268");
    expect(uber.searchParams.get("dropoff[nickname]")).toBe("Xətai mənzili");
    expect(uber.searchParams.get("dropoff[formatted_address]")).toBe("Xocalı prospekti, Bakı");
  });

  it("tile proxy-si və ehtiyat mənbə ayrı-ayrı ünvanlardır", async () => {
    const { MAP_TILES, FALLBACK_TILES } = await import("@/components/map/tiles");

    // Proxy öz mənşəyimizdədir — açar brauzerə çıxmır.
    expect(MAP_TILES.light.startsWith("/api/map-tiles/")).toBe(true);
    expect(MAP_TILES.dark.startsWith("/api/map-tiles/")).toBe(true);
    // Ehtiyat mənbə açarsızdır və proxy cavab verməyəndə işə düşür.
    expect(FALLBACK_TILES).toContain("tile.openstreetmap.org");
  });
});
