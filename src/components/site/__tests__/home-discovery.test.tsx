import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PostCardData, ProjectCardData } from "@/lib/queries";
import { Hero } from "../hero";
import { MobileCategoryRail } from "../mobile-category-rail";
import { PostCard } from "../post-card";
import { ProjectCard } from "../project-card";

describe("ana səhifə discovery təcrübəsi", () => {
  it("hero-nu mobil ekranda content-based, desktopda viewport-a uyğun saxlayır", () => {
    const html = renderToStaticMarkup(<Hero types={[]} cities={[]} />);

    expect(html).toContain("min-h-[34rem]");
    expect(html).toContain("sm:min-h-[40rem]");
    expect(html).toContain("lg:min-h-[min(54rem,100dvh)]");
    expect(html).toContain("gap-8");
    expect(html).toContain("pb-6");
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

  it("layihə və standart bloq kartlarında real responsiv grid sizes saxlayır", () => {
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

    const projectHtml = renderToStaticMarkup(<ProjectCard project={project} />);
    const postHtml = renderToStaticMarkup(<PostCard post={post} />);
    const expectedSizes =
      "(max-width: 639px) calc(100vw - 2rem), (max-width: 1279px) calc(50vw - 2rem), 33vw";

    expect(projectHtml).toContain(`sizes="${expectedSizes}"`);
    expect(postHtml).toContain(`sizes="${expectedSizes}"`);
  });
});
