import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { resolveSeoAlert } from "../actions";

export const metadata: Metadata = { title: "SERP monitorinq" };
export const dynamic = "force-dynamic";
export default async function SerpMonitoringPage() {
  const [keywords, alerts, recent] = await Promise.all([
    prisma.seoKeyword.findMany({ where: { currentPosition: { not: null } }, orderBy: [{ priority: "asc" }, { currentPosition: "asc" }], take: 100 }),
    prisma.seoAlert.findMany({ where: { status: "OPEN" }, orderBy: { detectedAt: "desc" }, take: 100 }),
    prisma.seoSearchMetric.findMany({ orderBy: { date: "desc" }, take: 200 }),
  ]);
  const clicks = recent.reduce((sum, item) => sum + item.clicks, 0);
  return <><AdminPageHeader title="SERP monitorinq" description="Keyword mövqeləri, Search Console siqnalları və avtomatik kritik xəbərdarlıqlar." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Monitorinq" }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title="Açıq xəbərdarlıqlar" description={`${alerts.length} alert`}><ul className="divide-y divide-line">{alerts.map((alert) => <li key={alert.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="font-medium text-ink">{alert.message}</p><p className="text-xs text-ink-muted">{alert.severity} · {alert.detectedAt.toISOString()}</p></div><ConfirmAction action={resolveSeoAlert} id={alert.id} label="Həll edildi" title="Xəbərdarlıq bağlansın?" description="Alert tarixçədə resolved kimi qalacaq." confirmLabel="Bağla" tone="neutral"><CheckCircle2 className="size-4" /></ConfirmAction></li>)}{alerts.length === 0 && <li className="py-3 text-sm text-ink-muted">Açıq kritik xəbərdarlıq yoxdur.</li>}</ul></AdminCard>
      <AdminCard title="Rank snapshot" description={`${keywords.length} ölçülən keyword · ${clicks} son klik`}><ul className="divide-y divide-line">{keywords.map((item) => <li key={item.id} className="grid grid-cols-[1fr_auto] gap-3 py-3"><div><p className="font-medium text-ink">{item.keyword}</p><p className="text-xs text-ink-muted">{item.targetUrl} · {item.cluster}</p></div><strong className="tabular text-ink">#{item.currentPosition?.toFixed(1)}</strong></li>)}{keywords.length === 0 && <li className="py-3 text-sm text-ink-muted">Ölçülmüş keyword mövqeyi yoxdur.</li>}</ul></AdminCard></div>
  </>;
}
