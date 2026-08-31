import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTION_SITE_URL } from "@/config/site";
import { sitemapFeedNames } from "@/lib/sitemap-xml";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.sitemapIdareetmesi") };
}
export default async function SitemapAdminPage() {
  const t = await getAdminT();
  const feeds = sitemapFeedNames();
  return <><AdminPageHeader title={t("pages.serp.sitemap")} description={t("pages.serp.localeVeEntityNovune")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.sitemap") }]} />
    <AdminCard title={t("pages.serp.sitemapIndex")} description={t("pages.common.ayriFeed", { p0: feeds.length })}><p className="text-sm text-ink-soft"><Link className="font-medium text-gold-deep underline" href="/sitemap.xml" target="_blank">{PRODUCTION_SITE_URL}/sitemap.xml</Link></p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{feeds.map((feed) => <li key={feed}><Link href={`/sitemaps/${feed}`} target="_blank" className="block rounded-xs border border-line px-3 py-2 text-sm text-ink-soft hover:border-gold hover:text-ink">{feed}</Link></li>)}</ul>
    </AdminCard>
  </>;
}
