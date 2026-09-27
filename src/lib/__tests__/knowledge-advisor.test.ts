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

  it("HTML-i düz mətnə çevirir, entity-ləri bir dəfə açır və uzunluğu kəsir", () => {
    expect(sourceText("<h2>Sənədlər</h2><p>Çıxarış &amp; texniki pasport</p><script>alert(1)</script>")).toBe("Sənədlər\n Çıxarış & texniki pasport");
    // «&amp;lt;» ədəbi «&lt;» mətnidir — ikiqat açılıb «<» olmamalıdır.
    expect(sourceText("<p>a &amp;lt; b</p>")).toBe("a &lt; b");
    expect(sourceText(`<p>${"a".repeat(50)}</p>`, 10)).toBe(`${"a".repeat(10)}…`);
  });

  it("istinadsız və mövcud olmayan mənbəyə istinad edən cümlələri atır", () => {
    expect(validateAdvisorAnswer({ answered: true, answer: "Çıxarışı yoxlayın [2]. Notariusa gedin [7]." }, 3)).toEqual({
      answer: "Çıxarışı yoxlayın [2].",
      cited: [2],
    });
    // Mənbəsiz hüquqi iddia bir istinadlı cümlənin yanında «keçmir».
    expect(validateAdvisorAnswer({
      answered: true,
      answer: "Dövlət rüsumu 5% təşkil edir. Alqı-satqı müqaviləsi notarial qaydada bağlanır [1]. Çıxarış tələb olunur [2].",
    }, 2)).toEqual({ answer: "Alqı-satqı müqaviləsi notarial qaydada bağlanır [1]. Çıxarış tələb olunur [2].", cited: [1, 2] });
  });

  it("çoxluğu istinadsız cavabı tamamilə rədd edir", () => {
    expect(validateAdvisorAnswer({ answered: true, answer: "Birinci iddia. İkinci iddia. Üçüncü fakt [1]." }, 2)).toBeNull();
    expect(validateAdvisorAnswer({ answered: true, answer: "Mənbəsiz iddia" }, 3)).toBeNull();
    expect(validateAdvisorAnswer({ answered: false, answer: "" }, 3)).toBeNull();
    expect(validateAdvisorAnswer({ answered: true, answer: 42 }, 3)).toBeNull();
  });

  it("siyahı addımlarını, nöqtədən sonrakı istinadı və ixtisarları düzgün bölür", () => {
    expect(validateAdvisorAnswer({
      answered: true,
      answer: "1. Çıxarışı yoxlayın. [1]\n2. Məs. ipoteka yükünü soruşun [2].\n3. Beh müqaviləsi imzalayın.",
    }, 2)).toEqual({ answer: "1. Çıxarışı yoxlayın. [1]\n2. Məs. ipoteka yükünü soruşun [2].", cited: [1, 2] });
  });

  it("təlimat mənbədən kənara çıxmağı qadağan edir və dili göstərir", () => {
    expect(advisorInstructions("en")).toContain("in English");
    expect(advisorInstructions("az")).toContain("YALNIZ verilən mənbələrdəki");
  });
});
