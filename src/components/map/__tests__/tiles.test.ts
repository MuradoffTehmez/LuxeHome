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

    const uber = new URL(links.uber);
    expect(uber.origin).toBe("https://m.uber.com");
    expect(uber.searchParams.get("pickup")).toBe("my_location");
    expect(JSON.parse(uber.searchParams.get("drop[0]") ?? "{}")).toEqual({
      latitude: 40.403518,
      longitude: 49.871268,
      addressLine1: "Xətai mənzili",
      addressLine2: "Xocalı prospekti, Bakı",
    });
  });
});
