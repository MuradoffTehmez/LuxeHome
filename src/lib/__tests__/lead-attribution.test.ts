import { describe, expect, it } from "vitest";
import { classifyAcquisition, readLeadAttribution } from "@/lib/lead-attribution";

describe("mənbə təsnifatı", () => {
  it("UTM mənbəyi referrer-dən üstündür", () => {
    expect(classifyAcquisition({ referrer: "https://www.google.com/", utmSource: "instagram" }))
      .toEqual({ source: "instagram", medium: "campaign" });
  });

  it("referrer yoxdursa birbaşa gəliş sayılır", () => {
    expect(classifyAcquisition({})).toEqual({ source: "direct", medium: "none" });
  });

  it("oxunmayan referrer birbaşa gəlişə düşür", () => {
    expect(classifyAcquisition({ referrer: "bu URL deyil" })).toEqual({ source: "direct", medium: "none" });
  });

  it("axtarış sistemlərini ölkə domenləri ilə birlikdə tanıyır", () => {
    for (const referrer of [
      "https://www.google.com/search?q=ev",
      "https://google.az/",
      "https://www.google.com.tr/",
      "https://www.bing.com/search?q=ev",
      "https://yandex.ru/",
      "https://yandex.com.tr/",
    ]) {
      expect(classifyAcquisition({ referrer }).medium).toBe("organic");
    }
  });

  /**
   * Əvvəl `hostname.includes("bing.com")` yazılırdı — alt sətir istənilən yerdə
   * uyğun gəlirdi, ona görə kənar host özünü axtarış sistemi kimi göstərə bilirdi.
   */
  describe("oxşar adlı kənar hostlar", () => {
    const impostors = [
      "https://bing.com.reklam.example/",
      "https://notbing.com/",
      "https://google.com.reklam.example/",
      "https://mygoogle.az/",
      "https://yandex.ru.reklam.example/",
      "https://google.com.evil.example/",
    ];

    for (const referrer of impostors) {
      it(`organik saymır: ${referrer}`, () => {
        const result = classifyAcquisition({ referrer });
        expect(result.medium).toBe("referral");
        expect(["google", "bing", "yandex"]).not.toContain(result.source);
      });
    }
  });

  it("sondakı nöqtəli (mütləq) host adını da düzgün tanıyır", () => {
    expect(classifyAcquisition({ referrer: "https://www.google.com./" }))
      .toEqual({ source: "google", medium: "organic" });
  });
});

describe("lead atribusiya sahələri", () => {
  it("dəyərləri kəsir və boşları `null` edir", () => {
    const formData = new FormData();
    formData.set("utmSource", "x".repeat(400));
    formData.set("utmMedium", "   ");

    const parsed = readLeadAttribution(formData);

    expect(parsed.utmSource).toHaveLength(300);
    expect(parsed.utmMedium).toBeNull();
    expect(parsed.referrer).toBeNull();
  });
});
