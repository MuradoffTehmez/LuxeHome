"use server";

import { AdminGuardError, requireAdminAction } from "@/lib/admin/guard";
import { checkAdminAiLimit } from "@/lib/auth/rate-limit";
import { PERMISSIONS, type Permission } from "@/lib/constants";
import { generatePageSeoCopy } from "@/lib/listing-enrichment";
import { fallbackPageSeo, type SeoCopy } from "@/lib/seo-copy";

/**
 * Paneldəki SEO sahələrinin «AI ilə doldur» düyməsi.
 *
 * Redaktor yalnız SEO başlığını (və ya məzmun başlığını) yazır; meta təsvir,
 * Open Graph, açar sözlər və sosial mətn buradan gəlir. Nəticə formaya
 * **təklif** kimi düşür — yadda saxlama yenə redaktorun əlindədir.
 */

/** Hansı forma üçün hansı icazə — client-dən gələn `kind` yalnız bu siyahıdan qəbul olunur. */
const KIND_PERMISSIONS: Record<string, Permission> = {
  property: PERMISSIONS.PROPERTY_MANAGE,
  project: PERMISSIONS.PROJECT_MANAGE,
  service: PERMISSIONS.SERVICE_MANAGE,
  blog: PERMISSIONS.BLOG_MANAGE,
  knowledge: PERMISSIONS.KNOWLEDGE_MANAGE,
  page: PERMISSIONS.SEO_EDIT,
};

const KIND_LABELS: Record<string, string> = {
  property: "əmlak elanı",
  project: "yaşayış kompleksi",
  service: "xidmət",
  blog: "bloq yazısı",
  knowledge: "bilik mərkəzi məqaləsi",
  page: "sayt",
};

export type SeoSuggestion =
  | { ok: true; copy: SeoCopy; source: "ai" | "fallback" }
  | { ok: false; error: "forbidden" | "empty" };

export async function suggestSeo(input: {
  kind: string;
  seoTitle: string;
  title: string;
  body: string;
}): Promise<SeoSuggestion> {
  const kind = Object.hasOwn(KIND_PERMISSIONS, input.kind) ? input.kind : "page";
  let user;
  try {
    user = await requireAdminAction(KIND_PERMISSIONS[kind]);
  } catch (error) {
    if (error instanceof AdminGuardError) return { ok: false, error: "forbidden" };
    throw error;
  }

  const seoTitle = String(input.seoTitle ?? "").slice(0, 200);
  const title = String(input.title ?? "").slice(0, 200);
  const body = String(input.body ?? "").replace(/<[^>]+>/g, " ").slice(0, 6000);
  if (!seoTitle.trim() && !title.trim()) return { ok: false, error: "empty" };

  if (!(await checkAdminAiLimit(user.id))) {
    return { ok: true, copy: fallbackPageSeo({ title: seoTitle || title, body }), source: "fallback" };
  }
  const result = await generatePageSeoCopy({ seoTitle, title, body, kind: KIND_LABELS[kind] });
  return { ok: true, copy: result.copy, source: result.source };
}
