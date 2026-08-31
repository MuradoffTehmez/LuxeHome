import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LOCALES } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminCheckbox, AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { deleteEntityProfile, saveEntityProfile } from "../actions";

export const metadata: Metadata = { title: "SEO entity management" }; export const dynamic = "force-dynamic";
export default async function EntityAdminPage() {
  const entries = await prisma.entityProfile.findMany({ orderBy: [{ entityType: "asc" }, { name: "asc" }] });
  return <><AdminPageHeader title="Entity management" description="Organization, office, agent və agency haqqında semantik faktların locale-səviyyəli vahid registry-si." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Entity-lər" }]} />
  <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]"><AdminForm action={saveEntityProfile} submitLabel="Entity saxla"><FormSection title="Semantic entity">
    <AdminInput name="entityType" label="Entity tipi" placeholder="ORGANIZATION / OFFICE / AGENT" required /><AdminSelect name="locale" label="Dil" defaultValue="az" options={Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }))} />
    <AdminInput name="entityId" label="Bağlı DB ID" /><AdminInput name="slug" label="Slug" required /><AdminInput name="name" label="Ad" required /><AdminInput name="legalName" label="Hüquqi ad" />
    <AdminInput name="schemaType" label="Schema.org tipi" placeholder="Organization" required /><AdminCheckbox name="isPublic" label="Public entity" />
    <FullWidth><AdminTextarea name="description" label="Təsvir" rows={5} /></FullWidth><FullWidth><AdminTextarea name="dataJson" label="Struktur faktlar (JSON)" defaultValue="{}" rows={8} /></FullWidth>
  </FormSection></AdminForm><section className="rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">Entity graph</h2><p className="text-sm text-ink-muted">{entries.length} profil</p></header><ul className="divide-y divide-line">{entries.map((entry) => <li key={entry.id} className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-medium text-ink">{entry.name}</p><p className="truncate text-xs text-ink-muted">{entry.entityType} → {entry.schemaType} · {entry.locale.toUpperCase()}</p><p className="mt-1 text-xs text-ink-soft">{entry.isPublic ? "Public" : "Private draft"} · /{entry.slug}</p></div><ConfirmAction action={deleteEntityProfile} id={entry.id} label="Entity sil" title="Entity silinsin?" description="Semantic registry qeydi silinəcək."><Trash2 className="size-4" /></ConfirmAction></li>)}{entries.length === 0 && <li className="p-5 text-sm text-ink-muted">Manual entity yoxdur; kod və domen modelləri avtomatik schema yaradır.</li>}</ul></section></div></>;
}

