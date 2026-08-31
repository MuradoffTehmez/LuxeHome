import { getAdminT } from "@/lib/admin-i18n";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.seoLandingSehifeleri") };
}
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ edit?: string }> };

export default async function SeoLandingsAdminPage({ searchParams }: Props) {
  const t = await getAdminT();
  const { edit } = await searchParams;
  const [entries, current] = await Promise.all([
    prisma.seoLandingPage.findMany({ orderBy: [{ locale: "asc" }, { updatedAt: "desc" }] }),
    edit ? prisma.seoLandingPage.findUnique({ where: { id: edit } }) : null,
  ]);
  const localeOptions = Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }));
  const statusOptions = Object.values(SEO_LANDING_STATUSES).map((value) => ({ value, label: value }));
  return <>
    <AdminPageHeader title={t("pages.serp.seoLandingPageEngine")} description={t("pages.serp.yalnizRealIntentUnikal")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.landingler") }]} />
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
      <AdminForm action={saveSeoLanding} submitLabel={current ? t("pages.misc.landingIYenile") : "Landing yarat"} cancelHref={current ? "/admin/serp/landingler" : undefined}><FormSection title={t("pages.serp.landingMelumati")} description={t("pages.serp.filtersjsonPublicPropertyQuery")}>
        {current && <input type="hidden" name="id" value={current.id} />}
        <AdminSelect name="locale" label={t("pages.serp.dil")} options={localeOptions} defaultValue={current?.locale ?? "az"} />
        <AdminSelect name="status" label={t("pages.serp.status")} options={statusOptions} defaultValue={current?.status ?? "DRAFT"} />
        <AdminInput name="name" label={t("pages.serp.sehifeAdi")} defaultValue={current?.name ?? ""} required />
        <AdminInput name="slug" label={t("pages.serp.slug")} defaultValue={current?.slug ?? ""} required />
        <FullWidth><AdminInput name="title" label={t("pages.serp.seoTitle")} defaultValue={current?.title ?? ""} required /></FullWidth>
        <FullWidth><AdminInput name="h1" label={t("pages.serp.h1")} defaultValue={current?.h1 ?? ""} required /></FullWidth>
        <FullWidth><AdminTextarea name="description" label={t("pages.serp.metaDescription")} defaultValue={current?.description ?? ""} rows={3} required /></FullWidth>
        <FullWidth><AdminTextarea name="introContent" label={t("pages.serp.girisContentI")} defaultValue={current?.introContent ?? ""} rows={8} required /></FullWidth>
        <FullWidth><AdminTextarea name="bottomContent" label={t("pages.serp.altContent")} defaultValue={current?.bottomContent ?? ""} rows={6} /></FullWidth>
        <FullWidth><AdminTextarea name="filtersJson" label={t("pages.serp.filterJson")} defaultValue={current?.filtersJson ?? '{"listingType":"SALE","citySlug":"baki"}'} rows={5} required /></FullWidth>
        <FullWidth><AdminTextarea name="faqJson" label={t("pages.serp.faqJson")} defaultValue={current?.faqJson ?? '[{"question":"Sual","answer":"Konkret cavab"}]'} rows={5} /></FullWidth>
        <FullWidth><AdminTextarea name="relatedPathsJson" label={t("pages.serp.elaqeliCleanUrlLer")} defaultValue={current?.relatedPathsJson ?? '["/emlaklar"]'} rows={3} /></FullWidth>
        <AdminInput name="minInventory" label={t("pages.serp.minimumInventar")} type="number" min={1} max={100} defaultValue={current?.minInventory ?? 5} />
        <AdminInput name="canonical" label={t("pages.serp.canonicalOverride")} defaultValue={current?.canonical ?? ""} />
        <AdminCheckbox name="indexable" label={t("pages.serp.indeksleneBiler")} defaultChecked={current?.indexable ?? false} />
        <AdminCheckbox name="indexEmpty" label={t("pages.serp.0NeticedeManualIndex")} defaultChecked={current?.indexEmpty ?? false} />
      </FormSection></AdminForm>
      <section className="rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">{t("pages.serp.landingRegistry")}</h2><p className="text-sm text-ink-muted">{t("pages.misc.idareOlunanUrl", { p0: entries.length })}</p></header><ul className="divide-y divide-line">{entries.map((entry) => <li key={entry.id} className="flex items-center gap-2 p-4"><div className="min-w-0 flex-1"><p className="truncate font-medium text-ink">{entry.h1}</p><p className="truncate text-xs text-ink-muted">/{entry.locale}/{entry.slug} · {entry.status} · min {entry.minInventory}</p><p className="mt-1 text-xs text-ink-soft">{entry.indexable ? "index" : "noindex"}{entry.indexEmpty ? t("pages.misc.bosSehifeyeIcaze") : ""}</p></div><Link href={`/admin/serp/landingler?edit=${entry.id}`} aria-label={t("pages.serp.landingIRedakteEt")} className="grid size-11 place-items-center rounded-xs text-ink-muted hover:bg-beige"><Pencil className="size-4" /></Link><ConfirmAction action={deleteSeoLanding} id={entry.id} label={t("pages.serp.landingISil")} title={t("pages.serp.landingSilinsin")} description={t("pages.serp.cleanPublicUrlRegistry")}><Trash2 className="size-4" /></ConfirmAction></li>)}{entries.length === 0 && <li className="p-5 text-sm text-ink-muted">{t("pages.serp.heleDbLandingYaradilmayib")}</li>}</ul></section>
    </div>
  </>;
}
