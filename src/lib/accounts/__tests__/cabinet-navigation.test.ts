import { describe, expect, it } from "vitest";
import { getCabinetItems, isCabinetItemActive } from "../cabinet-navigation";

describe("kabinet naviqasiyası", () => {
  it("yeni elan səhifəsində yalnız ən spesifik bəndi aktiv edir", () => {
    expect(isCabinetItemActive("/kabinet/elanlar/yeni", "/kabinet/elanlar/yeni")).toBe(true);
    expect(isCabinetItemActive("/kabinet/elanlar/yeni", "/kabinet/elanlar")).toBe(false);
  });

  it("elan icazəsi olmayan hesab üçün elan bəndlərini gizlədir", () => {
    const items = getCabinetItems(false);

    expect(items.map((item) => item.href)).toEqual([
      "/kabinet",
      "/kabinet/axtarislarim",
      "/kabinet/bildirisler",
      "/kabinet/sikayetlerim",
      "/kabinet/mehdudiyyetler",
      "/kabinet/rezervasiyalar",
      "/kabinet/tovsiyeler",
      "/kabinet/son-baxilanlar",
      "/kabinet/profil",
    ]);
    expect(items.some((item) => item.href.includes("elanlar"))).toBe(false);
  });

  it("LEADS_MANAGE səlahiyyətli agentə agentlik analitikasını göstərir (#234)", () => {
    const hrefs = (flag: boolean) => getCabinetItems(true, false, true, false, flag).map((item) => item.href);
    expect(hrefs(true)).toContain("/kabinet/agentlik/analitika");
    expect(hrefs(true)).not.toContain("/kabinet/agentlik");
    expect(hrefs(false)).not.toContain("/kabinet/agentlik/analitika");
  });
});
