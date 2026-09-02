import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSeoAuditItems } from "@/lib/queries";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { KNOWLEDGE_STATUSES, POST_STATUSES } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.serp.contentSeo") };
}
export const dynamic = "force-dynamic";
export default async function ContentSeoAdminPage() {
  const t = await getAdminT();
  const [{ issues }, stalePosts, staleKnowledge] = await Promise.all([
    getSeoAuditItems(),
    prisma.blogPost.findMany({ where: { status: POST_STATUSES.PUBLISHED, reviewAfter: { lt: new Date() } }, select: { id: true, title: true, reviewAfter: true }, take: 50 }),
    prisma.knowledgeArticle.findMany({ where: { status: KNOWLEDGE_STATUSES.PUBLISHED, reviewAfter: { lt: new Date() } }, select: { id: true, title: true, reviewAfter: true }, take: 50 }),
  ]);
  const contentIssues = issues.filter((issue) => ["thin_content", "meta_description_missing", "author_missing", "published_at_missing", "meta_title_short", "meta_description_short"].includes(issue.code));
  return <><AdminPageHeader title={t("pages.serp.contentSeo")} description={t("pages.serp.thinContentMuelliflikMetadata")} breadcrumbs={[{ label: t("pages.serp.serpVeSeo"), href: "/admin/serp" }, { label: t("pages.serp.contentSeo") }]} />
    <div className="grid gap-6 xl:grid-cols-2"><AdminCard title={t("pages.serp.contentKeyfiyyetProblemleri")} description={t("pages.misc.problemSayi", { count: contentIssues.length })}><ul className="divide-y divide-line">{contentIssues.map((issue) => <li key={`${issue.contentId}-${issue.code}`} className="py-3"><p className="font-medium text-ink">{issue.message}</p><p className="text-xs text-ink-muted">{issue.publicPath} · {issue.severity}</p></li>)}{contentIssues.length === 0 && <li className="py-3 text-sm text-ink-muted">{t("pages.serp.cariAuditProyeksiyasindaContent")}</li>}</ul></AdminCard>
      <AdminCard title={t("pages.serp.yenilenmeVaxtiKecenMezmun")} description={t("pages.misc.qeydSayi", { count: stalePosts.length + staleKnowledge.length })}><ul className="divide-y divide-line">{[...stalePosts.map((item) => ({ ...item, kind: t("pages.misc.bloq") })), ...staleKnowledge.map((item) => ({ ...item, kind: t("pages.misc.beledci") }))].map((item) => <li key={`${item.kind}-${item.id}`} className="py-3"><p className="font-medium text-ink">{item.title}</p><p className="text-xs text-ink-muted">{item.kind} · reviewAfter {item.reviewAfter?.toISOString().slice(0, 10)}</p></li>)}{stalePosts.length + staleKnowledge.length === 0 && <li className="py-3 text-sm text-ink-muted">{t("pages.serp.yenilenmeVaxtiKecenMezmun2")}</li>}</ul></AdminCard></div>
  </>;
}
