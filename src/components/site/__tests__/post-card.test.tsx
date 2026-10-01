import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PostCardData } from "@/lib/queries";
import { PostCard } from "../post-card";

const basePost = {
  id: "post-1",
  title: "Mənzil satarkən düzgün qiymət necə seçilməlidir?",
  slug: "menzil-satarken-duzgun-qiymet-nece-secilmelidir",
  excerpt: "Qiymət strategiyası.",
  coverUrl: null,
  coverAlt: "",
  readMinutes: 1,
  publishedAt: new Date("2026-09-29T08:00:00Z"),
  category: { name: "Məsləhətlər", slug: "meslehetler" },
} as PostCardData;

describe("PostCard", () => {
  it("üz qabığı yoxdursa mövzuya uyğun brend fotosunu göstərir, boş ikon yox", async () => {
    const html = renderToStaticMarkup(await PostCard({ post: basePost }));

    expect(html).toContain(encodeURIComponent(`/images/blog/${basePost.slug}.webp`));
    expect(html).not.toContain("lucide-newspaper");
    // Ehtiyat foto dekorativdir
    expect(html).toContain('alt=""');
  });

  it("paneldən yüklənən üz qabığı ehtiyat fotodan üstündür", async () => {
    const html = renderToStaticMarkup(
      await PostCard({ post: { ...basePost, coverUrl: "/media/bloq/2026/09/abc.webp", coverAlt: "Ev" } }),
    );

    expect(html).toContain("/media/bloq/2026/09/abc.webp");
    expect(html).toContain('alt="Ev"');
    expect(html).not.toContain("images%2Fblog");
  });

  it("tarixi «2026 M09 29» əvəzinə oxunaqlı Azərbaycan formatında yazır", async () => {
    const html = renderToStaticMarkup(await PostCard({ post: basePost }));

    expect(html).toContain("29 sentyabr 2026");
    expect(html).not.toMatch(/\d{4} M\d{2}/);
    expect(html).toContain('dateTime="2026-09-29T08:00:00.000Z"');
  });

  it("seçilmiş variantlar eyni başlıq linkini və 44 px hədəfi saxlayır", async () => {
    const wide = renderToStaticMarkup(await PostCard({ post: basePost, variant: "wide" }));
    const featured = renderToStaticMarkup(await PostCard({ post: basePost, variant: "featured" }));

    for (const html of [wide, featured]) {
      expect(html).toMatch(/<a[^>]*class="[^"]*min-h-11[^"]*"[^>]*href="\/blog\//);
    }
    // Yalnız «wide» üfüqi şəbəkədir; ana səhifənin dar sütunundakı «featured» şaquli qalır
    expect(wide).toContain("lg:grid-cols-");
    expect(featured).not.toContain("lg:grid-cols-");
  });
});
