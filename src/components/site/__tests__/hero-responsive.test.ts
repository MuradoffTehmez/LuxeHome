import { describe, expect, it } from "vitest";
import { heroTitleClassName } from "../hero";

describe("Hero responsive typography", () => {
  it("AZ, RU və EN üçün mobil, tablet və desktop şkalalarını ayrıca saxlayır", () => {
    const classes = (["az", "ru", "en"] as const).map(heroTitleClassName);

    for (const className of classes) {
      expect(className).toContain("text-[clamp(2.35rem,11vw,3.4rem)]");
      expect(className).toContain("sm:text-[clamp(3rem,7vw,4.5rem)]");
      expect(className).toContain("lg:text-[clamp(3.8rem,5.4vw,5.5rem)]");
      expect(className).toContain("text-balance");
      expect(className).toContain("[overflow-wrap:normal]");
      expect(className).toContain("[word-break:normal]");
      expect(className).not.toContain("overflow-wrap:anywhere");
    }
  });

  it("rus başlığını fontu kiçiltmədən təxminən üç sətrə uyğun enlə balanslaşdırır", () => {
    expect(heroTitleClassName("ru")).toContain("max-w-[20ch]");
    expect(heroTitleClassName("az")).toContain("max-w-[18ch]");
    expect(heroTitleClassName("en")).toContain("max-w-[18ch]");
  });
});
