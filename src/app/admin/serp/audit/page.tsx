import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { resolveSeoAuditIssue, runSeoAudit } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.seoAuditEngine") };
} export const dynamic = "force-dynamic";
export default async function SeoAuditEnginePage() {
  const t = await getAdminT();
  const issues = await prisma.seoAuditIssue.findMany({ where: { status: "OPEN" }, orderBy: [{ severity: "asc" }, { detectedAt: "desc" }], take: 300 });
  const totals = Object.fromEntries(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].map((severity) => [severity, issues.filter((issue) => issue.severity === severity).length]));
  return <><AdminPageHeader title={t("pages.serp.seoAuditEngine")} description={t("pages.serp.metadataContentSchemaAlt")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.audit") }]} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Object.entries(totals).map(([severity, count]) => <div key={severity} className="rounded-md border border-line bg-paper p-4"><p className="text-xs font-semibold text-ink-muted">{severity}</p><p className="tabular mt-2 font-display text-3xl text-ink">{count}</p></div>)}</div>
    <AdminForm action={runSeoAudit} submitLabel={t("pages.serp.auditIIndiIse")} className="mt-6"><FormSection title={t("pages.serp.yeniAuditSnapshotU")} description={t("pages.serp.evvelkiAciqQeydlerHell")}><p className="sm:col-span-2 text-sm text-ink-soft">{t("pages.serp.auditPublicContentProjection")}</p></FormSection></AdminForm>
    <section className="mt-6 rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">{t("pages.serp.aciqProblemler")}</h2><p className="text-sm text-ink-muted">{issues.length} qeyd</p></header><ul className="divide-y divide-line">{issues.map((issue) => <li key={issue.id} className="grid gap-2 p-4 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center"><strong className="text-xs text-ink-muted">{issue.severity}</strong><div className="min-w-0"><p className="font-medium text-ink">{issue.type}</p><p className="text-sm text-ink-soft">{issue.message}</p><p className="truncate text-xs text-ink-muted">{issue.url}</p></div><ConfirmAction action={resolveSeoAuditIssue} id={issue.id} label={t("pages.serp.hellEdildiKimiIsarele")} title={t("pages.serp.problemHellEdilib")} description={t("pages.serp.qeydTarixcedeQalacaqStatusu")} confirmLabel={t("pages.serp.hellEdilib")} tone="neutral"><CheckCircle2 className="size-4" /></ConfirmAction></li>)}{issues.length === 0 && <li className="p-6 text-sm text-ink-muted">{t("pages.serp.aciqAuditProblemiYoxdur")}</li>}</ul></section>
  </>;
}

