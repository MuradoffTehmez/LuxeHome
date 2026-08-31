import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { resolveSeoAuditIssue, runSeoAudit } from "../actions";

export const metadata: Metadata = { title: "SEO audit engine" }; export const dynamic = "force-dynamic";
export default async function SeoAuditEnginePage() {
  const issues = await prisma.seoAuditIssue.findMany({ where: { status: "OPEN" }, orderBy: [{ severity: "asc" }, { detectedAt: "desc" }], take: 300 });
  const totals = Object.fromEntries(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].map((severity) => [severity, issues.filter((issue) => issue.severity === severity).length]));
  return <><AdminPageHeader title="SEO audit engine" description="Metadata, content, schema, alt, orphan, 404 və redirect chain problemlərini periodik snapshot kimi saxlayır." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Audit" }]} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Object.entries(totals).map(([severity, count]) => <div key={severity} className="rounded-md border border-line bg-paper p-4"><p className="text-xs font-semibold text-ink-muted">{severity}</p><p className="tabular mt-2 font-display text-3xl text-ink">{count}</p></div>)}</div>
    <AdminForm action={runSeoAudit} submitLabel="Audit-i indi işə sal" className="mt-6"><FormSection title="Yeni audit snapshot-u" description="Əvvəlki açıq qeydlər həll olunmuş kimi bağlanır, cari problemlər yenidən yaradılır."><p className="sm:col-span-2 text-sm text-ink-soft">Audit public content projection-u və aktiv redirect qrafını eyni anda yoxlayır.</p></FormSection></AdminForm>
    <section className="mt-6 rounded-md border border-line bg-paper"><header className="border-b border-line p-4"><h2 className="font-display text-lg text-ink">Açıq problemlər</h2><p className="text-sm text-ink-muted">{issues.length} qeyd</p></header><ul className="divide-y divide-line">{issues.map((issue) => <li key={issue.id} className="grid gap-2 p-4 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center"><strong className="text-xs text-ink-muted">{issue.severity}</strong><div className="min-w-0"><p className="font-medium text-ink">{issue.type}</p><p className="text-sm text-ink-soft">{issue.message}</p><p className="truncate text-xs text-ink-muted">{issue.url}</p></div><ConfirmAction action={resolveSeoAuditIssue} id={issue.id} label="Həll edildi kimi işarələ" title="Problem həll edilib?" description="Qeyd tarixçədə qalacaq, statusu RESOLVED olacaq." confirmLabel="Həll edilib" tone="neutral"><CheckCircle2 className="size-4" /></ConfirmAction></li>)}{issues.length === 0 && <li className="p-6 text-sm text-ink-muted">Açıq audit problemi yoxdur.</li>}</ul></section>
  </>;
}

