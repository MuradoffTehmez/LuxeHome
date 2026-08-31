import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LOCALES } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { deleteEntityProfile, saveEntityProfile } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.seoEntityManagement") };
} export const dynamic = "force-dynamic";
export default async function EntityAdminPage() {
  const t = await getAdminT();
  const entries = await prisma.entityProfile.findMany({ orderBy: [{ entityType: "asc" }, { name: "asc" }] });
  return <><AdminPageHeader title={t("pages.serp.entityManagement")} description={t("pages.serp.organizationOfficeAgentVe")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.entityLer") }]} />
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]"><AdminForm action={saveEntityProfile} submitLabel={t("pages.serp.entitySaxla")}><FormSection title={t("pages.serp.semanticEntity")}>
    <AdminInput name="entityType" label={t("pages.serp.entityTipi")} placeholder={t("pages.serp.organizationOfficeAgent")} required /><AdminSelect name="locale" label={t("pages.serp.dil")} defaultValue="az" options={Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }))} />
    <AdminInput name="entityId" label={t("pages.serp.bagliDbId")} /><AdminInput name="slug" label={t("pages.serp.slug")} required /><AdminInput name="name" label={t("pages.serp.ad")} required /><AdminInput name="legalName" label={t("pages.serp.huquqiAd")} />
    <AdminInput name="schemaType" label={t("pages.serp.schemaOrgTipi")} placeholder={t("pages.serp.organization")} required /><AdminCheckbox name="isPublic" label={t("pages.serp.publicEntity")} />
    <FullWidth><AdminTextarea name="description" label={t("pages.serp.tesvir")} rows={5} /></FullWidth><FullWidth><AdminTextarea name="dataJson" label={t("pages.serp.strukturFaktlarJson")} defaultValue="{}" rows={8} /></FullWidth>
  </FormSection></AdminForm><section className="rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">{t("pages.serp.entityGraph")}</h2><p className="text-sm text-ink-muted">{entries.length} profil</p></header><ul className="divide-y divide-line">{entries.map((entry) => <li key={entry.id} className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-medium text-ink">{entry.name}</p><p className="truncate text-xs text-ink-muted">{entry.entityType} → {entry.schemaType} · {entry.locale.toUpperCase()}</p><p className="mt-1 text-xs text-ink-soft">{entry.isPublic ? "Public" : "Private draft"} · /{entry.slug}</p></div><ConfirmAction action={deleteEntityProfile} id={entry.id} label={t("pages.serp.entitySil")} title={t("pages.serp.entitySilinsin")} description={t("pages.serp.semanticRegistryQeydiSilinecek")}><Trash2 className="size-4" /></ConfirmAction></li>)}{entries.length === 0 && <li className="p-5 text-sm text-ink-muted">{t("pages.serp.manualEntityYoxdurKod")}</li>}</ul></section></div></>;
}

