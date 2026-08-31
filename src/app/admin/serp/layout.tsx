import Link from "next/link";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";

const sections = [
  ["Ümumi baxış", "/admin/serp"], ["Qlobal və Local SEO", "/admin/serp/parametrler"],
  ["Metadata", "/admin/serp/metadata"], ["Landing səhifələr", "/admin/serp/landingler"],
  ["Yönləndirmələr", "/admin/redirects"], ["Structured data", "/admin/serp/schema"],
  ["Sitemap", "/admin/serp/sitemap"], ["Robots", "/admin/serp/robots"],
  ["Entity management", "/admin/serp/entities"], ["Content SEO", "/admin/serp/content"],
  ["Media SEO", "/admin/serp/media"], ["Keyword cluster", "/admin/serp/acar-sozler"],
  ["SERP monitorinq", "/admin/serp/monitorinq"], ["SEO audit", "/admin/serp/audit"],
  ["Search Console", "/admin/serp/search-console"], ["Indexing", "/admin/serp/indexing"],
  ["Daxili/qırıq linklər", "/admin/serp/links"], ["404 jurnalı", "/admin/redirects#not-found"],
] as const;

export default async function SerpLayout({ children }: { children: React.ReactNode }) {
  await requireAdminRead(PERMISSIONS.SEO_VIEW);
  return <div className="min-w-0">
    <nav aria-label="SERP və SEO bölmələri" className="mb-6 overflow-x-auto rounded-md border border-line bg-paper p-2">
      <ul className="flex min-w-max gap-1">{sections.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex min-h-11 items-center rounded-xs px-3 text-sm text-ink-soft hover:bg-beige hover:text-ink">{label}</Link></li>)}</ul>
    </nav>
    {children}
  </div>;
}

