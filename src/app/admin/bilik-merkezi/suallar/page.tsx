import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow, StatusBadge } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PERMISSIONS, type FaqCategory, type KnowledgeStatus } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminFaqEntries } from "@/lib/knowledge";
import { deleteFaqEntry } from "../actions";
import { FaqForm } from "../faq-form";
import { EMPTY_FAQ } from "../form-values";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.knowledge.faqIdaresi") };
}
export const dynamic = "force-dynamic";
const PATH = "/admin/bilik-merkezi/suallar";

export default async function AdminFaqPage({ searchParams }: { searchParams: Promise<{ duzelis?: string }> }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);
  const [{ duzelis }, entries] = await Promise.all([searchParams, getAdminFaqEntries()]);
  const editing = entries.find((item) => item.id === duzelis);
  const initial = editing ? { id: editing.id, question: editing.question, answer: editing.answer, category: editing.category, status: editing.status, order: editing.order } : EMPTY_FAQ;

  return (
    <>
      <AdminPageHeader title={t("pages.knowledge.suallarFaq")} description={t("pages.knowledge.publicFaqSehifesiniCms")} breadcrumbs={[{ label: t("pages.knowledge.idarePaneli"), href: "/admin" }, { label: t("pages.knowledge.bilikMerkezi"), href: "/admin/bilik-merkezi" }, { label: t("pages.knowledge.suallar") }]} />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <AdminCard bodyClassName="p-0">
          <AdminTable caption={t("pages.knowledge.faqSuallari")} headers={[{ label: t("pages.knowledge.sual") }, { label: t("pages.knowledge.kateqoriya") }, { label: t("pages.knowledge.status") }, { label: t("pages.knowledge.emeliyyatlar"), srOnly: true, className: "text-right" }]}>
            {entries.map((entry) => <AdminTableRow key={entry.id}><AdminTableCell className="max-w-96"><p className="font-medium">{entry.question}</p></AdminTableCell><AdminTableCell className="text-sm text-ink-soft">{t(`labels.faqCategory.${entry.category as FaqCategory}`) ?? entry.category}</AdminTableCell><AdminTableCell><StatusBadge status={entry.status as "DRAFT" | "PUBLISHED"} label={t(`labels.knowledgeStatus.${entry.status as KnowledgeStatus}`) ?? entry.status} /></AdminTableCell><AdminTableCell align="right"><div className="flex justify-end"><Link href={`${PATH}?duzelis=${entry.id}`} className="grid size-11 place-items-center text-ink-muted" aria-label={t("pages.common.sualiniRedakteEt", { p0: entry.question })}><Pencil className="size-4" /></Link><ConfirmAction action={deleteFaqEntry} id={entry.id} label={t("pages.common.sualiniSil", { p0: entry.question })} title={t("pages.knowledge.sualiSilmek")} description={t("pages.knowledge.sualFaqSehifesindenBirdefelik")} className="size-11"><Trash2 className="size-4" /></ConfirmAction></div></AdminTableCell></AdminTableRow>)}
          </AdminTable>
        </AdminCard>
        <FaqForm initial={initial} />
      </div>
    </>
  );
}
