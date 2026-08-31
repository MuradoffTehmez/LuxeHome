import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTION_SITE_URL } from "@/config/site";
import { sitemapFeedNames } from "@/lib/sitemap-xml";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Sitemap idarəetməsi" };
export default function SitemapAdminPage() {
  const feeds = sitemapFeedNames();
  return <><AdminPageHeader title="Sitemap" description="Locale və entity növünə bölünmüş sitemap indexi; yalnız canonical və indexable URL-lər feed-lərə daxil edilir." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Sitemap" }]} />
    <AdminCard title="Sitemap index" description={`${feeds.length} ayrı feed`}><p className="text-sm text-ink-soft"><Link className="font-medium text-gold-deep underline" href="/sitemap.xml" target="_blank">{PRODUCTION_SITE_URL}/sitemap.xml</Link></p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{feeds.map((feed) => <li key={feed}><Link href={`/sitemaps/${feed}`} target="_blank" className="block rounded-xs border border-line px-3 py-2 text-sm text-ink-soft hover:border-gold hover:text-ink">{feed}</Link></li>)}</ul>
    </AdminCard>
  </>;
}
