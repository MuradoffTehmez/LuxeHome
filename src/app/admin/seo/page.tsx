import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/ui/states";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getSeoAuditItems } from "@/lib/queries";
import type { SeoIssueSeverity } from "@/lib/seo-audit";

export const metadata: Metadata = { title: "SEO auditı" };
export const dynamic = "force-dynamic";

const METRIC_LABELS = {
  indexable: "İndekslənə bilən",
  sitemapEligible: "Sitemap üçün uyğun",
  completeMeta: "Tam meta məlumatı",
  missingAlt: "Alt mətni çatışmır",
  thinContent: "Nazik məzmun",
  schemaReady: "Schema üçün hazır",
  orphanPages: "Daxili linksiz səhifə",
} as const;

const SEVERITY_LABELS: Record<SeoIssueSeverity, string> = {
  error: "Kritik",
  warning: "Xəbərdarlıq",
  info: "Məlumat",
};

const KIND_LABELS = {
  property: "Əmlak",
  post: "Bloq",
  project: "Layihə",
  service: "Xidmət",
} as const;

type Props = { searchParams: Promise<{ severity?: string }> };

export default async function AdminSeoPage({ searchParams }: Props) {
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const [{ metrics, issues }, query] = await Promise.all([getSeoAuditItems(), searchParams]);
  const selected = (["error", "warning", "info"] as const).includes(query.severity as SeoIssueSeverity)
    ? (query.severity as SeoIssueSeverity)
    : null;
  const visibleIssues = selected ? issues.filter((issue) => issue.severity === selected) : issues;

  return (
    <>
      <AdminPageHeader
        title="SEO auditı"
        description="İctimai əmlak, layihə, xidmət və bloq səhifələrinin indeks, meta, məzmun, şəkil və schema hazırlığını vahid yerdə izləyin."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "SEO auditı" }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>).map((key) => (
          <div key={key} className="rounded-md border border-line bg-paper p-4">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{METRIC_LABELS[key]}</p>
            <p className="tabular mt-2 font-display text-3xl text-ink">{metrics[key]}</p>
            {!["missingAlt", "thinContent", "orphanPages"].includes(key) && (
              <p className="mt-1 text-xs text-ink-muted">cəmi {metrics.total} səhifədən</p>
            )}
          </div>
        ))}
      </div>

      <AdminCard title="Aşkar edilmiş problemlər" description={`${issues.length} audit qeydi`} className="mt-6" bodyClassName="p-0">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          <Link href="/admin/seo" className={`inline-flex min-h-11 items-center rounded-xs border px-3 text-sm ${!selected ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-soft"}`}>Hamısı</Link>
          {(["error", "warning", "info"] as const).map((severity) => (
            <Link key={severity} href={`/admin/seo?severity=${severity}`} className={`inline-flex min-h-11 items-center rounded-xs border px-3 text-sm ${selected === severity ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-soft"}`}>
              {SEVERITY_LABELS[severity]}
            </Link>
          ))}
        </div>

        {visibleIssues.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Bu filtr üzrə problem yoxdur" description="Audit meyarlarını keçən məzmun burada qeyd yaratmır." />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {visibleIssues.map((issue, index) => (
              <li key={`${issue.contentId}-${issue.code}-${index}`} className="grid min-w-0 gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                {issue.severity === "error" ? <AlertCircle className="size-5 text-danger" aria-hidden="true" /> : issue.severity === "warning" ? <AlertTriangle className="size-5 text-warning" aria-hidden="true" /> : <CheckCircle2 className="size-5 text-info" aria-hidden="true" />}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-muted">{KIND_LABELS[issue.kind]} · {SEVERITY_LABELS[issue.severity]}</p>
                  <Link href={issue.adminPath} className="mt-1 block font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">{issue.title}</Link>
                  <p className="mt-1 text-sm text-ink-soft">{issue.message}</p>
                </div>
                <div className="flex gap-2 sm:justify-end">
                  <Link href={issue.adminPath} className="inline-flex min-h-11 items-center rounded-xs border border-line px-3 text-sm text-ink-soft hover:border-gold hover:text-gold-deep">Düzəlt</Link>
                  <a href={issue.publicPath} target="_blank" rel="noreferrer" aria-label="İctimai səhifəni aç" className="grid size-11 place-items-center rounded-xs border border-line text-ink-soft hover:border-gold hover:text-gold-deep"><ExternalLink className="size-4" aria-hidden="true" /></a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
