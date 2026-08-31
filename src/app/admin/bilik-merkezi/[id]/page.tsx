import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminKnowledgeCategories } from "@/lib/knowledge";
import { parseJsonArray } from "@/lib/utils";
import { deleteKnowledgeArticle, updateKnowledgeArticle } from "../actions";
import { KnowledgeArticleForm } from "../article-form";
import type { KnowledgeArticleFormValues } from "../form-values";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.knowledge.beledciniRedakteEt") };
}
export const dynamic = "force-dynamic";

export default async function EditKnowledgeArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);
  const { id } = await params;
  const [article, categories] = await Promise.all([
    prisma.knowledgeArticle.findFirst({ where: { id, deletedAt: null } }),
    getAdminKnowledgeCategories(),
  ]);
  if (!article) notFound();

  const initial: KnowledgeArticleFormValues = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    categoryId: article.categoryId ?? "",
    audience: article.audience,
    level: article.level,
    status: article.status,
    isFeatured: article.isFeatured,
    legalStatus: article.legalStatus,
    riskLevel: article.riskLevel,
    jurisdiction: article.jurisdiction,
    legalReviewedAt: article.legalReviewedAt
      ? article.legalReviewedAt.toISOString().slice(0, 10)
      : "",
    legalActs: parseJsonArray<string>(article.legalActs).join("\n"),
    sourceUrls: parseJsonArray<string>(article.sourceUrls).join("\n"),
    legalBasis: article.legalBasis ?? "",
    requiredDocuments: article.requiredDocuments ?? "",
    procedure: article.procedure ?? "",
    duration: article.duration ?? "",
    costs: article.costs ?? "",
    risks: article.risks ?? "",
    checklist: article.checklist ?? "",
    template: article.template ?? "",
    courtPosition: article.courtPosition ?? "",
    metaTitle: article.metaTitle ?? "",
    metaDescription: article.metaDescription ?? "",
    noIndex: article.noIndex,
    canonicalUrl: article.canonicalUrl ?? "",
    ogTitle: article.ogTitle ?? "",
    ogDescription: article.ogDescription ?? "",
    ogImage: article.ogImage ?? "",
    cover: article.coverUrl
      ? [{ url: article.coverUrl, alt: article.coverAlt, isCover: true }]
      : [],
  };

  return (
    <>
      <AdminPageHeader
        title={article.title}
        description={t("pages.knowledge.beledcininMezmununuAuditoriyasiniVe")}
        breadcrumbs={[
          { label: t("pages.knowledge.idarePaneli"), href: "/admin" },
          { label: t("pages.knowledge.bilikMerkezi"), href: "/admin/bilik-merkezi" },
          { label: article.title },
        ]}
      />
      <KnowledgeArticleForm
        action={updateKnowledgeArticle}
        initial={initial}
        categories={categories.map(({ id: categoryId, name }) => ({ id: categoryId, name }))}
        submitLabel={t("pages.knowledge.beledciniYenile")}
        extraActions={
          <ConfirmAction
            action={deleteKnowledgeArticle}
            id={article.id}
            label={t("pages.knowledge.beledciniSil")}
            title={t("pages.knowledge.beledciniSilmek")}
            description={t("pages.knowledge.beledciIctimaiSaytdanCixarilacaq")}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </ConfirmAction>
        }
      />
    </>
  );
}
