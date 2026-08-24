import { describe, expect, it } from "vitest";
import { evaluateSeoAudit, type SeoAuditContent } from "@/lib/seo-audit";

const base: SeoAuditContent = {
  kind: "property",
  id: "p1",
  title: "Nərimanovda satılan üç otaqlı mənzil",
  slug: "nerimanovda-satilan-3-otaqli-menzil",
  description: "Əmlak haqqında ".repeat(20),
  metaTitle: "Nərimanovda satılan 3 otaqlı mənzil",
  metaDescription: "Nərimanov rayonunda satılan üç otaqlı mənzilin qiyməti, sahəsi, sənədi və digər aktual məlumatları ilə tanış olun.",
  noIndex: false,
  imageUrl: "/media/home.webp",
  imageAlt: "Nərimanovda üç otaqlı mənzilin qonaq otağı",
  hasLocation: true,
  hasAuthor: true,
  hasPublishedAt: true,
  internalLinkCount: 2,
  adminPath: "/admin/emlaklar/p1",
  publicPath: "/emlaklar/nerimanovda-satilan-3-otaqli-menzil",
};

describe("SEO audit evaluator", () => {
  it("missing/short/long/duplicate meta, thin copy, cover/alt, slug, schema və orphan problemlərini tapır", () => {
    const result = evaluateSeoAudit([
      {
        ...base,
        id: "p-bad",
        slug: "Yanlış Slug",
        description: "Çox qısa.",
        metaTitle: "Qısa",
        metaDescription: null,
        imageUrl: null,
        hasLocation: false,
        internalLinkCount: 0,
      },
      { ...base, id: "p-dup", slug: "ikinci-elan" },
      { ...base, kind: "post", id: "b1", slug: "blog-yazisi", hasAuthor: false, hasPublishedAt: false },
    ]);

    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "meta_title_short",
        "meta_description_missing",
        "thin_content",
        "cover_missing",
        "slug_invalid",
        "location_missing",
        "orphan_page",
        "meta_title_duplicate",
        "meta_description_duplicate",
        "author_missing",
        "published_at_missing",
      ]),
    );
    expect(result.issues.every((issue) => issue.adminPath.startsWith("/admin/"))).toBe(true);
  });

  it("sağlam content üçün ölçüləri düzgün hesablayır", () => {
    const result = evaluateSeoAudit([base]);
    expect(result.issues).toEqual([]);
    expect(result.metrics).toMatchObject({
      total: 1,
      indexable: 1,
      sitemapEligible: 1,
      completeMeta: 1,
      missingAlt: 0,
      thinContent: 0,
      schemaReady: 1,
      orphanPages: 0,
    });
  });
});
