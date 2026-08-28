import { describe, expect, it } from "vitest";
import { normalizeSearchText, propertySearchText } from "@/lib/search-normalization";

describe("Azərbaycan axtarış normallaşdırması", () => {
  it.each([
    ["Bakı", "baki"],
    ["Xətai", "xetai"],
    ["Şüvəlan", "suvelan"],
    ["Gəncə şəhəri", "gence seheri"],
    ["Çıxarışlı köhnə tikili", "cixarisli kohne tikili"],
  ])("%s mətnini %s formasına salır", (source, expected) => {
    expect(normalizeSearchText(source)).toBe(expected);
  });

  it("elan sahələrini vahid indeksə birləşdirir", () => {
    expect(propertySearchText({ title: "Əla mənzil", description: "Şəhərin mərkəzi", address: "İçərişəhər" }))
      .toBe("ela menzil seherin merkezi iceriseher");
  });
});
