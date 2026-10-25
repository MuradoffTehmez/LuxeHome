import { describe, expect, it } from "vitest";
import { siteConfig, siteUrl } from "@/config/site";
import { buildLlmsTxt } from "@/lib/llms-txt";

describe("llms.txt (#289)", () => {
  it("konvensiya başlığı, təsdiqlənmiş faktlar və locale-li mütləq linklər", () => {
    const text = buildLlmsTxt({ hiddenPaths: [] });

    expect(text.startsWith(`# ${siteConfig.name}\n\n> ${siteConfig.description}`)).toBe(true);
    expect(text).toContain(`VÖEN: ${siteConfig.legal.voen}`);
    expect(text).toContain(siteConfig.owner.name);
    expect(text).toContain(`(${siteUrl("/az/emlaklar")})`);
    expect(text).toContain(`(${siteUrl("/az/bilik-merkezi")})`);
    // Prefikssiz link yönləndirmədən keçirdi
    expect(text).not.toMatch(/\]\(https:\/\/[^)]+\/emlaklar\)/);
    expect(text).toContain(siteUrl("/llms-full.txt"));
  });

  it("paneldən bağlanmış bölməyə istinad etmir", () => {
    const text = buildLlmsTxt({ hiddenPaths: ["/layiheler", "/paketler"] });
    expect(text).not.toContain("/layiheler");
    expect(text).not.toContain("/paketler");
  });

  it("geniş versiya məqalə və yazıları daşıyır, özünə istinad etmir", () => {
    const text = buildLlmsTxt({
      hiddenPaths: [],
      full: {
        knowledge: [{ url: siteUrl("/az/bilik-merkezi/kupca"), title: "Kupça", description: "Çıxarış nədir" }],
        posts: [],
      },
    });
    expect(text).toContain("## Bilik Mərkəzi məqalələri");
    expect(text).toContain(`- [Kupça](${siteUrl("/az/bilik-merkezi/kupca")}): Çıxarış nədir`);
    expect(text).not.toContain("## Bloq yazıları");
    expect(text).not.toContain("llms-full.txt");
  });
});
