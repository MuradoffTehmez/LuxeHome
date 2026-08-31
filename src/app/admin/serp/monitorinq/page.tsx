import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { resolveSeoAlert } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.serpMonitorinq") };
}
export const dynamic = "force-dynamic";
export default async function SerpMonitoringPage() {
  const t = await getAdminT();
  const [keywords, alerts, recent] = await Promise.all([
    prisma.seoKeyword.findMany({ where: { currentPosition: { not: null } }, orderBy: [{ priority: "asc" }, { currentPosition: "asc" }], take: 100 }),
    prisma.seoAlert.findMany({ where: { status: "OPEN" }, orderBy: { detectedAt: "desc" }, take: 100 }),
    prisma.seoSearchMetric.findMany({ orderBy: { date: "desc" }, take: 200 }),
  ]);
  const clicks = recent.reduce((sum, item) => sum + item.clicks, 0);
  return <><AdminPageHeader title={t("pages.serp.serpMonitorinq")} description={t("pages.serp.keywordMovqeleriSearchConsole")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.monitorinq") }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title={t("pages.serp.aciqXeberdarliqlar")} description={`${alerts.length} alert`}><ul className="divide-y divide-line">{alerts.map((alert) => <li key={alert.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="font-medium text-ink">{alert.message}</p><p className="text-xs text-ink-muted">{alert.severity} · {alert.detectedAt.toISOString()}</p></div><ConfirmAction action={resolveSeoAlert} id={alert.id} label={t("pages.serp.hellEdildi")} title={t("pages.serp.xeberdarliqBaglansin")} description={t("pages.serp.alertTarixcedeResolvedKimi")} confirmLabel={t("pages.serp.bagla")} tone="neutral"><CheckCircle2 className="size-4" /></ConfirmAction></li>)}{alerts.length === 0 && <li className="py-3 text-sm text-ink-muted">{t("pages.serp.aciqKritikXeberdarliqYoxdur")}</li>}</ul></AdminCard>
      <AdminCard title={t("pages.serp.rankSnapshot")} description={t("pages.common.olculenKeywordSonKlik", { p0: keywords.length, p1: clicks })}><ul className="divide-y divide-line">{keywords.map((item) => <li key={item.id} className="grid grid-cols-[1fr_auto] gap-3 py-3"><div><p className="font-medium text-ink">{item.keyword}</p><p className="text-xs text-ink-muted">{item.targetUrl} · {item.cluster}</p></div><strong className="tabular text-ink">#{item.currentPosition?.toFixed(1)}</strong></li>)}{keywords.length === 0 && <li className="py-3 text-sm text-ink-muted">{t("pages.serp.olculmusKeywordMovqeyiYoxdur")}</li>}</ul></AdminCard></div>
  </>;
}
