import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSeoAuditItems } from "@/lib/queries";
import { findRedirectChain } from "@/lib/serp";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { SEO_LANDING_STATUSES } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.daxiliVeQiriqLinkler") };
}
export const dynamic = "force-dynamic";
export default async function InternalLinksAdminPage() {
  const t = await getAdminT();
  const [{ issues }, redirects, landings] = await Promise.all([getSeoAuditItems(), prisma.redirect.findMany({ where: { isActive: true } }), prisma.seoLandingPage.findMany({ where: { status: SEO_LANDING_STATUSES.PUBLISHED }, select: { id: true, slug: true, locale: true, relatedPathsJson: true } })]);
  const orphans = issues.filter((issue) => issue.code === "orphan_page");
  const chains = redirects.map((item) => ({ item, chain: findRedirectChain(item.fromPath, item.toPath, redirects) })).filter((value) => value.chain);
  const suggestions = landings.flatMap((landing) => { try { const paths: unknown = JSON.parse(landing.relatedPathsJson); return Array.isArray(paths) ? paths.filter((path): path is string => typeof path === "string").map((path) => ({ source: `/${landing.locale}/${landing.slug}`, target: path })) : []; } catch { return []; } });
  return <><AdminPageHeader title={t("pages.serp.daxiliVeQiriqLinkler")} description={t("pages.serp.orphanSehifelerRedirectChain")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.linkler") }]} />
    <div className="grid gap-6 xl:grid-cols-3"><AdminCard title={t("pages.serp.orphanSehifeler")} description={t("pages.misc.qeydSayi", { count: orphans.length })}><ul>{orphans.map((issue) => <li key={issue.contentId} className="py-2 text-sm text-ink">{issue.publicPath}</li>)}{orphans.length === 0 && <li className="py-2 text-sm text-ink-muted">{t("pages.serp.orphanSehifeTapilmadi")}</li>}</ul></AdminCard>
      <AdminCard title={t("pages.serp.redirectChain")} description={t("pages.misc.chainSayi", { count: chains.length })}><ul>{chains.map(({ item, chain }) => <li key={item.id} className="py-2 text-xs text-ink-soft">{chain?.join(" → ")}</li>)}{chains.length === 0 && <li className="py-2 text-sm text-ink-muted">{t("pages.serp.redirectChainYoxdur")}</li>}</ul></AdminCard>
      <AdminCard title={t("pages.serp.teklifOlunanElaqeler")} description={t("pages.misc.linkSayi", { count: suggestions.length })}><ul>{suggestions.map((item, index) => <li key={`${item.source}-${item.target}-${index}`} className="py-2 text-xs text-ink-soft">{item.source} → {item.target}</li>)}{suggestions.length === 0 && <li className="py-2 text-sm text-ink-muted">{t("pages.serp.landingElaqeleriHeleTeyin")}</li>}</ul></AdminCard></div>
  </>;
}
