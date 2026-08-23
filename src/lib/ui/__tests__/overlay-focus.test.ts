import { describe, expect, it } from "vitest";
import { getFocusWrapIndex } from "../overlay-focus";

describe("overlay fokus dövrü", () => {
  it("ilk elementdən geriyə keçəndə son elementə qayıdır", () => {
    expect(
      getFocusWrapIndex({ activeIndex: 0, itemCount: 3, direction: "backward" }),
    ).toBe(2);
  });

  it("son elementdən irəli keçəndə ilk elementə qayıdır", () => {
    expect(
      getFocusWrapIndex({ activeIndex: 2, itemCount: 3, direction: "forward" }),
    ).toBe(0);
  });

  it("fokus sərhəddə deyilsə müdaxilə etmir", () => {
    expect(
      getFocusWrapIndex({ activeIndex: 1, itemCount: 3, direction: "forward" }),
    ).toBeNull();
    expect(
      getFocusWrapIndex({ activeIndex: -1, itemCount: 0, direction: "backward" }),
    ).toBeNull();
  });

  it("fokus paneldən kənardadırsa onu dövrün uyğun ucuna gətirir", () => {
    expect(
      getFocusWrapIndex({ activeIndex: -1, itemCount: 3, direction: "forward" }),
    ).toBe(0);
    expect(
      getFocusWrapIndex({ activeIndex: -1, itemCount: 3, direction: "backward" }),
    ).toBe(2);
  });
});
