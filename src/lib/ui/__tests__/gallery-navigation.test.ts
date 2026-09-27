import { describe, expect, it } from "vitest";
import { galleryKeyAction, swipeDirection, wrapIndex } from "../gallery-navigation";

describe("qalereya naviqasiyası", () => {
  it("indeksi dövri saxlayır", () => {
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(2, 0)).toBe(0);
  });

  it("←, →, Esc, Home və End düymələrini tanıyır", () => {
    expect(galleryKeyAction("ArrowRight")).toBe("next");
    expect(galleryKeyAction("ArrowLeft")).toBe("previous");
    expect(galleryKeyAction("Escape")).toBe("close");
    expect(galleryKeyAction("Home")).toBe("first");
    expect(galleryKeyAction("End")).toBe("last");
    expect(galleryKeyAction("a")).toBeNull();
  });

  it("sola sürüşdürmə növbəti, sağa sürüşdürmə əvvəlki şəklə aparır", () => {
    expect(swipeDirection(-120, 10, 300)).toBe("next");
    expect(swipeDirection(120, 10, 300)).toBe("previous");
  });

  it("şaquli və çox qısa hərəkəti sürüşdürmə saymır, sürətli flick-i sayır", () => {
    expect(swipeDirection(-60, 140, 300)).toBeNull();
    expect(swipeDirection(-15, 0, 40)).toBeNull();
    expect(swipeDirection(-30, 0, 50)).toBe("next");
    expect(swipeDirection(-30, 0, 400)).toBeNull();
  });
});
