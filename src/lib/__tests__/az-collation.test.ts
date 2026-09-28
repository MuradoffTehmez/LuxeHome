import { describe, expect, it } from "vitest";
import { compareAzerbaijani } from "@/lib/az-collation";

describe("Azərbaycan əlifbası ilə sıralama", () => {
  it("Ç, Ə, Ğ, İ, Ş hərflərini əlifbadakı yerinə qoyur", () => {
    const names = ["Şabran", "Cek", "Çartəpə", "Əlik", "Ağbil", "Astara", "Ismayıl", "İmişli", "Zizik", "Ürgüt"];
    expect([...names].sort(compareAzerbaijani)).toEqual([
      // «ğ» əlifbada «s»-dən əvvəldir, «ı» isə «i»-dən.
      "Ağbil", "Astara", "Cek", "Çartəpə", "Əlik", "Ismayıl", "İmişli", "Şabran", "Ürgüt", "Zizik",
    ]);
  });

  it("rəqəmləri təbii sıra ilə, hərflərdən əvvəl müqayisə edir", () => {
    const names = ["10-cu mikrorayon", "2-ci mikrorayon", "Abbas", "1-ci mikrorayon", "ASAN Xidmət №10", "ASAN Xidmət №2"];
    expect([...names].sort(compareAzerbaijani)).toEqual([
      "1-ci mikrorayon", "2-ci mikrorayon", "10-cu mikrorayon", "Abbas", "ASAN Xidmət №2", "ASAN Xidmət №10",
    ]);
  });
});
