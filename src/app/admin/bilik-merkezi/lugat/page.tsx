import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow, StatusBadge } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PERMISSIONS, type KnowledgeStatus } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminKnowledgeCategories, getAdminKnowledgeTerms } from "@/lib/knowledge";
import { parseJsonArray } from "@/lib/utils";
import { deleteKnowledgeTerm } from "../actions";
import { EMPTY_KNOWLEDGE_TERM } from "../form-values";
import { KnowledgeTermForm } from "../term-form";
import { getAdminT } from "@/lib/admin-i18n";

export const metadata: Metadata = { title: "Daşınmaz əmlak lüğəti" };
export const dynamic = "force-dynamic";
const PATH = "/admin/bilik-merkezi/lugat";

export default async function AdminKnowledgeTermsPage({ searchParams }: { searchParams: Promise<{ duzelis?: string }> }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);
  const [{ duzelis }, terms, categories] = await Promise.all([searchParams, getAdminKnowledgeTerms(), getAdminKnowledgeCategories()]);
  const editing = terms.find((item) => item.id === duzelis);
  const initial = editing ? { id: editing.id, term: editing.term, slug: editing.slug, shortDefinition: editing.shortDefinition, definition: editing.definition ?? "", categoryId: editing.categoryId ?? "", status: editing.status, order: editing.order, relatedSlugs: parseJsonArray<string>(editing.relatedSlugs).join("\n") } : EMPTY_KNOWLEDGE_TERM;

  return (
    <>
      <AdminPageHeader title="Daşınmaz əmlak lüğəti" description="Hüquqi, maliyyə və texniki terminlərin aydın təriflərini idarə edin." breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Bilik Mərkəzi", href: "/admin/bilik-merkezi" }, { label: "Lüğət" }]} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <AdminCard bodyClassName="p-0">
          <AdminTable caption="Lüğət terminləri" headers={[{ label: "Termin" }, { label: "Mövzu" }, { label: "Status" }, { label: "Əməliyyatlar", srOnly: true, className: "text-right" }]}>
            {terms.map((term) => <AdminTableRow key={term.id}><AdminTableCell className="max-w-96"><p className="font-medium">{term.term}</p><p className="truncate text-xs text-ink-muted">{term.shortDefinition}</p></AdminTableCell><AdminTableCell className="text-sm text-ink-soft">{term.category?.name ?? "—"}</AdminTableCell><AdminTableCell><StatusBadge status={term.status as "DRAFT" | "PUBLISHED"} label={t(`labels.knowledgeStatus.${term.status as KnowledgeStatus}`) ?? term.status} /></AdminTableCell><AdminTableCell align="right"><div className="flex justify-end"><Link href={`${PATH}?duzelis=${term.id}`} className="grid size-11 place-items-center text-ink-muted" aria-label={`«${term.term}» terminini redaktə et`}><Pencil className="size-4" /></Link><ConfirmAction action={deleteKnowledgeTerm} id={term.id} label={`«${term.term}» terminini sil`} title="Termini silmək" description="Termin lüğətdən birdəfəlik silinəcək." className="size-11"><Trash2 className="size-4" /></ConfirmAction></div></AdminTableCell></AdminTableRow>)}
          </AdminTable>
        </AdminCard>
        <KnowledgeTermForm initial={initial} categories={categories.map(({ id, name }) => ({ id, name }))} />
      </div>
    </>
  );
}
