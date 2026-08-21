import { describe, expect, it } from "vitest";
import { sanitizeRichText, stripTags } from "../html";

/**
 * Sanitizer bloq mətnini ictimai səhifədə `dangerouslySetInnerHTML` ilə göstərilməzdən
 * əvvəl təmizləyir. Bu testlər onun ən vacib vədini qoruyur: heç bir yol ilə icra
 * oluna bilən kod bazaya düşməsin.
 */

describe("sanitizeRichText", () => {
  it("icazəli formatlaşdırmanı saxlayır", async () => {
    const html = "<h2>Başlıq</h2><p>Mətn <strong>qalın</strong> və <em>maili</em>.</p>";
    expect(await sanitizeRichText(html)).toBe(html);
  });

  it("script elementini atır", async () => {
    const output = await sanitizeRichText('<p>Salam</p><script>alert("xss")</script>');
    expect(output).not.toContain("script");
    expect(output).toContain("Salam");
  });

  it("hadisə atributlarını atır", async () => {
    const output = await sanitizeRichText('<p onclick="alert(1)">Mətn</p>');
    expect(output).not.toContain("onclick");
    expect(output).toContain("Mətn");
  });

  it("javascript: linkini kəsir", async () => {
    const output = await sanitizeRichText('<a href="javascript:alert(1)">Klik</a>');
    expect(output).not.toContain("javascript:");
    expect(output).toContain("Klik");
  });

  it("data: URI-li şəkli kəsir", async () => {
    const output = await sanitizeRichText('<img src="data:text/html;base64,PHNjcmlwdD4=">');
    expect(output).not.toContain("data:");
  });

  it("iframe-i atır", async () => {
    const output = await sanitizeRichText('<iframe src="https://kenar.example"></iframe>');
    expect(output).not.toContain("iframe");
  });

  it("öz media anbarımızdan gələn şəkli saxlayır", async () => {
    const output = await sanitizeRichText('<img src="/media/bloq/2026/08/abc.webp" alt="Ev">');
    expect(output).toContain('src="/media/bloq/2026/08/abc.webp"');
    expect(output).toContain('alt="Ev"');
  });

  it("kənar linkə noopener əlavə edir", async () => {
    const output = await sanitizeRichText('<a href="https://example.com" target="_blank">Link</a>');
    expect(output).toContain('rel="noopener noreferrer"');
  });

  it("style elementini atır", async () => {
    const output = await sanitizeRichText("<style>body{display:none}</style><p>Mətn</p>");
    expect(output).not.toContain("<style");
  });
});

describe("stripTags", () => {
  it("teqləri silir və boşluqları yığır", () => {
    expect(stripTags("<p>Bir  <strong>iki</strong></p><p>üç</p>")).toBe("Bir iki üç");
  });
});
