import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminKnowledgeCategories } from "@/lib/knowledge";
import { deleteKnowledgeCategory } from "../actions";
import { KnowledgeCategoryForm } from "../category-form";
import { EMPTY_KNOWLEDGE_CATEGORY } from "../form-values";

export const metadata: Metadata = { title: "Bilik mövzuları" };
export const dynamic = "force-dynamic";
const PATH = "/admin/bilik-merkezi/kateqoriyalar";

export default async function KnowledgeCategoriesPage({ searchParams }: { searchParams: Promise<{ duzelis?: string }> }) {
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);
  const [{ duzelis }, categories] = await Promise.all([searchParams, getAdminKnowledgeCategories()]);
  const editing = categories.find((item) => item.id === duzelis);
  const initial = editing
    ? { id: editing.id, name: editing.name, slug: editing.slug, description: editing.description ?? "", icon: editing.icon ?? "", order: editing.order, isActive: editing.isActive }
    : EMPTY_KNOWLEDGE_CATEGORY;

  return (
    <>
      <AdminPageHeader title="Bilik mövzuları" description="Bələdçi və terminləri mövzu üzrə qruplaşdırın." breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Bilik Mərkəzi", href: "/admin/bilik-merkezi" }, { label: "Mövzular" }]} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <AdminCard bodyClassName="p-0">
          <AdminTable caption="Bilik mövzuları" headers={[{ label: "Mövzu" }, { label: "Kontent" }, { label: "Status" }, { label: "Əməliyyatlar", srOnly: true, className: "text-right" }]}>
            {categories.map((category) => (
              <AdminTableRow key={category.id}>
                <AdminTableCell><p className="font-medium">{category.name}</p><p className="text-xs text-ink-muted">/{category.slug}</p></AdminTableCell>
                <AdminTableCell className="text-sm text-ink-soft">{category._count.articles} bələdçi · {category._count.terms} termin</AdminTableCell>
                <AdminTableCell><Badge tone={category.isActive ? "success" : "neutral"}>{category.isActive ? "Aktiv" : "Gizli"}</Badge></AdminTableCell>
                <AdminTableCell align="right"><div className="flex justify-end"><Link href={`${PATH}?duzelis=${category.id}`} className="grid size-11 place-items-center text-ink-muted" aria-label={`«${category.name}» mövzusunu redaktə et`}><Pencil className="size-4" /></Link><ConfirmAction action={deleteKnowledgeCategory} id={category.id} label={`«${category.name}» mövzusunu sil`} title="Mövzunu silmək" description="Bağlı bələdçi və terminlər silinməyəcək, mövzusuz qalacaq." className="size-11"><Trash2 className="size-4" /></ConfirmAction></div></AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        </AdminCard>
        <KnowledgeCategoryForm initial={initial} />
      </div>
    </>
  );
}
