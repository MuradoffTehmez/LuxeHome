import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ContactPage from "@/app/[locale]/(site)/elaqe/page";
import FaqPage from "@/app/[locale]/(site)/suallar/page";

describe("ictimai məlumat səhifələri", () => {
  it("əlaqə səhifəsində mobil axında formanı əlaqə siyahısından əvvəl göstərir", () => {
    const html = renderToStaticMarkup(<ContactPage />);

    expect(html.indexOf("Müraciət göndər")).toBeLessThan(html.indexOf("Əlaqə məlumatları"));
    expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]");
    expect(html).toContain('aria-label="Naviqasiya yolu"');
  });

  it("FAQ cavablarını JavaScript-siz disclosure və böyük toxunma hədəfi ilə təqdim edir", () => {
    const html = renderToStaticMarkup(<FaqPage />);

    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("min-h-14");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain('"@type":"FAQPage"');
  });
});
