import { describe, expect, it } from "vitest";
import { detectContactInText, parseRiskFlags, riskLevel, scoreRisk } from "../risk-signals";

describe("mətndə əlaqə məlumatı (#159)", () => {
  it.each([
    "Zəng edin: 050 555 12 34",
    "Əlaqə +994 (50) 555-12-34",
    "nomre 0555551234 whatsapp",
    "Ofis: 012 444 55 66",
    "+994 70 123 45 67 Elçin",
  ])("nömrəni tapır: %s", (text) => {
    expect(detectContactInText(text)).toContain("phone");
  });

  it.each([
    "Qiymət 120 000 AZN, sahə 85 m²",
    "3 otaq, 2 hamam, 9/16 mərtəbə",
    "Kupçalı, 2015-ci il tikili, 150 000 manat",
    "Metroya 5 dəqiqə, 1 200 000 AZN",
  ])("adi ədədləri nömrə saymır: %s", (text) => {
    expect(detectContactInText(text)).not.toContain("phone");
  });

  it("e-poçt və linki tapır", () => {
    expect(detectContactInText("yazın: satici@mail.az")).toEqual(["email"]);
    expect(detectContactInText("ətraflı wa.me/994501234567")).toContain("link");
    expect(detectContactInText("instagram.com/emlak_baki")).toEqual(["link"]);
    expect(detectContactInText(null)).toEqual([]);
  });
});

describe("risk balı", () => {
  it("çəkiləri toplayır və 100-də kəsir", () => {
    expect(scoreRisk([])).toBe(0);
    expect(scoreRisk([{ code: "NEW_ACCOUNT" }])).toBe(10);
    expect(scoreRisk([{ code: "DUPLICATE_PHOTOS", value: 2 }])).toBe(50);
    expect(scoreRisk([
      { code: "DUPLICATE_PHOTOS" },
      { code: "LOW_PRICE" },
      { code: "CONTACT_IN_TEXT" },
    ])).toBe(100);
  });

  it("səviyyə hədləri", () => {
    expect(riskLevel(10)).toBe("none");
    expect(riskLevel(30)).toBe("review");
    expect(riskLevel(50)).toBe("hold");
  });

  it("saxlanan JSON-u təhlükəsiz oxuyur", () => {
    expect(parseRiskFlags('[{"code":"LOW_PRICE","value":-42},{"code":"BOGUS"},5]')).toEqual([{ code: "LOW_PRICE", value: -42 }]);
    expect(parseRiskFlags("not json")).toEqual([]);
    expect(parseRiskFlags(null)).toEqual([]);
  });
});
