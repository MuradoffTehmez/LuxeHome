import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LOCALES, SEO_LANDING_STATUSES } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { deleteSeoLanding, saveSeoLanding } from "../actions";

export const metadata: Metadata = { title: "SEO landing səhifələri" };
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ edit?: string }> };

export default async function SeoLandingsAdminPage({ searchParams }: Props) {
  const { edit } = await searchParams;
  const [entries, current] = await Promise.all([
    prisma.seoLandingPage.findMany({ orderBy: [{ locale: "asc" }, { updatedAt: "desc" }] }),
    edit ? prisma.seoLandingPage.findUnique({ where: { id: edit } }) : null,
  ]);
  const localeOptions = Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }));
  const statusOptions = Object.values(SEO_LANDING_STATUSES).map((value) => ({ value, label: value }));
  return <>
    <AdminPageHeader title="SEO landing page engine" description="Yalnız real intent, unikal content və inventar həddini keçən filter kombinasiyalarını clean URL-ə çevirin." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Landinglər" }]} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
      <AdminForm action={saveSeoLanding} submitLabel={current ? "Landing-i yenilə" : "Landing yarat"} cancelHref={current ? "/admin/serp/landingler" : undefined}><FormSection title="Landing məlumatı" description="filtersJson public property query-sinə təhlükəsiz allowlist ilə map olunur.">
        {current && <input type="hidden" name="id" value={current.id} />}
        <AdminSelect name="locale" label="Dil" options={localeOptions} defaultValue={current?.locale ?? "az"} />
        <AdminSelect name="status" label="Status" options={statusOptions} defaultValue={current?.status ?? "DRAFT"} />
        <AdminInput name="name" label="Səhifə adı" defaultValue={current?.name ?? ""} required />
        <AdminInput name="slug" label="Slug" defaultValue={current?.slug ?? ""} required />
        <FullWidth><AdminInput name="title" label="SEO title" defaultValue={current?.title ?? ""} required /></FullWidth>
        <FullWidth><AdminInput name="h1" label="H1" defaultValue={current?.h1 ?? ""} required /></FullWidth>
        <FullWidth><AdminTextarea name="description" label="Meta description" defaultValue={current?.description ?? ""} rows={3} required /></FullWidth>
        <FullWidth><AdminTextarea name="introContent" label="Giriş content-i" defaultValue={current?.introContent ?? ""} rows={8} required /></FullWidth>
        <FullWidth><AdminTextarea name="bottomContent" label="Alt content" defaultValue={current?.bottomContent ?? ""} rows={6} /></FullWidth>
        <FullWidth><AdminTextarea name="filtersJson" label="Filter JSON" defaultValue={current?.filtersJson ?? '{"listingType":"SALE","citySlug":"baki"}'} rows={5} required /></FullWidth>
        <FullWidth><AdminTextarea name="faqJson" label="FAQ JSON" defaultValue={current?.faqJson ?? '[{"question":"Sual","answer":"Konkret cavab"}]'} rows={5} /></FullWidth>
        <FullWidth><AdminTextarea name="relatedPathsJson" label="Əlaqəli clean URL-lər (JSON)" defaultValue={current?.relatedPathsJson ?? '["/emlaklar"]'} rows={3} /></FullWidth>
        <AdminInput name="minInventory" label="Minimum inventar" type="number" min={1} max={100} defaultValue={current?.minInventory ?? 5} />
        <AdminInput name="canonical" label="Canonical override" defaultValue={current?.canonical ?? ""} />
        <AdminCheckbox name="indexable" label="İndekslənə bilər" defaultChecked={current?.indexable ?? false} />
        <AdminCheckbox name="indexEmpty" label="0 nəticədə manual index" defaultChecked={current?.indexEmpty ?? false} />
      </FormSection></AdminForm>
      <section className="rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">Landing registry</h2><p className="text-sm text-ink-muted">{entries.length} idarə olunan URL</p></header><ul className="divide-y divide-line">{entries.map((entry) => <li key={entry.id} className="flex items-center gap-2 p-4"><div className="min-w-0 flex-1"><p className="truncate font-medium text-ink">{entry.h1}</p><p className="truncate text-xs text-ink-muted">/{entry.locale}/{entry.slug} · {entry.status} · min {entry.minInventory}</p><p className="mt-1 text-xs text-ink-soft">{entry.indexable ? "index" : "noindex"}{entry.indexEmpty ? " · boş səhifəyə icazə" : ""}</p></div><Link href={`/admin/serp/landingler?edit=${entry.id}`} aria-label="Landing-i redaktə et" className="grid size-11 place-items-center rounded-xs text-ink-muted hover:bg-beige"><Pencil className="size-4" /></Link><ConfirmAction action={deleteSeoLanding} id={entry.id} label="Landing-i sil" title="Landing silinsin?" description="Clean public URL registry-dən çıxacaq."><Trash2 className="size-4" /></ConfirmAction></li>)}{entries.length === 0 && <li className="p-5 text-sm text-ink-muted">Hələ DB landing yaradılmayıb; kod registry-si işləməyə davam edir.</li>}</ul></section>
    </div>
  </>;
}
