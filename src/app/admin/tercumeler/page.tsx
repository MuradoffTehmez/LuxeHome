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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.translations.tercumeler") };
}
export const dynamic = "force-dynamic";

const entityLabels = (t: Awaited<ReturnType<typeof getAdminT>>): Record<string, string> => ({ PROPERTY: t("pages.misc.emlak"), PROJECT: t("pages.misc.layihe"), SERVICE: t("pages.misc.xidmet"), BLOG_POST: t("pages.misc.bloq"), KNOWLEDGE_ARTICLE: t("pages.misc.beledci"), KNOWLEDGE_TERM: t("pages.misc.termin"), KNOWLEDGE_FAQ: t("pages.misc.sual") });

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
    ...properties.map((item) => ({ value: `PROPERTY:${item.id}`, label: t("pages.common.emlak", { p0: item.title }) })),
    ...projects.map((item) => ({ value: `PROJECT:${item.id}`, label: t("pages.common.layihe", { p0: item.name }) })),
    ...services.map((item) => ({ value: `SERVICE:${item.id}`, label: t("pages.common.xidmet", { p0: item.title }) })),
    ...posts.map((item) => ({ value: `BLOG_POST:${item.id}`, label: `Bloq · ${item.title}` })),
    ...guides.map((item) => ({ value: `KNOWLEDGE_ARTICLE:${item.id}`, label: t("pages.common.beledci", { p0: item.title }) })),
    ...terms.map((item) => ({ value: `KNOWLEDGE_TERM:${item.id}`, label: `Termin · ${item.term}` })),
    ...faqs.map((item) => ({ value: `KNOWLEDGE_FAQ:${item.id}`, label: `Sual · ${item.question}` })),
  ];
  const sourceNames = new Map(entities.map((item) => [item.value, item.label]));

  return (
    <>
      <AdminPageHeader title={t("pages.translations.strukturlasdirilmisTercumeler")} description={t("pages.translations.azMenbeKontentininEn")} breadcrumbs={[{ label: t("pages.translations.idarePaneli"), href: "/admin" }, { label: t("pages.translations.tercumeler") }]} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)]">
        <AdminCard title={current ? t("pages.misc.tercumeniRedakteEt") : t("pages.misc.yeniTercume")}>
          <TranslationForm key={current?.id ?? "new"} entities={entities} initial={current} />
        </AdminCard>
        <AdminCard title={t("pages.translations.tercumeJurnali")} description={t("pages.common.dilVersiyasi", { p0: translations.length })} bodyClassName="p-0">
          {translations.length === 0 ? <p className="p-6 text-sm text-ink-muted">{t("pages.translations.heleTercumeYaradilmayib")}</p> : (
            <AdminTable headers={[{ label: t("pages.translations.mezmun") }, { label: t("pages.translations.dil") }, { label: t("pages.translations.status") }, { label: t("pages.translations.emeliyyat"), srOnly: true }]}>
              {translations.map((item) => (
                <AdminTableRow key={item.id}>
                  <AdminTableCell className="max-w-72"><p className="truncate font-medium">{item.title || sourceNames.get(`${item.entityType}:${item.entityId}`) || entityLabels(t)[item.entityType]}</p><p className="mt-1 text-xs text-ink-muted">{sourceNames.get(`${item.entityType}:${item.entityId}`) || t("pages.common.silinmisMenbe", { p0: entityLabels(t)[item.entityType] })}</p></AdminTableCell>
                  <AdminTableCell className="uppercase">{item.locale}</AdminTableCell>
                  <AdminTableCell><Badge tone={item.status === "PUBLISHED" ? "success" : item.status === "READY" ? "warning" : "neutral"}>{t(`labels.translationStatus.${item.status as TranslationStatus}`) ?? item.status}</Badge></AdminTableCell>
                  <AdminTableCell align="right"><div className="flex justify-end"><Link href={`/admin/tercumeler?id=${item.id}`} aria-label={t("pages.translations.tercumeniRedakteEt")} className="grid size-11 place-items-center rounded-xs text-ink-muted hover:bg-beige hover:text-ink"><Pencil className="size-4" /></Link><ConfirmAction action={deleteTranslation} id={item.id} label={t("pages.translations.tercumeniSil")} title={t("pages.translations.tercumeniSilmek")} description={t("pages.translations.buDilVersiyasiSilinecek")}><Trash2 className="size-4" /></ConfirmAction></div></AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        </AdminCard>
      </div>
    </>
  );
}
