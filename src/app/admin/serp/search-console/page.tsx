import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput } from "@/components/admin/form-fields";
import { importSearchMetric, syncSearchConsole } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.searchConsole") };
} export const dynamic = "force-dynamic";
export default async function SearchConsoleAdminPage() {
  const t = await getAdminT();
  const metrics = await prisma.seoSearchMetric.findMany({ orderBy: { date: "desc" }, take: 500 });
  const clicks = metrics.reduce((sum, item) => sum + item.clicks, 0), impressions = metrics.reduce((sum, item) => sum + item.impressions, 0);
  const weightedPosition = impressions ? metrics.reduce((sum, item) => sum + item.position * item.impressions, 0) / impressions : 0;
  const topQueries = [...metrics].sort((a, b) => b.clicks - a.clicks).slice(0, 20);
  return <><AdminPageHeader title={t("pages.serp.googleSearchConsole")} description={t("pages.serp.apiSyncVeYa")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.searchConsole") }]} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Klik", clicks], ["Göstəriş", impressions], ["CTR", impressions ? `${((clicks/impressions)*100).toFixed(2)}%` : "0%"], ["Orta mövqe", weightedPosition.toFixed(1)]].map(([label, value]) => <div key={label} className="rounded-md border border-line bg-paper p-4"><p className="text-xs text-ink-muted">{label}</p><p className="tabular mt-2 font-display text-3xl text-ink">{value}</p></div>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"><div className="space-y-6"><AdminForm action={syncSearchConsole} submitLabel={t("pages.serp.gscApiDenSinxronlasdir")}><FormSection title={t("pages.serp.apiSync")} description={t("pages.serp.oauthAccessTokenSecret")}><AdminInput name="startDate" label={t("pages.serp.baslangic")} type="date"/><AdminInput name="endDate" label={t("pages.serp.son")} type="date"/><p className="sm:col-span-2 text-xs text-ink-muted">{t("pages.serp.tarixlerBosQalarsaSon")}</p></FormSection></AdminForm><AdminForm action={importSearchMetric} submitLabel={t("pages.serp.metrikaniIdxalEt")}><FormSection title={t("pages.serp.manualGscSetri")}><AdminInput name="date" label={t("pages.serp.tarix")} type="date" required/><AdminInput name="query" label={t("pages.serp.sorgu")}/><AdminInput name="page" label={t("pages.serp.sehife")}/><AdminInput name="country" label={t("pages.serp.olke")} placeholder="AZE"/><AdminInput name="device" label={t("pages.serp.cihaz")} placeholder="MOBILE"/><AdminInput name="clicks" label={t("pages.serp.klik")} type="number" min={0}/><AdminInput name="impressions" label={t("pages.serp.gosteris")} type="number" min={0}/><AdminInput name="ctr" label={t("pages.serp.ctr01")} type="number" min={0} max={1} step="0.0001"/><AdminInput name="position" label={t("pages.serp.movqe")} type="number" min={0} step="0.1"/></FormSection></AdminForm></div>
    <section className="overflow-hidden rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">{t("pages.serp.enCoxKlikAlan")}</h2></header><ul className="divide-y divide-line">{topQueries.map((item) => <li key={item.id} className="grid gap-1 p-3 sm:grid-cols-[minmax(0,1fr)_90px_90px_80px]"><span className="truncate text-sm text-ink">{item.query || "(sorğu ölçüsü yoxdur)"}</span><span className="tabular text-sm text-ink-soft">{item.clicks} klik</span><span className="tabular text-sm text-ink-soft">{item.impressions} imp.</span><span className="tabular text-sm text-ink-soft">#{item.position.toFixed(1)}</span></li>)}{topQueries.length === 0 && <li className="p-5 text-sm text-ink-muted">{t("pages.serp.gscMelumatiHeleSinxronlasdirilmayib")}</li>}</ul></section></div>
  </>;
}
