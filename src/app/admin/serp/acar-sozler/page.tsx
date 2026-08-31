import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LOCALES, SEO_INTENTS } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { deleteSeoKeyword, saveSeoKeyword } from "../actions";

export const metadata: Metadata = { title: "Keyword cluster" }; export const dynamic = "force-dynamic";
export default async function KeywordAdminPage() {
  const entries = await prisma.seoKeyword.findMany({ orderBy: [{ priority: "asc" }, { cluster: "asc" }, { keyword: "asc" }], take: 500 });
  return <><AdminPageHeader title="Keyword cluster management" description="Intent, cluster, hədəf URL və mövqe bir xəritədə; gələcək rank API üçün sabit data modeli." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Keyword-lər" }]} />
  <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"><AdminForm action={saveSeoKeyword} submitLabel="Keyword saxla"><FormSection title="Keyword">
    <AdminInput name="keyword" label="Keyword" required /><AdminSelect name="locale" label="Dil" defaultValue="az" options={Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }))} />
    <AdminSelect name="intent" label="Intent" defaultValue="TRANSACTIONAL" options={Object.values(SEO_INTENTS).map((value) => ({ value, label: value }))} /><AdminInput name="cluster" label="Cluster" required />
    <AdminInput name="targetUrl" label="Hədəf URL" placeholder="/az/bakida-satilan-menziller" required /><AdminInput name="priority" label="Prioritet (1–5)" type="number" min={1} max={5} defaultValue={3} />
    <AdminInput name="searchVolume" label="Axtarış həcmi" type="number" min={0} /><AdminInput name="currentPosition" label="Cari mövqe" type="number" min={0.1} step="0.1" />
  </FormSection></AdminForm><section className="overflow-hidden rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">Keyword xəritəsi</h2><p className="text-sm text-ink-muted">{entries.length} sorğu</p></header><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-beige text-xs uppercase text-ink-muted"><tr><th className="p-3">Keyword</th><th className="p-3">Intent / cluster</th><th className="p-3">Target</th><th className="p-3">Həcm</th><th className="p-3">Mövqe</th><th className="p-3"><span className="sr-only">Əməl</span></th></tr></thead><tbody className="divide-y divide-line">{entries.map((entry) => <tr key={entry.id}><td className="p-3 font-medium text-ink">{entry.keyword}<span className="ml-2 text-xs text-ink-muted">{entry.locale.toUpperCase()}</span></td><td className="p-3 text-ink-soft">{entry.intent}<br/><span className="text-xs text-ink-muted">{entry.cluster} · P{entry.priority}</span></td><td className="p-3 text-ink-soft">{entry.targetUrl}</td><td className="tabular p-3">{entry.searchVolume ?? "—"}</td><td className="tabular p-3">{entry.currentPosition?.toFixed(1) ?? "—"}</td><td className="p-1"><ConfirmAction action={deleteSeoKeyword} id={entry.id} label="Keyword sil" title="Keyword silinsin?" description="Tarixi keyword xəritəsindən çıxacaq."><Trash2 className="size-4" /></ConfirmAction></td></tr>)}</tbody></table></div></section></div></>;
}

