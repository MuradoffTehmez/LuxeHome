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

export const metadata: Metadata = { title: "SEO metadata" };
export const dynamic = "force-dynamic";

export default async function MetadataPage() {
  const entries = await prisma.seoMetadata.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  const entityOptions = Object.values(SEO_ENTITY_TYPES).map((value) => ({ value, label: value }));
  const localeOptions = Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }));
  return <>
    <AdminPageHeader title="Page SEO editor" description="Avtomatik metadata-nı yalnız lazım olan entity/locale üçün override edin; SERP önbaxışı form daxilində yenilənir." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Metadata" }]} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <AdminForm action={saveSeoMetadata} submitLabel="Metadata override saxla"><FormSection title="Metadata override" description="Entity ID route path, DB ID və ya sabit səhifə açarı ola bilər.">
        <AdminSelect name="entityType" label="Entity tipi" options={entityOptions} defaultValue="PAGE" />
        <AdminSelect name="locale" label="Dil" options={localeOptions} defaultValue="az" />
        <FullWidth><AdminInput name="entityId" label="Entity ID / route" placeholder="/haqqimizda" required /></FullWidth>
        <SeoFields titleName="title" descriptionName="description" fallbackTitle="Avtomatik səhifə başlığı" fallbackDescription="Səhifənin avtomatik yaradılan unikal meta təsviri burada görünəcək." pathname="/az/numune" />
        <FullWidth><AdminInput name="canonical" label="Canonical override" placeholder="Boş buraxılsa self-canonical" /></FullWidth>
        <AdminCheckbox name="robotsIndex" label="Index" defaultChecked />
        <AdminCheckbox name="robotsFollow" label="Follow" defaultChecked />
        <AdminInput name="ogTitle" label="OG başlıq" />
        <AdminInput name="ogImage" label="OG şəkil" />
        <FullWidth><AdminInput name="ogDescription" label="OG təsvir" /></FullWidth>
      </FormSection></AdminForm>
      <section className="rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">Saxlanmış override-lar</h2><p className="text-sm text-ink-muted">{entries.length} qeyd</p></header><ul className="divide-y divide-line">{entries.map((entry) => <li key={entry.id} className="flex min-w-0 items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="truncate font-medium text-ink">{entry.title || entry.entityId}</p><p className="truncate text-xs text-ink-muted">{entry.entityType} · {entry.locale.toUpperCase()} · {entry.entityId}</p><p className="mt-1 text-xs text-ink-soft">{entry.robotsIndex ? "index" : "noindex"}, {entry.robotsFollow ? "follow" : "nofollow"}</p></div><ConfirmAction action={deleteSeoMetadata} id={entry.id} label="Metadata override sil" title="Metadata override silinsin?" description="Səhifə yenidən avtomatik metadata istifadə edəcək."><Trash2 className="size-4" /></ConfirmAction></li>)}{entries.length === 0 && <li className="p-5 text-sm text-ink-muted">Override yoxdur; bütün səhifələr avtomatik generatoru istifadə edir.</li>}</ul></section>
    </div>
  </>;
}

