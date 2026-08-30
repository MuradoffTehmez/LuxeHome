import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminKnowledgeCategories } from "@/lib/knowledge";
import { createKnowledgeArticle } from "../actions";
import { KnowledgeArticleForm } from "../article-form";
import { EMPTY_KNOWLEDGE_ARTICLE } from "../form-values";

export const metadata: Metadata = { title: "Yeni bələdçi" };
export const dynamic = "force-dynamic";

export default async function NewKnowledgeArticlePage() {
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);
  const categories = await getAdminKnowledgeCategories();

  return (
    <>
      <AdminPageHeader
        title="Yeni bələdçi"
        description="Bələdçini qaralama saxlayın, hüquqi və faktoloji yoxlamadan sonra dərc edin."
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          { label: "Bilik Mərkəzi", href: "/admin/bilik-merkezi" },
          { label: "Yeni bələdçi" },
        ]}
      />
      <KnowledgeArticleForm
        action={createKnowledgeArticle}
        initial={EMPTY_KNOWLEDGE_ARTICLE}
        categories={categories.map(({ id, name }) => ({ id, name }))}
        submitLabel="Bələdçini yarat"
      />
    </>
  );
}
