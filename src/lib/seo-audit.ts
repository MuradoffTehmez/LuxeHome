export type SeoContentKind = "property" | "post" | "project" | "service";
export type SeoIssueSeverity = "error" | "warning" | "info";

export type SeoAuditContent = {
  kind: SeoContentKind;
  id: string;
  title: string;
  slug: string;
  description: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  noIndex: boolean;
  imageUrl?: string | null;
  imageAlt?: string | null;
  hasLocation?: boolean;
  hasAuthor?: boolean;
  hasPublishedAt?: boolean;
  internalLinkCount?: number;
  adminPath: string;
  publicPath: string;
};

export type SeoAuditIssue = {
  contentId: string;
  kind: SeoContentKind;
  title: string;
  code: string;
  severity: SeoIssueSeverity;
  message: string;
  adminPath: string;
  publicPath: string;
};

const THIN_WORD_LIMIT: Record<SeoContentKind, number> = {
  property: 35,
  post: 150,
  project: 80,
  service: 80,
};

function countWords(value: string) {
  const plain = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain ? plain.split(" ").length : 0;
}

export function evaluateSeoAudit(contents: SeoAuditContent[]) {
  const issues: SeoAuditIssue[] = [];
  const add = (
    content: SeoAuditContent,
    code: string,
    severity: SeoIssueSeverity,
    message: string,
  ) =>
    issues.push({
      contentId: content.id,
      kind: content.kind,
      title: content.title,
      code,
      severity,
      message,
      adminPath: content.adminPath,
      publicPath: content.publicPath,
    });

  const duplicateFields: Array<"metaTitle" | "metaDescription"> = ["metaTitle", "metaDescription"];
  for (const field of duplicateFields) {
    const values = new Map<string, SeoAuditContent[]>();
    for (const content of contents) {
      const value = content[field]?.trim().toLocaleLowerCase("az-AZ");
      if (value) values.set(value, [...(values.get(value) ?? []), content]);
    }
    for (const duplicates of values.values()) {
      if (duplicates.length < 2) continue;
      for (const content of duplicates) {
        add(
          content,
          field === "metaTitle" ? "meta_title_duplicate" : "meta_description_duplicate",
          "warning",
          field === "metaTitle" ? "Meta başlıq başqa səhifə ilə eynidir." : "Meta təsvir başqa səhifə ilə eynidir.",
        );
      }
    }
  }

  for (const content of contents) {
    const metaTitle = content.metaTitle?.trim() ?? "";
    const metaDescription = content.metaDescription?.trim() ?? "";
    if (!metaTitle) add(content, "meta_title_missing", "error", "Meta başlıq yoxdur.");
    else if (metaTitle.length < 25) add(content, "meta_title_short", "warning", "Meta başlıq 25 simvoldan qısadır.");
    else if (metaTitle.length > 60) add(content, "meta_title_long", "warning", "Meta başlıq 60 simvoldan uzundur.");

    if (!metaDescription) add(content, "meta_description_missing", "error", "Meta təsvir yoxdur.");
    else if (metaDescription.length < 70) add(content, "meta_description_short", "warning", "Meta təsvir 70 simvoldan qısadır.");
    else if (metaDescription.length > 160) add(content, "meta_description_long", "warning", "Meta təsvir 160 simvoldan uzundur.");

    if (countWords(content.description) < THIN_WORD_LIMIT[content.kind]) {
      add(content, "thin_content", "warning", "Səhifənin görünən mətni kifayət qədər əhatəli deyil.");
    }
    if (!content.imageUrl) add(content, "cover_missing", "warning", "Üz qabığı şəkli yoxdur.");
    else if (!content.imageAlt?.trim()) add(content, "image_alt_missing", "warning", "Üz qabığı şəklinin alt mətni yoxdur.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(content.slug)) {
      add(content, "slug_invalid", "error", "Slug yalnız kiçik latın hərfləri, rəqəm və defisdən ibarət olmalıdır.");
    }
    if (content.kind === "property" && !content.hasLocation) {
      add(content, "location_missing", "error", "Əmlakın rayon və ya metro əlaqəsi yoxdur.");
    }
    if (content.kind === "post" && !content.hasAuthor) {
      add(content, "author_missing", "warning", "Bloq yazısının müəllifi yoxdur.");
    }
    if (content.kind === "post" && !content.hasPublishedAt) {
      add(content, "published_at_missing", "error", "Bloq yazısının dərc tarixi yoxdur.");
    }
    if (content.internalLinkCount === 0) {
      add(content, "orphan_page", "warning", "Bu səhifəyə daxili keçid qeydə alınmayıb.");
    }
  }

  const hasIssue = (content: SeoAuditContent, codes: string[]) =>
    issues.some((issue) => issue.contentId === content.id && codes.includes(issue.code));
  return {
    metrics: {
      total: contents.length,
      indexable: contents.filter((content) => !content.noIndex).length,
      sitemapEligible: contents.filter((content) => !content.noIndex).length,
      completeMeta: contents.filter(
        (content) => !hasIssue(content, ["meta_title_missing", "meta_description_missing"]),
      ).length,
      missingAlt: contents.filter((content) => hasIssue(content, ["image_alt_missing"])).length,
      thinContent: contents.filter((content) => hasIssue(content, ["thin_content"])).length,
      schemaReady: contents.filter(
        (content) => !hasIssue(content, ["location_missing", "author_missing", "published_at_missing"]),
      ).length,
      orphanPages: contents.filter((content) => hasIssue(content, ["orphan_page"])).length,
    },
    issues: issues.sort((a, b) => {
      const rank = { error: 0, warning: 1, info: 2 } as const;
      return rank[a.severity] - rank[b.severity] || a.title.localeCompare(b.title, "az");
    }),
  };
}
