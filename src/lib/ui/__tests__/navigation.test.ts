import { describe, expect, it } from "vitest";
import { isNavigationItemActive } from "../navigation";

describe("naviqasiya aktiv route-u", () => {
  it("kök linkini yalnız ana səhifədə aktiv edir", () => {
    expect(isNavigationItemActive("/", "/")).toBe(true);
    expect(isNavigationItemActive("/emlaklar", "/")).toBe(false);
  });

  it("bölmə linkini özündə və alt route-larında aktiv edir", () => {
    expect(isNavigationItemActive("/emlaklar", "/emlaklar")).toBe(true);
    expect(isNavigationItemActive("/emlaklar/sahil-villasi", "/emlaklar")).toBe(true);
  });

  it("eyni prefiksli başqa route-u səhvən aktiv etmir", () => {
    expect(isNavigationItemActive("/blogger", "/blog")).toBe(false);
  });
});
