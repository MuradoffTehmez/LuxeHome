import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ContactPage from "@/app/[locale]/(site)/elaqe/page";
import FaqPage from "@/app/[locale]/(site)/suallar/page";
import AboutPage from "@/app/[locale]/(site)/haqqimizda/page";
import { ArticleTrustMeta } from "@/components/site/article-trust-meta";
import { siteConfig } from "@/config/site";

describe("ictimai məlumat səhifələri", () => {
  it("əlaqə səhifəsində mobil axında formanı əlaqə siyahısından əvvəl göstərir", async () => {
    const html = renderToStaticMarkup(
      await ContactPage({ params: Promise.resolve({ locale: "az" }) }),
    );

    expect(html.indexOf("Müraciət göndər")).toBeLessThan(html.indexOf("Əlaqə məlumatları"));
    expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]");
    expect(html).toContain('aria-label="Naviqasiya yolu"');
    expect(html).toContain(siteConfig.phone);
    expect(html).toContain(siteConfig.email);
    expect(html).toContain(siteConfig.addressFull);
    expect(html).not.toContain("İş saatları");
    expect(html).not.toContain("Xəritədə aç");
  });

  it("haqqımızda səhifəsində hüquqi ad və owner görünür, uydurma statistika və stok team fotosu yoxdur", async () => {
    const html = renderToStaticMarkup(
      await AboutPage({ params: Promise.resolve({ locale: "az" }) }),
    );
    expect(html).toContain(siteConfig.legalName);
    expect(html).toContain(siteConfig.owner.name);
    expect(html).toContain(siteConfig.legal.voen);
    expect(html).not.toContain("images.unsplash.com");
    expect(html).not.toMatch(/\d+\+\s*(il|müştəri|əməliyyat)/i);
  });

  it("məqalədə DB müəllifini, dərc və real yenilənmə tarixini görünən edir", () => {
    const html = renderToStaticMarkup(
      <ArticleTrustMeta
        authorName="Aynur Məmmədova"
        publishedAt={new Date("2026-08-20T09:00:00.000Z")}
        updatedAt={new Date("2026-08-24T09:00:00.000Z")}
        readMinutes={6}
        viewCount={120}
      />,
    );

    expect(html).toContain("Aynur Məmmədova");
    expect(html).toContain("Dərc edilib:");
    expect(html).toContain("Yenilənib:");
    expect(html).toContain('dateTime="2026-08-20T09:00:00.000Z"');
    expect(html).toContain('dateTime="2026-08-24T09:00:00.000Z"');
  });

  it("FAQ cavablarını JavaScript-siz disclosure və böyük toxunma hədəfi ilə təqdim edir", async () => {
    const html = renderToStaticMarkup(
      await FaqPage({ params: Promise.resolve({ locale: "az" }) }),
    );

    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("min-h-14");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain('"@type":"FAQPage"');
  });
});
