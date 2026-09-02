import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LOCALES, SEO_ENTITY_TYPES } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, FullWidth } from "@/components/admin/form-fields";
import { SeoFields } from "@/components/admin/seo-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { deleteSeoMetadata, saveSeoMetadata } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.seoMetadata") };
}
export const dynamic = "force-dynamic";

export default async function MetadataPage() {
  const t = await getAdminT();
  const entries = await prisma.seoMetadata.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  const entityOptions = Object.values(SEO_ENTITY_TYPES).map((value) => ({ value, label: value }));
  const localeOptions = Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }));
  return <>
    <AdminPageHeader title={t("pages.serp.pageSeoEditor")} description={t("pages.serp.avtomatikMetadataNiYalniz")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: "Metadata" }]} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <AdminForm action={saveSeoMetadata} submitLabel={t("pages.serp.metadataOverrideSaxla")}><FormSection title={t("pages.serp.metadataOverride")} description={t("pages.serp.entityIdRoutePath")}>
        <AdminSelect name="entityType" label={t("pages.serp.entityTipi")} options={entityOptions} defaultValue="PAGE" />
        <AdminSelect name="locale" label={t("pages.serp.dil")} options={localeOptions} defaultValue="az" />
        <FullWidth><AdminInput name="entityId" label={t("pages.serp.entityIdRoute")} placeholder="/haqqimizda" required /></FullWidth>
        <SeoFields titleName="title" descriptionName="description" fallbackTitle={t("pages.misc.avtomatikSehifeBasligi")} fallbackDescription={t("pages.misc.sehifeninAvtomatikYaradilanUnikal")} pathname="/az/numune" />
        <FullWidth><AdminInput name="canonical" label={t("pages.serp.canonicalOverride")} placeholder={t("pages.serp.bosBuraxilsaSelfCanonical")} /></FullWidth>
        <AdminCheckbox name="robotsIndex" label={t("pages.serp.index")} defaultChecked />
        <AdminCheckbox name="robotsFollow" label={t("pages.serp.follow")} defaultChecked />
        <AdminInput name="ogTitle" label={t("pages.serp.ogBasliq")} />
        <AdminInput name="ogImage" label={t("pages.serp.ogSekil")} />
        <FullWidth><AdminInput name="ogDescription" label={t("pages.serp.ogTesvir")} /></FullWidth>
      </FormSection></AdminForm>
      <section className="rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">{t("pages.serp.saxlanmisOverrideLar")}</h2><p className="text-sm text-ink-muted">{t("pages.misc.qeydSayi", { count: entries.length })}</p></header><ul className="divide-y divide-line">{entries.map((entry) => <li key={entry.id} className="flex min-w-0 items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="truncate font-medium text-ink">{entry.title || entry.entityId}</p><p className="truncate text-xs text-ink-muted">{entry.entityType} · {entry.locale.toUpperCase()} · {entry.entityId}</p><p className="mt-1 text-xs text-ink-soft">{entry.robotsIndex ? "index" : "noindex"}, {entry.robotsFollow ? "follow" : "nofollow"}</p></div><ConfirmAction action={deleteSeoMetadata} id={entry.id} label={t("pages.serp.metadataOverrideSil")} title={t("pages.serp.metadataOverrideSilinsin")} description={t("pages.serp.sehifeYenidenAvtomatikMetadata")}><Trash2 className="size-4" /></ConfirmAction></li>)}{entries.length === 0 && <li className="p-5 text-sm text-ink-muted">{t("pages.serp.overrideYoxdurButunSehifeler")}</li>}</ul></section>
    </div>
  </>;
}
