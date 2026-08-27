import { describe, expect, it } from "vitest";
import { date, list, uniqueList } from "@/lib/admin/form";

describe("admin form siyahıları", () => {
  it("adi siyahıda brauzerdən gələn sıralamanı və təkrarları saxlayır", () => {
    const data = new FormData();
    data.append("ids", "property-1");
    data.append("ids", " property-1 ");
    data.append("ids", "property-2");

    expect(list(data, "ids")).toEqual(["property-1", "property-1", "property-2"]);
  });

  it("kütləvi əməliyyat üçün təkrar ID-ləri bir dəfə qaytarır", () => {
    const data = new FormData();
    data.append("ids", "property-1");
    data.append("ids", "property-1");
    data.append("ids", "property-2");

    expect(uniqueList(data, "ids")).toEqual(["property-1", "property-2"]);
  });

  it("boş tarix sahəsini bugünkü tarixə çevirmir", () => {
    const data = new FormData();
    data.set("officialSince", "");

    expect(date(data, "officialSince")).toBeNull();
  });
});
