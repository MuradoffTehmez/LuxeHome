import { getAdminT } from "@/lib/admin-i18n";
import Link from "next/link";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";

/** Bölmə adları dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const buildSections = (t: Awaited<ReturnType<typeof getAdminT>>) =>
  [
    [t("pages.misc.umumiBaxis"), "/admin/serp"], [t("pages.misc.qlobalVeLocalSeo"), "/admin/serp/parametrler"],
    ["Metadata", "/admin/serp/metadata"], [t("pages.misc.landingSehifeler"), "/admin/serp/landingler"],
    [t("pages.misc.yonlendirmeler"), "/admin/redirects"], ["Structured data", "/admin/serp/schema"],
    ["Sitemap", "/admin/serp/sitemap"], ["Robots", "/admin/serp/robots"],
    ["Entity management", "/admin/serp/entities"], ["Content SEO", "/admin/serp/content"],
    ["Media SEO", "/admin/serp/media"], ["Keyword cluster", "/admin/serp/acar-sozler"],
    ["SERP monitorinq", "/admin/serp/monitorinq"], ["SEO audit", "/admin/serp/audit"],
    ["Search Console", "/admin/serp/search-console"], ["Indexing", "/admin/serp/indexing"],
    [t("pages.misc.daxiliQiriqLinkler"), "/admin/serp/links"], [t("pages.misc.404Jurnali"), "/admin/redirects#not-found"],
  ] as const;

export default async function SerpLayout({ children }: { children: React.ReactNode }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.SEO_VIEW);
  return <div className="min-w-0">
    <nav aria-label={t("pages.serp.serpVeSeoBolmeleri")} className="mb-6 overflow-x-auto rounded-md border border-line bg-paper p-2">
      <ul className="flex min-w-max gap-1">{buildSections(t).map(([label, href]) => <li key={href}><Link href={href} className="inline-flex min-h-11 items-center rounded-xs px-3 text-sm text-ink-soft hover:bg-beige hover:text-ink">{label}</Link></li>)}</ul>
    </nav>
    {children}
  </div>;
}

