import { describe, expect, it } from "vitest";
import { advisorInstructions, advisorTokens, scoreDocument, sourceText, validateAdvisorAnswer } from "@/lib/knowledge-advisor";

describe("Bilik Mərkəzi məsləhətçisi", () => {
  it("sualı diakritiksiz açar sözlərə bölür, boş sözləri atır", () => {
    expect(advisorTokens("Mənzil alarkən hansı sənədləri yoxlamalıyam və nə etməliyəm?")).toEqual([
      "menzil", "alarken", "senedleri", "yoxlamaliyam", "etmeliyem",
    ]);
    expect(advisorTokens("və ki bu")).toEqual([]);
  });

  it("iltisaqi şəkilçilərə baxmayaraq kök üzrə uyğunlaşdırır, başlığı üstün tutur", () => {
    const tokens = advisorTokens("ipotekanı necə almaq olar");
    const inTitle = scoreDocument(tokens, { title: "İpoteka krediti: addım-addım", body: "Bank şərtləri" });
    const inBody = scoreDocument(tokens, { title: "Bank şərtləri", body: "İpotekaya müraciət" });
    expect(inTitle).toBeGreaterThan(inBody);
    expect(inBody).toBeGreaterThan(0);
    expect(scoreDocument(tokens, { title: "Kirayə müqaviləsi", body: "Depozit" })).toBe(0);
  });

  it("HTML-i düz mətnə çevirir və uzunluğu kəsir", () => {
    expect(sourceText("<h2>Sənədlər</h2><p>Çıxarış &amp; texniki pasport</p><script>alert(1)</script>")).toBe("Sənədlər\n Çıxarış & texniki pasport");
    expect(sourceText(`<p>${"a".repeat(50)}</p>`, 10)).toBe(`${"a".repeat(10)}…`);
  });

  it("yalnız mövcud mənbəyə istinad edən cavabı qəbul edir", () => {
    expect(validateAdvisorAnswer({ answered: true, answer: "Çıxarışı yoxlayın [2]. Notariusa gedin [7]." }, 3)).toEqual({
      answer: "Çıxarışı yoxlayın [2]. Notariusa gedin.",
      cited: [2],
    });
    // İstinadsız və ya «cavab yoxdur» nəticəsi göstərilmir.
    expect(validateAdvisorAnswer({ answered: true, answer: "Mənbəsiz iddia" }, 3)).toBeNull();
    expect(validateAdvisorAnswer({ answered: false, answer: "" }, 3)).toBeNull();
    expect(validateAdvisorAnswer({ answered: true, answer: 42 }, 3)).toBeNull();
  });

  it("təlimat mənbədən kənara çıxmağı qadağan edir və dili göstərir", () => {
    expect(advisorInstructions("en")).toContain("in English");
    expect(advisorInstructions("az")).toContain("YALNIZ verilən mənbələrdəki");
  });
});
