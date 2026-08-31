import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminKnowledgeCategories } from "@/lib/knowledge";
import { createKnowledgeArticle } from "../actions";
import { KnowledgeArticleForm } from "../article-form";
import { EMPTY_KNOWLEDGE_ARTICLE } from "../form-values";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.knowledge.yeniBeledci") };
}
export const dynamic = "force-dynamic";

export default async function NewKnowledgeArticlePage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);
  const categories = await getAdminKnowledgeCategories();

  return (
    <>
      <AdminPageHeader
        title={t("pages.knowledge.yeniBeledci")}
        description={t("pages.knowledge.beledciniQaralamaSaxlayinHuquqi")}
        breadcrumbs={[
          { label: t("pages.knowledge.idarePaneli"), href: "/admin" },
          { label: t("pages.knowledge.bilikMerkezi"), href: "/admin/bilik-merkezi" },
          { label: t("pages.knowledge.yeniBeledci") },
        ]}
      />
      <KnowledgeArticleForm
        action={createKnowledgeArticle}
        initial={EMPTY_KNOWLEDGE_ARTICLE}
        categories={categories.map(({ id, name }) => ({ id, name }))}
        submitLabel={t("pages.knowledge.beledciniYarat")}
      />
    </>
  );
}
