import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput } from "@/components/admin/form-fields";
import { importSearchMetric, syncSearchConsole } from "../actions";

export const metadata: Metadata = { title: "Search Console" }; export const dynamic = "force-dynamic";
export default async function SearchConsoleAdminPage() {
  const metrics = await prisma.seoSearchMetric.findMany({ orderBy: { date: "desc" }, take: 500 });
  const clicks = metrics.reduce((sum, item) => sum + item.clicks, 0), impressions = metrics.reduce((sum, item) => sum + item.impressions, 0);
  const weightedPosition = impressions ? metrics.reduce((sum, item) => sum + item.position * item.impressions, 0) / impressions : 0;
  const topQueries = [...metrics].sort((a, b) => b.clicks - a.clicks).slice(0, 20);
  return <><AdminPageHeader title="Google Search Console" description="API sync və ya CSV/manual import üçün lokal snapshot; clicks, impressions, CTR, mövqe, query/page/country/device ölçülür." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Search Console" }]} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Klik", clicks], ["Göstəriş", impressions], ["CTR", impressions ? `${((clicks/impressions)*100).toFixed(2)}%` : "0%"], ["Orta mövqe", weightedPosition.toFixed(1)]].map(([label, value]) => <div key={label} className="rounded-md border border-line bg-paper p-4"><p className="text-xs text-ink-muted">{label}</p><p className="tabular mt-2 font-display text-3xl text-ink">{value}</p></div>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"><div className="space-y-6"><AdminForm action={syncSearchConsole} submitLabel="GSC API-dən sinxronlaşdır"><FormSection title="API sync" description="OAuth access token secret-dən oxunur; top 25 000 sətir gətirilir."><AdminInput name="startDate" label="Başlanğıc" type="date"/><AdminInput name="endDate" label="Son" type="date"/><p className="sm:col-span-2 text-xs text-ink-muted">Tarixlər boş qalarsa son tamamlanmış 28 gün götürülür.</p></FormSection></AdminForm><AdminForm action={importSearchMetric} submitLabel="Metrikanı idxal et"><FormSection title="Manual GSC sətri"><AdminInput name="date" label="Tarix" type="date" required/><AdminInput name="query" label="Sorğu"/><AdminInput name="page" label="Səhifə"/><AdminInput name="country" label="Ölkə" placeholder="AZE"/><AdminInput name="device" label="Cihaz" placeholder="MOBILE"/><AdminInput name="clicks" label="Klik" type="number" min={0}/><AdminInput name="impressions" label="Göstəriş" type="number" min={0}/><AdminInput name="ctr" label="CTR (0–1)" type="number" min={0} max={1} step="0.0001"/><AdminInput name="position" label="Mövqe" type="number" min={0} step="0.1"/></FormSection></AdminForm></div>
    <section className="overflow-hidden rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">Ən çox klik alan sorğular</h2></header><ul className="divide-y divide-line">{topQueries.map((item) => <li key={item.id} className="grid gap-1 p-3 sm:grid-cols-[minmax(0,1fr)_90px_90px_80px]"><span className="truncate text-sm text-ink">{item.query || "(sorğu ölçüsü yoxdur)"}</span><span className="tabular text-sm text-ink-soft">{item.clicks} klik</span><span className="tabular text-sm text-ink-soft">{item.impressions} imp.</span><span className="tabular text-sm text-ink-soft">#{item.position.toFixed(1)}</span></li>)}{topQueries.length === 0 && <li className="p-5 text-sm text-ink-muted">GSC məlumatı hələ sinxronlaşdırılmayıb.</li>}</ul></section></div>
  </>;
}
