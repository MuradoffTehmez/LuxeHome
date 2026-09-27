import { describe, expect, it } from "vitest";
import { ATTENTION_MIN_VIEWS, rate, toListingRow } from "@/lib/admin/conversion-report";

describe("konversiya hesabatı", () => {
  it("faizi bir onluq dəqiqliklə verir, məxrəc sıfırdırsa null qaytarır", () => {
    expect(rate(1, 3)).toBe(33.3);
    expect(rate(0, 10)).toBe(0);
    expect(rate(5, 0)).toBeNull();
  });

  it("çox baxılan, amma müraciətsiz elanı diqqət siyahısına salır", () => {
    const base = { id: "p1", title: "Mənzil", slug: "menzil" };
    expect(toListingRow({ ...base, viewCount: ATTENTION_MIN_VIEWS, _count: { favorites: 3, leads: 0, reservations: 0 } }))
      .toMatchObject({ needsAttention: true, leadRate: 0 });
    expect(toListingRow({ ...base, viewCount: 200, _count: { favorites: 3, leads: 4, reservations: 1 } }))
      .toMatchObject({ needsAttention: false, leadRate: 2, leads: 4, reservations: 1 });
    expect(toListingRow({ ...base, viewCount: 10, _count: { favorites: 0, leads: 0, reservations: 0 } }).needsAttention).toBe(false);
  });
});
