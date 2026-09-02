import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { EmptyState } from "@/components/ui/states";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getSeoAuditItems } from "@/lib/queries";
import type { SeoIssueSeverity } from "@/lib/seo-audit";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.seoAuditi") };
}
export const dynamic = "force-dynamic";

/** Etiketlər dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const metricLabels = (t: Awaited<ReturnType<typeof getAdminT>>) => ({
  indexable: t("pages.misc.indeksleneBilen"),
  sitemapEligible: t("pages.misc.sitemapUcunUygun"),
  completeMeta: t("pages.misc.tamMetaMelumati"),
  missingAlt: t("pages.misc.altMetniCatismir"),
  thinContent: t("pages.misc.nazikMezmun"),
  schemaReady: t("pages.misc.schemaUcunHazir"),
  orphanPages: t("pages.misc.daxiliLinksizSehife"),
});

const severityLabels = (t: Awaited<ReturnType<typeof getAdminT>>): Record<SeoIssueSeverity, string> => ({
  error: t("pages.misc.kritik"),
  warning: t("pages.misc.xeberdarliq"),
  info: t("pages.misc.melumat"),
});

const kindLabels = (t: Awaited<ReturnType<typeof getAdminT>>): Record<string, string> => ({
  property: t("pages.misc.emlak"),
  post: t("pages.misc.bloq"),
  project: t("pages.misc.layihe"),
  service: t("pages.misc.xidmet"),
});

type Props = { searchParams: Promise<{ severity?: string }> };

export default async function AdminSeoPage({ searchParams }: Props) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);
  const [{ metrics, issues }, query] = await Promise.all([getSeoAuditItems(), searchParams]);
  const selected = (["error", "warning", "info"] as const).includes(query.severity as SeoIssueSeverity)
    ? (query.severity as SeoIssueSeverity)
    : null;
  const visibleIssues = selected ? issues.filter((issue) => issue.severity === selected) : issues;

  return (
    <>
      <AdminPageHeader
        title={t("pages.serp.seoAuditi")}
        description={t("pages.serp.ictimaiEmlakLayiheXidmet")}
        breadcrumbs={[{ label: t("pages.serp.idarePaneli"), href: "/admin" }, { label: t("pages.serp.seoAuditi") }]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(metricLabels(t)) as Array<keyof ReturnType<typeof metricLabels>>).map((key) => (
          <div key={key} className="rounded-md border border-line bg-paper p-4">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{metricLabels(t)[key]}</p>
            <p className="tabular mt-2 font-display text-3xl text-ink">{metrics[key]}</p>
            {!["missingAlt", "thinContent", "orphanPages"].includes(key) && (
              <p className="mt-1 text-xs text-ink-muted">{t("pages.misc.cemiSehifeden", { p0: metrics.total })}</p>
            )}
          </div>
        ))}
      </div>

      <AdminCard title={t("pages.serp.askarEdilmisProblemler")} description={t("pages.misc.auditQeydSayi", { count: issues.length })} className="mt-6" bodyClassName="p-0">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          <Link href="/admin/seo" className={`inline-flex min-h-11 items-center rounded-xs border px-3 text-sm ${!selected ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-soft"}`}>{t("pages.serp.hamisi")}</Link>
          {(["error", "warning", "info"] as const).map((severity) => (
            <Link key={severity} href={`/admin/seo?severity=${severity}`} className={`inline-flex min-h-11 items-center rounded-xs border px-3 text-sm ${selected === severity ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-soft"}`}>
              {severityLabels(t)[severity]}
            </Link>
          ))}
        </div>

        {visibleIssues.length === 0 ? (
          <div className="p-5">
            <EmptyState title={t("pages.serp.buFiltrUzreProblem")} description={t("pages.serp.auditMeyarlariniKecenMezmun")} />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {visibleIssues.map((issue, index) => (
              <li key={`${issue.contentId}-${issue.code}-${index}`} className="grid min-w-0 gap-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                {issue.severity === "error" ? <AlertCircle className="size-5 text-danger" aria-hidden="true" /> : issue.severity === "warning" ? <AlertTriangle className="size-5 text-warning" aria-hidden="true" /> : <CheckCircle2 className="size-5 text-info" aria-hidden="true" />}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-muted">{kindLabels(t)[issue.kind]} · {severityLabels(t)[issue.severity]}</p>
                  <Link href={issue.adminPath} className="mt-1 block font-medium text-ink hover:text-gold-deep [overflow-wrap:anywhere]">{issue.title}</Link>
                  <p className="mt-1 text-sm text-ink-soft">{issue.message}</p>
                </div>
                <div className="flex gap-2 sm:justify-end">
                  <Link href={issue.adminPath} className="inline-flex min-h-11 items-center rounded-xs border border-line px-3 text-sm text-ink-soft hover:border-gold hover:text-gold-deep">{t("pages.serp.duzelt")}</Link>
                  <a href={issue.publicPath} target="_blank" rel="noreferrer" aria-label={t("pages.serp.ictimaiSehifeniAc")} className="grid size-11 place-items-center rounded-xs border border-line text-ink-soft hover:border-gold hover:text-gold-deep"><ExternalLink className="size-4" aria-hidden="true" /></a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </>
  );
}
