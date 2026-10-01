import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { BLOG_COVER_SLUGS, BLOG_FALLBACK_POOL } from "@/lib/blog-covers";
import { BLOG_POSTS } from "../../prisma/knowledge-guides/blog-posts";

const publicDir = join(process.cwd(), "public");

describe("bloq üz qabığı aktivləri", () => {
  it("siyahıdakı hər yazının hazır WebP faylı var və böyük deyil", () => {
    for (const slug of BLOG_COVER_SLUGS) {
      const file = join(publicDir, "images", "blog", `${slug}.webp`);
      expect(existsSync(file), `${slug}.webp tapılmadı`).toBe(true);
      expect(statSync(file).size, `${slug}.webp çox böyükdür`).toBeLessThan(300 * 1024);
    }
  });

  it("ehtiyat foto siyahısındakı hər fayl mövcuddur", () => {
    for (const url of BLOG_FALLBACK_POOL) {
      expect(existsSync(join(publicDir, url)), `${url} tapılmadı`).toBe(true);
    }
  });

  it("migrasiya ilə gələn hər bloq yazısının öz üz qabığı var", () => {
    const missing = BLOG_POSTS.map((post) => post.slug).filter((slug) => !BLOG_COVER_SLUGS.includes(slug));
    expect(missing).toEqual([]);
  });
});
