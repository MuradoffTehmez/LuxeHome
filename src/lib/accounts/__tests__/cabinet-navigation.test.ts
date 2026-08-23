import { describe, expect, it } from "vitest";
import { getCabinetItems, isCabinetItemActive } from "../cabinet-navigation";

describe("kabinet naviqasiyası", () => {
  it("yeni elan səhifəsində yalnız ən spesifik bəndi aktiv edir", () => {
    expect(isCabinetItemActive("/kabinet/elanlar/yeni", "/kabinet/elanlar/yeni")).toBe(true);
    expect(isCabinetItemActive("/kabinet/elanlar/yeni", "/kabinet/elanlar")).toBe(false);
  });

  it("elan icazəsi olmayan hesab üçün elan bəndlərini gizlədir", () => {
    const items = getCabinetItems(false);

    expect(items.map((item) => item.href)).toEqual(["/kabinet", "/kabinet/profil"]);
    expect(items.some((item) => item.href.includes("elanlar"))).toBe(false);
  });
});
