import { describe, expect, it } from "vitest";
import { activeCabinetHref, defaultOpenCabinetSections, getCabinetItems, groupCabinetItems, isCabinetItemActive } from "../cabinet-navigation";

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

describe("kabinet menyusunun bölmələri", () => {
  it("bütün bəndləri itirmədən bölmələrə ayırır və boş bölməni atır", () => {
    const items = getCabinetItems(true, true, true, true, true);
    const groups = groupCabinetItems(items);
    expect(groups.flatMap((group) => group.items).length).toBe(items.length);
    expect(groups.map((group) => group.section)).toEqual(["overview", "listings", "work", "personal", "account"]);

    const userGroups = groupCabinetItems(getCabinetItems(false));
    expect(userGroups.map((group) => group.section)).not.toContain("listings");
    expect(userGroups.find((group) => group.section === "account")?.items.map((item) => item.id)).toEqual(["notifications", "restrictions", "profile"]);
  });

  it("detal səhifəsində ən spesifik valideyn bəndini aktiv edir", () => {
    const items = getCabinetItems(true, true, true, true, true);
    expect(activeCabinetHref("/kabinet/muracietler/abc", items)).toBe("/kabinet/muracietler");
    expect(activeCabinetHref("/kabinet/elanlar/yeni", items)).toBe("/kabinet/elanlar/yeni");
    expect(activeCabinetHref("/kabinet/elanlar/abc/senedler", items)).toBe("/kabinet/elanlar");
    expect(activeCabinetHref("/kabinet/agentlik/analitika", items)).toBe("/kabinet/agentlik/analitika");
    expect(activeCabinetHref("/kabinet", items)).toBe("/kabinet");
    expect(activeCabinetHref("/kabinet/naməlum", items)).toBeNull();
  });
});

describe("kabinet menyusunun qatlanması", () => {
  it("qısa menyuda bütün bölmələr açıqdır", () => {
    const groups = groupCabinetItems(getCabinetItems(true));
    expect(defaultOpenCabinetSections(groups, "/kabinet")).toEqual(groups.map((group) => group.section));
  });

  it("agentlik sahibinin uzun menyusunda yalnız əsas və aktiv bölmələr açıq başlayır", () => {
    const items = getCabinetItems(true, true, true, true, true);
    const groups = groupCabinetItems(items);
    expect(defaultOpenCabinetSections(groups, "/kabinet")).toEqual(["overview", "account"]);
    expect(defaultOpenCabinetSections(groups, activeCabinetHref("/kabinet/muracietler/x", items))).toEqual(["overview", "work", "account"]);
  });
});
