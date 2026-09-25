import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PostCardData, ProjectCardData } from "@/lib/queries";
import { Hero } from "../hero";
import { AiSearchForm } from "../ai-search-form";
import { HomeSeoIntro } from "../home-seo-intro";
import { MobileCategoryRail } from "../mobile-category-rail";
import { PostCard } from "../post-card";
import { ProjectCard } from "../project-card";

const heroProps = {
  types: [],
  cities: [],
  locale: "az" as const,
  labels: {
    imageAlt: "Müasir memarlıqla tikilmiş premium villa",
    eyebrow: "LUXE HOME ESTATE",
    title: "Bakıda daşınmaz əmlak satışı və icarəsi",
    description: "Uyğun daşınmaz əmlakı kəşf edin.",
    viewProperties: "Əmlaklara bax",
    contactUs: "Bizimlə əlaqə",
    call: "Zəng et",
    search: {
      listingType: "Elan növü",
      sale: "Satılır",
      rent: "Kirayə",
      query: "Axtarış",
      queryPlaceholder: "Rayon, metro və ya açar söz",
      propertyType: "Əmlak növü",
      city: "Şəhər",
      all: "Hamısı",
      submit: "Axtar",
    },
  },
};

describe("ana səhifə discovery təcrübəsi", () => {
  it("hero-nu mobil ekranda content-based, desktopda viewport-a uyğun saxlayır", async () => {
    const html = renderToStaticMarkup(<Hero {...heroProps} />);

    expect(html).toContain("min-h-[34rem]");
    expect(html).toContain("sm:min-h-[40rem]");
    expect(html).toContain("lg:min-h-[min(54rem,100dvh)]");
    expect(html).toContain("gap-8");
    expect(html).toContain("pb-6");
  });

  it("hero yalnız bir, kommersiya niyyətli H1 göstərir", async () => {
    const html = renderToStaticMarkup(<Hero {...heroProps} />);

    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Bakıda daşınmaz əmlak satışı və icarəsi");
    expect(html).not.toMatch(/<h1[^>]*>\s*HƏYATINIZIN ƏN DƏYƏRLİ ÜNVANI/);
  });

  it("hero axtarışını client hydration olmadan native GET formu kimi saxlayır", () => {
    const html = renderToStaticMarkup(<Hero {...heroProps} />);

    expect(html).toContain('action="/az/emlaklar"');
    expect(html).toContain('method="get"');
    expect(html).toContain('name="elan"');
    expect(html).toContain('name="axtaris"');
    expect(html).toContain('name="tip"');
    expect(html).toContain('name="seher"');
    expect(html).toContain('data-analytics-placement="hero"');
  });

  it("AI axtarışını locale-agah native GET formu kimi saxlayır", () => {
    const html = renderToStaticMarkup(
      <AiSearchForm
        initialQuery="Bakıda villa"
        locale="az"
        labels={{ placeholder: "Sorğunu yazın", submit: "AI ilə axtar", example: "3 otaqlı mənzil" }}
      />,
    );

    expect(html).toContain('action="/az/ai-axtaris"');
    expect(html).toContain('method="get"');
    expect(html).toContain('name="q"');
    expect(html).toContain('value="Bakıda villa"');
    expect(html).toContain('/ai-axtaris?q=3%20otaql%C4%B1%20m%C9%99nzil');
  });

  it("lokal giriş mətnindən təmiz kommersiya route-larına link verir", async () => {
    const html = renderToStaticMarkup(await HomeSeoIntro({}));
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = text.split(" ").length;

    expect(wordCount).toBeGreaterThanOrEqual(100);
    expect(wordCount).toBeLessThanOrEqual(180);
    for (const href of [
      "/satilan-emlaklar",
      "/kiraye-emlaklar",
      "/bakida-satilan-menziller",
      "/villalar",
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
    // «Yaşayış kompleksləri» defolt olaraq paneldən bağlıdır (#83) — 404 verən
    // səhifəyə keçid verilmir.
    expect(html).not.toContain('href="/layiheler"');
  });

  it("kateqoriyaları mobil scroll-snap rail kimi əlçatan render edir", () => {
    const html = renderToStaticMarkup(
      <MobileCategoryRail
        items={[
          { href: "/emlaklar?tip=menzil", label: "Mənzil", count: 24 },
          { href: "/emlaklar?tip=villa", label: "Villa", count: 8 },
        ]}
      />,
    );

    expect(html).toContain('aria-label="Əmlak kateqoriyaları"');
    expect(html).toContain("snap-mandatory");
    expect(html).toContain("w-[78vw]");
    expect(html).toContain("lg:hidden");
    expect(html).toContain('href="/emlaklar?tip=menzil"');
    expect(html).toContain("24 elan");
  });

  it("layihə və standart bloq kartlarında real responsiv grid sizes saxlayır", async () => {
    const project = {
      id: "project-1",
      name: "Sahil Residence",
      slug: "sahil-residence",
      summary: "Premium yaşayış layihəsi",
      projectType: "RESIDENTIAL",
      status: "ONGOING",
      year: 2027,
      coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
      city: { name: "Bakı" },
    } as ProjectCardData;
    const post = {
      id: "post-1",
      title: "Əmlak seçimi",
      slug: "emlak-secimi",
      excerpt: "Doğru seçim üçün əsas meyarlar.",
      coverUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa",
      coverAlt: "Müasir yaşayış binası",
      readMinutes: 5,
      publishedAt: new Date("2026-08-20T10:00:00Z"),
      category: { name: "Bələdçi", slug: "beledci" },
    } as PostCardData;

    const projectHtml = renderToStaticMarkup(await ProjectCard({ project }));
    const postHtml = renderToStaticMarkup(await PostCard({ post }));
    const expectedSizes =
      "(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1279px) calc(50vw - 2.25rem), 448px";

    expect(projectHtml).toContain(`sizes="${expectedSizes}"`);
    expect(postHtml).toContain(`sizes="${expectedSizes}"`);
  });
});
