import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSeoAuditItems } from "@/lib/queries";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Content SEO" };
export const dynamic = "force-dynamic";
export default async function ContentSeoAdminPage() {
  const [{ issues }, stalePosts, staleKnowledge] = await Promise.all([
    getSeoAuditItems(),
    prisma.blogPost.findMany({ where: { status: "PUBLISHED", reviewAfter: { lt: new Date() } }, select: { id: true, title: true, reviewAfter: true }, take: 50 }),
    prisma.knowledgeArticle.findMany({ where: { status: "PUBLISHED", reviewAfter: { lt: new Date() } }, select: { id: true, title: true, reviewAfter: true }, take: 50 }),
  ]);
  const contentIssues = issues.filter((issue) => ["thin_content", "meta_description_missing", "author_missing", "published_at_missing", "meta_title_short", "meta_description_short"].includes(issue.code));
  return <><AdminPageHeader title="Content SEO" description="Thin content, müəlliflik, metadata və freshness qaydalarının vahid iş siyahısı." breadcrumbs={[{ label: "SERP və SEO", href: "/admin/serp" }, { label: "Content SEO" }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title="Content keyfiyyət problemləri" description={`${contentIssues.length} problem`}><ul className="divide-y divide-line">{contentIssues.map((issue) => <li key={`${issue.contentId}-${issue.code}`} className="py-3"><p className="font-medium text-ink">{issue.message}</p><p className="text-xs text-ink-muted">{issue.publicPath} · {issue.severity}</p></li>)}{contentIssues.length === 0 && <li className="py-3 text-sm text-ink-muted">Cari audit proyeksiyasında content problemi yoxdur.</li>}</ul></AdminCard>
      <AdminCard title="Yenilənmə vaxtı keçən məzmun" description={`${stalePosts.length + staleKnowledge.length} qeyd`}><ul className="divide-y divide-line">{[...stalePosts.map((item) => ({ ...item, kind: "Blog" })), ...staleKnowledge.map((item) => ({ ...item, kind: "Bilik" }))].map((item) => <li key={`${item.kind}-${item.id}`} className="py-3"><p className="font-medium text-ink">{item.title}</p><p className="text-xs text-ink-muted">{item.kind} · reviewAfter {item.reviewAfter?.toISOString().slice(0, 10)}</p></li>)}{stalePosts.length + staleKnowledge.length === 0 && <li className="py-3 text-sm text-ink-muted">Yenilənmə vaxtı keçən məzmun yoxdur.</li>}</ul></AdminCard></div>
  </>;
}
