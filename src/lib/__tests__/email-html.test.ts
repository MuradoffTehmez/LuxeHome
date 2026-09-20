import { describe, expect, it } from "vitest";
import { emailHref, escapeHtml, escapeOptional, telHref } from "../email-html";

describe("escapeHtml", () => {
  it("markup simvollarını kodlayır", () => {
    expect(escapeHtml('<a href="x">klik</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;klik&lt;/a&gt;",
    );
  });

  it("ampersandı ilk növbədə kodlayır — ikiqat kodlama yaranmır", () => {
    expect(escapeHtml("Ev & Bağ <b>")).toBe("Ev &amp; Bağ &lt;b&gt;");
  });

  it("tək dırnağı da kodlayır", () => {
    expect(escapeHtml("' onload='alert(1)")).toBe("&#39; onload=&#39;alert(1)");
  });

  it("azərbaycan hərflərinə toxunmur", () => {
    expect(escapeHtml("Şəhərdə əlverişli mənzil")).toBe("Şəhərdə əlverişli mənzil");
  });

  it("uzaq şəkil daxil etməyə imkan vermir", () => {
    const injected = escapeHtml('<img src="https://izle.example/piksel.png">');
    expect(injected).not.toContain("<img");
  });
});

describe("escapeOptional", () => {
  it("boş dəyərləri boş sətrə çevirir", () => {
    expect(escapeOptional(null)).toBe("");
    expect(escapeOptional(undefined)).toBe("");
    expect(escapeOptional("")).toBe("");
  });

  it("dolu dəyəri kodlayır", () => {
    expect(escapeOptional("<b>")).toBe("&lt;b&gt;");
  });
});

describe("emailHref", () => {
  it("icazəli sxemləri saxlayır", () => {
    expect(emailHref("https://luxehomeestate.az/emlaklar/ev")).toBe(
      "https://luxehomeestate.az/emlaklar/ev",
    );
    expect(emailHref("mailto:info@luxehomeestate.az")).toBe("mailto:info@luxehomeestate.az");
    expect(emailHref("tel:+994519228585")).toBe("tel:+994519228585");
    expect(emailHref("/emlaklar/ev")).toBe("/emlaklar/ev");
  });

  it("`javascript:` və `data:` sxemlərini rədd edir", () => {
    expect(emailHref("javascript:alert(1)")).toBe("#");
    expect(emailHref("data:text/html;base64,PHNjcmlwdD4=")).toBe("#");
  });

  it("boş dəyəri `#`-ə çevirir", () => {
    expect(emailHref(null)).toBe("#");
    expect(emailHref("   ")).toBe("#");
  });

  it("atribut sərhədini qırmağa imkan vermir", () => {
    expect(emailHref('https://example.com/" onmouseover="alert(1)')).toBe(
      "https://example.com/&quot; onmouseover=&quot;alert(1)",
    );
  });
});

describe("telHref", () => {
  it("nömrə formatını saxlayır", () => {
    expect(telHref("+994 (51) 922-85-85")).toBe("+994 (51) 922-85-85");
  });

  it("nömrəyə aid olmayan simvolları atır", () => {
    const cleaned = telHref('+99451" onclick="alert(1)');
    expect(cleaned).not.toContain('"');
    expect(cleaned).not.toMatch(/[a-z]/i);
    expect(emailHref(`tel:${cleaned}`)).not.toContain("onclick");
  });
});
