import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LOCALES, SEO_INTENTS } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { deleteSeoKeyword, saveSeoKeyword } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.keywordCluster") };
} export const dynamic = "force-dynamic";
export default async function KeywordAdminPage() {
  const t = await getAdminT();
  const entries = await prisma.seoKeyword.findMany({ orderBy: [{ priority: "asc" }, { cluster: "asc" }, { keyword: "asc" }], take: 500 });
  return <><AdminPageHeader title={t("pages.serp.keywordClusterManagement")} description={t("pages.serp.intentClusterHedefUrl")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.keywordLer") }]} />
  <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"><AdminForm action={saveSeoKeyword} submitLabel={t("pages.serp.keywordSaxla")}><FormSection title={t("pages.serp.keyword")}>
    <AdminInput name="keyword" label={t("pages.serp.keyword")} required /><AdminSelect name="locale" label={t("pages.serp.dil")} defaultValue="az" options={Object.values(LOCALES).map((value) => ({ value, label: value.toUpperCase() }))} />
    <AdminSelect name="intent" label={t("pages.serp.intent")} defaultValue="TRANSACTIONAL" options={Object.values(SEO_INTENTS).map((value) => ({ value, label: value }))} /><AdminInput name="cluster" label={t("pages.serp.cluster")} required />
    <AdminInput name="targetUrl" label={t("pages.serp.hedefUrl")} placeholder="/az/bakida-satilan-menziller" required /><AdminInput name="priority" label={t("pages.serp.prioritet15")} type="number" min={1} max={5} defaultValue={3} />
    <AdminInput name="searchVolume" label={t("pages.serp.axtarisHecmi")} type="number" min={0} /><AdminInput name="currentPosition" label={t("pages.serp.cariMovqe")} type="number" min={0.1} step="0.1" />
  </FormSection></AdminForm><section className="overflow-hidden rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">{t("pages.serp.keywordXeritesi")}</h2><p className="text-sm text-ink-muted">{entries.length} sorğu</p></header><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-beige text-xs uppercase text-ink-muted"><tr><th className="p-3">{t("pages.serp.keyword")}</th><th className="p-3">{t("pages.serp.intentCluster")}</th><th className="p-3">{t("pages.serp.target")}</th><th className="p-3">{t("pages.serp.hecm")}</th><th className="p-3">{t("pages.serp.movqe")}</th><th className="p-3"><span className="sr-only">{t("pages.serp.emel")}</span></th></tr></thead><tbody className="divide-y divide-line">{entries.map((entry) => <tr key={entry.id}><td className="p-3 font-medium text-ink">{entry.keyword}<span className="ml-2 text-xs text-ink-muted">{entry.locale.toUpperCase()}</span></td><td className="p-3 text-ink-soft">{entry.intent}<br/><span className="text-xs text-ink-muted">{entry.cluster} · P{entry.priority}</span></td><td className="p-3 text-ink-soft">{entry.targetUrl}</td><td className="tabular p-3">{entry.searchVolume ?? "—"}</td><td className="tabular p-3">{entry.currentPosition?.toFixed(1) ?? "—"}</td><td className="p-1"><ConfirmAction action={deleteSeoKeyword} id={entry.id} label={t("pages.serp.keywordSil")} title={t("pages.serp.keywordSilinsin")} description={t("pages.serp.tarixiKeywordXeritesindenCixacaq")}><Trash2 className="size-4" /></ConfirmAction></td></tr>)}</tbody></table></div></section></div></>;
}

