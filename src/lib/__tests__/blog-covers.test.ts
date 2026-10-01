import { describe, expect, it } from "vitest";

import { BLOG_COVER_SLUGS, BLOG_FALLBACK_POOL, resolveBlogCover } from "@/lib/blog-covers";

describe("resolveBlogCover", () => {
  it("paneldən yüklənmiş üz qabığı həmişə üstünlük təşkil edir", () => {
    const cover = resolveBlogCover({
      slug: BLOG_COVER_SLUGS[0],
      title: "Başlıq",
      coverUrl: "/media/bloq/2026/09/abc.webp",
      coverAlt: "Redaktorun yazdığı alt",
    });

    expect(cover).toEqual({ url: "/media/bloq/2026/09/abc.webp", alt: "Redaktorun yazdığı alt", isFallback: false });
  });

  it("alt mətn yazılmayıbsa yüklənmiş şəkil başlığı alt kimi alır", () => {
    const cover = resolveBlogCover({ slug: "x", title: "Başlıq", coverUrl: "/media/bloq/a.webp", coverAlt: "" });
    expect(cover.alt).toBe("Başlıq");
  });

  it("şəkli olmayan ilk bloq yazısı üçün hazır üz qabığını verir", () => {
    for (const slug of BLOG_COVER_SLUGS) {
      expect(resolveBlogCover({ slug, title: "T", coverUrl: null })).toEqual({
        url: `/images/blog/${slug}.webp`,
        alt: "",
        isFallback: true,
      });
    }
  });

  it("naməlum slug üçün ehtiyat fotonu sabit seçir", () => {
    const first = resolveBlogCover({ slug: "yeni-yazi-slug", title: "T", coverUrl: null });
    const second = resolveBlogCover({ slug: "yeni-yazi-slug", title: "T", coverUrl: undefined });

    expect(BLOG_FALLBACK_POOL).toContain(first.url);
    expect(second.url).toBe(first.url);
    expect(first.isFallback).toBe(true);
  });

  it("ehtiyat seçimi bütün fotolar arasında paylanır", () => {
    const used = new Set(
      Array.from({ length: 200 }, (_, index) => resolveBlogCover({ slug: `yazi-${index}`, title: "T" }).url),
    );
    expect(used.size).toBeGreaterThanOrEqual(BLOG_FALLBACK_POOL.length - 1);
  });
});
