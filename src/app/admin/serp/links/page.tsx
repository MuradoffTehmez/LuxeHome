import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSeoAuditItems } from "@/lib/queries";
import { findRedirectChain } from "@/lib/serp";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Daxili və qırıq linklər" };
export const dynamic = "force-dynamic";
export default async function InternalLinksAdminPage() {
  const [{ issues }, redirects, landings] = await Promise.all([getSeoAuditItems(), prisma.redirect.findMany({ where: { isActive: true } }), prisma.seoLandingPage.findMany({ where: { status: "PUBLISHED" }, select: { id: true, slug: true, locale: true, relatedPathsJson: true } })]);
  const orphans = issues.filter((issue) => issue.code === "orphan_page");
  const chains = redirects.map((item) => ({ item, chain: findRedirectChain(item.fromPath, item.toPath, redirects) })).filter((value) => value.chain);
  const suggestions = landings.flatMap((landing) => { try { const paths: unknown = JSON.parse(landing.relatedPathsJson); return Array.isArray(paths) ? paths.filter((path): path is string => typeof path === "string").map((path) => ({ source: `/${landing.locale}/${landing.slug}`, target: path })) : []; } catch { return []; } });
  return <><AdminPageHeader title="Daxili və qırıq linklər" description="Orphan səhifələr, redirect chain-lər və landing əlaqə qrafı." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Linklər" }]} />
    <div className="grid gap-6 xl:grid-cols-3"><AdminCard title="Orphan səhifələr" description={`${orphans.length} qeyd`}><ul>{orphans.map((issue) => <li key={issue.contentId} className="py-2 text-sm text-ink">{issue.publicPath}</li>)}{orphans.length === 0 && <li className="py-2 text-sm text-ink-muted">Orphan səhifə tapılmadı.</li>}</ul></AdminCard>
      <AdminCard title="Redirect chain" description={`${chains.length} chain`}><ul>{chains.map(({ item, chain }) => <li key={item.id} className="py-2 text-xs text-ink-soft">{chain?.join(" → ")}</li>)}{chains.length === 0 && <li className="py-2 text-sm text-ink-muted">Redirect chain yoxdur.</li>}</ul></AdminCard>
      <AdminCard title="Təklif olunan əlaqələr" description={`${suggestions.length} link`}><ul>{suggestions.map((item, index) => <li key={`${item.source}-${item.target}-${index}`} className="py-2 text-xs text-ink-soft">{item.source} → {item.target}</li>)}{suggestions.length === 0 && <li className="py-2 text-sm text-ink-muted">Landing əlaqələri hələ təyin edilməyib.</li>}</ul></AdminCard></div>
  </>;
}
