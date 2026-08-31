import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type TranslationStatus } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { TranslationForm } from "./translation-form";
import { deleteTranslation } from "./actions";
import { getAdminT } from "@/lib/admin-i18n";

export const metadata: Metadata = { title: "Tərcümələr" };
export const dynamic = "force-dynamic";

const entityLabels: Record<string, string> = { PROPERTY: "Əmlak", PROJECT: "Layihə", SERVICE: "Xidmət", BLOG_POST: "Bloq", KNOWLEDGE_ARTICLE: "Bələdçi", KNOWLEDGE_TERM: "Termin", KNOWLEDGE_FAQ: "Sual" };

export default async function AdminTranslationsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.TRANSLATION_MANAGE);
  const { id } = await searchParams;
  const [translations, properties, projects, services, posts, guides, terms, faqs] = await Promise.all([
    prisma.contentTranslation.findMany({ orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.property.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.project.findMany({ where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.service.findMany({ select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
    prisma.blogPost.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.knowledgeArticle.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.knowledgeTerm.findMany({ select: { id: true, term: true }, orderBy: { term: "asc" }, take: 200 }),
    prisma.knowledgeFaq.findMany({ select: { id: true, question: true }, orderBy: { order: "asc" }, take: 200 }),
  ]);
  const current = id ? translations.find((item) => item.id === id) ?? null : null;
  const entities = [
    ...properties.map((item) => ({ value: `PROPERTY:${item.id}`, label: `Əmlak · ${item.title}` })),
    ...projects.map((item) => ({ value: `PROJECT:${item.id}`, label: `Layihə · ${item.name}` })),
    ...services.map((item) => ({ value: `SERVICE:${item.id}`, label: `Xidmət · ${item.title}` })),
    ...posts.map((item) => ({ value: `BLOG_POST:${item.id}`, label: `Bloq · ${item.title}` })),
    ...guides.map((item) => ({ value: `KNOWLEDGE_ARTICLE:${item.id}`, label: `Bələdçi · ${item.title}` })),
    ...terms.map((item) => ({ value: `KNOWLEDGE_TERM:${item.id}`, label: `Termin · ${item.term}` })),
    ...faqs.map((item) => ({ value: `KNOWLEDGE_FAQ:${item.id}`, label: `Sual · ${item.question}` })),
  ];
  const sourceNames = new Map(entities.map((item) => [item.value, item.label]));

  return (
    <>
      <AdminPageHeader title="Strukturlaşdırılmış tərcümələr" description="AZ mənbə kontentinin EN/RU versiyalarını qaralama, yoxlama və dərc mərhələləri ilə idarə edin." breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Tərcümələr" }]} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)]">
        <AdminCard title={current ? "Tərcüməni redaktə et" : "Yeni tərcümə"}>
          <TranslationForm key={current?.id ?? "new"} entities={entities} initial={current} />
        </AdminCard>
        <AdminCard title="Tərcümə jurnalı" description={`${translations.length} dil versiyası`} bodyClassName="p-0">
          {translations.length === 0 ? <p className="p-6 text-sm text-ink-muted">Hələ tərcümə yaradılmayıb.</p> : (
            <AdminTable headers={[{ label: "Məzmun" }, { label: "Dil" }, { label: "Status" }, { label: "Əməliyyat", srOnly: true }]}>
              {translations.map((item) => (
                <AdminTableRow key={item.id}>
                  <AdminTableCell className="max-w-72"><p className="truncate font-medium">{item.title || sourceNames.get(`${item.entityType}:${item.entityId}`) || entityLabels[item.entityType]}</p><p className="mt-1 text-xs text-ink-muted">{sourceNames.get(`${item.entityType}:${item.entityId}`) || `${entityLabels[item.entityType]} · silinmiş mənbə`}</p></AdminTableCell>
                  <AdminTableCell className="uppercase">{item.locale}</AdminTableCell>
                  <AdminTableCell><Badge tone={item.status === "PUBLISHED" ? "success" : item.status === "READY" ? "warning" : "neutral"}>{t(`labels.translationStatus.${item.status as TranslationStatus}`) ?? item.status}</Badge></AdminTableCell>
                  <AdminTableCell align="right"><div className="flex justify-end"><Link href={`/admin/tercumeler?id=${item.id}`} aria-label="Tərcüməni redaktə et" className="grid size-11 place-items-center rounded-xs text-ink-muted hover:bg-beige hover:text-ink"><Pencil className="size-4" /></Link><ConfirmAction action={deleteTranslation} id={item.id} label="Tərcüməni sil" title="Tərcüməni silmək" description="Bu dil versiyası silinəcək; mənbə Azərbaycan kontenti dəyişməyəcək."><Trash2 className="size-4" /></ConfirmAction></div></AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        </AdminCard>
      </div>
    </>
  );
}
