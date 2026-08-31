import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "SERP və SEO" };
export const dynamic = "force-dynamic";

export default async function SerpOverviewPage() {
  const [metadataCount, landingCount, keywordCount, entityCount, openIssues, redirects, notFound, searchMetrics] = await Promise.all([
    prisma.seoMetadata.count(), prisma.seoLandingPage.count(), prisma.seoKeyword.count(), prisma.entityProfile.count(),
    prisma.seoAuditIssue.count({ where: { status: "OPEN" } }), prisma.redirect.count({ where: { isActive: true } }),
    prisma.notFoundHit.count(), prisma.seoSearchMetric.count(),
  ]);
  const metrics = [
    ["Metadata override", metadataCount, "/admin/serp/metadata"], ["Landing səhifə", landingCount, "/admin/serp/landingler"],
    ["Keyword", keywordCount, "/admin/serp/acar-sozler"], ["Semantic entity", entityCount, "/admin/serp/entities"],
    ["Açıq audit problemi", openIssues, "/admin/serp/audit"], ["Aktiv redirect", redirects, "/admin/redirects"],
    ["404 URL", notFound, "/admin/redirects#not-found"], ["Search Console sətri", searchMetrics, "/admin/serp/search-console"],
  ] as const;
  return <>
    <AdminPageHeader title="SERP və SEO" description="İndekslənmə, entity, landing, metadata, monitorinq və organic conversion qatının vahid idarəetmə mərkəzi." breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "SERP və SEO" }]} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, href]) => <Link key={label} href={href} className="rounded-md border border-line bg-paper p-4 hover:border-gold"><p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p><p className="tabular mt-2 font-display text-3xl text-ink">{value}</p></Link>)}</div>
    <AdminCard title="Əməliyyat ardıcıllığı" description="PRD qəbul qapısı" className="mt-6"><ol className="grid gap-3 text-sm text-ink-soft md:grid-cols-3"><li className="rounded-xs border border-line p-4"><strong className="text-ink">1. Keyfiyyət</strong><p className="mt-1">Audit və publish validator ilə səhvləri bağlayın.</p></li><li className="rounded-xs border border-line p-4"><strong className="text-ink">2. Discovery</strong><p className="mt-1">Landing, entity və internal link xəritəsini dərc edin.</p></li><li className="rounded-xs border border-line p-4"><strong className="text-ink">3. Ölçmə</strong><p className="mt-1">GSC, analytics və conversion atribusiyasını izləyin.</p></li></ol></AdminCard>
  </>;
}

