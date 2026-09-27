import { describe, expect, it } from "vitest";
import {
  buildActivePropertyFilters,
  buildPropertySearchHref,
  parsePropertySearchParams,
} from "../property-search";

describe("property search URL müqaviləsi", () => {
  it("çoxseçimli xüsusiyyətləri və bayraqları qoruyur, filtr dəyişəndə səhifəni sıfırlayır", () => {
    const state = parsePropertySearchParams({
      xususiyyet: ["lift", "parking"],
      sekilli: "1",
      sehife: "3",
    });
    const href = buildPropertySearchHref(state, { siralama: "price_asc" });

    expect(state.featureSlugs).toEqual(["lift", "parking"]);
    expect(href).toContain("xususiyyet=lift");
    expect(href).toContain("xususiyyet=parking");
    expect(href).toContain("sekilli=1");
    expect(href).toContain("siralama=price_asc");
    expect(href).not.toContain("sehife=3");
  });

  it("«metroya yaxın» bayrağını oxuyur, saxlayır və çipi ilə silir (#107)", () => {
    const state = parsePropertySearchParams({ metro_yaxin: "1", tip: "villa" });
    expect(state.nearMetro).toBe(true);
    expect(buildPropertySearchHref(state)).toContain("metro_yaxin=1");

    const chip = buildActivePropertyFilters(state).find((item) => item.key === "metro_yaxin");
    expect(chip?.href).not.toContain("metro_yaxin");
    expect(chip?.href).toContain("tip=villa");
    expect(parsePropertySearchParams({ metro_yaxin: "0" }).nearMetro).toBe(false);
  });

  it("yanlış sort və səhifə dəyərlərini təhlükəsiz default-a salır", () => {
    const state = parsePropertySearchParams({ siralama: "random", sehife: "-4" });

    expect(state.sort).toBe("newest");
    expect(state.page).toBe(1);
  });

  it("xüsusiyyət chip-i yalnız öz dəyərini silən href yaradır", () => {
    const state = parsePropertySearchParams({
      tip: "villa",
      xususiyyet: ["lift", "parking"],
      sehife: "2",
    });
    const chips = buildActivePropertyFilters(state, {
      types: [{ value: "villa", label: "Villa" }],
      features: [
        { value: "lift", label: "Lift" },
        { value: "parking", label: "Parkinq" },
      ],
    });

    expect(chips.map((chip) => chip.label)).toEqual(["Villa", "Lift", "Parkinq"]);
    expect(chips.find((chip) => chip.key === "xususiyyet:lift")?.href).toBe(
      "/emlaklar?tip=villa&xususiyyet=parking",
    );
  });
});
