import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FolderTree, HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
  StatusBadge,
} from "@/components/admin/admin-ui";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { formatNumber, formatRelative } from "@/lib/utils";
import {
  PERMISSIONS,
  type KnowledgeAudience,
  type KnowledgeStatus,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminKnowledgeArticles } from "@/lib/knowledge";
import { deleteKnowledgeArticle } from "./actions";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.knowledge.bilikMerkezi") };
}
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/bilik-merkezi";

/** Alt səhifə adları dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const subPages = (t: Awaited<ReturnType<typeof getAdminT>>) =>
  [
    { href: `${LIST_PATH}/kateqoriyalar`, label: t("pages.knowledge.movzular"), icon: FolderTree },
    { href: `${LIST_PATH}/lugat`, label: t("pages.knowledge.luget"), icon: BookOpen },
    { href: `${LIST_PATH}/suallar`, label: t("pages.knowledge.suallarFaq"), icon: HelpCircle },
  ] as const;

export default async function AdminKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);

  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";

  const articles = await getAdminKnowledgeArticles({ search, status });

  return (
    <>
      <AdminPageHeader
        title={t("pages.knowledge.bilikMerkezi")}
        description={t("pages.knowledge.dasinmazEmlakBeledcileriTermin")}
        breadcrumbs={[{ label: t("pages.knowledge.idarePaneli"), href: "/admin" }, { label: t("pages.knowledge.bilikMerkezi") }]}
        actions={
          <ButtonLink href={`${LIST_PATH}/yeni`}>
            <Plus className="size-4" aria-hidden="true" />
            {t("pages.knowledge.yeniBeledci")}
          </ButtonLink>
        }
      />

      <nav aria-label={t("pages.knowledge.bilikMerkeziBolmeleri")} className="mb-6 flex flex-wrap gap-2">
        {subPages(t).map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <page.icon className="size-4" aria-hidden="true" />
            {page.label}
          </Link>
        ))}
      </nav>

      <AdminCard bodyClassName="p-4 lg:p-0">
        <AdminResponsiveList
          ariaLabel={t("pages.knowledge.beledciler")}
          items={articles}
          getKey={(article) => article.id}
          empty={
            <p className="py-10 text-center text-sm text-ink-muted">
              {t("pages.knowledge.heleBeledciYaradilmayib")}
            </p>
          }
          renderCard={(article) => (
            <AdminListCard
              title={article.title}
              meta={`/bilik-merkezi/${article.slug}`}
              status={
                <StatusBadge
                  status={article.status as "DRAFT" | "PUBLISHED"}
                  label={t(`labels.knowledgeStatus.${article.status as KnowledgeStatus}`) ?? article.status}
                />
              }
              actions={
                <>
                  <Link
                    href={`${LIST_PATH}/${article.id}`}
                    aria-label={t("pages.common.beledcisiniRedakteEt", { p0: article.title })}
                    title={t("pages.knowledge.redakteEt")}
                    className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <ConfirmAction
                    action={deleteKnowledgeArticle}
                    id={article.id}
                    label={t("pages.common.beledcisiniSil", { p0: article.title })}
                    title={t("pages.knowledge.beledciniSilmek")}
                    description={t("pages.knowledge.beledciSaytdanCixarilacaqAudit")}
                    className="size-11"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                </>
              }
            >
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-ink-muted">{t("pages.knowledge.movzu")}</dt>
                  <dd className="mt-1 text-ink">{article.category?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">{t("pages.knowledge.auditoriya")}</dt>
                  <dd className="mt-1 text-ink">
                    {t(`labels.knowledgeAudience.${article.audience as KnowledgeAudience}`) ??
                      article.audience}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">{t("pages.knowledge.baxis")}</dt>
                  <dd className="tabular mt-1 text-ink">{formatNumber(article.viewCount)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">{t("pages.knowledge.yenilenib")}</dt>
                  <dd className="mt-1 text-ink">{formatRelative(article.updatedAt)}</dd>
                </div>
              </dl>
            </AdminListCard>
          )}
          renderTable={(items) => (
            <AdminTable
              caption={t("pages.knowledge.bilikMerkeziBeledcileri")}
              headers={[
                { label: t("pages.knowledge.basliq") },
                { label: t("pages.knowledge.movzu") },
                { label: t("pages.knowledge.auditoriya") },
                { label: t("pages.knowledge.status") },
                { label: t("pages.knowledge.baxis"), className: "text-right" },
                { label: t("pages.knowledge.yenilenib"), className: "text-right" },
                { label: t("pages.knowledge.emeliyyatlar"), srOnly: true, className: "text-right" },
              ]}
            >
              {items.map((article) => (
                <AdminTableRow key={article.id}>
                  <AdminTableCell className="max-w-80">
                    <span className="font-medium text-ink">{article.title}</span>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">/{article.slug}</p>
                  </AdminTableCell>
                  <AdminTableCell className="text-sm text-ink-soft">
                    {article.category?.name ?? "—"}
                  </AdminTableCell>
                  <AdminTableCell className="text-sm text-ink-soft">
                    {t(`labels.knowledgeAudience.${article.audience as KnowledgeAudience}`) ??
                      article.audience}
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={article.status as "DRAFT" | "PUBLISHED"}
                      label={
                        t(`labels.knowledgeStatus.${article.status as KnowledgeStatus}`) ?? article.status
                      }
                    />
                  </AdminTableCell>
                  <AdminTableCell align="right" className="tabular text-sm text-ink-soft">
                    {formatNumber(article.viewCount)}
                  </AdminTableCell>
                  <AdminTableCell align="right" className="text-sm text-ink-soft">
                    {formatRelative(article.updatedAt)}
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        href={`${LIST_PATH}/${article.id}`}
                        aria-label={t("pages.common.beledcisiniRedakteEt", { p0: article.title })}
                        title={t("pages.knowledge.redakteEt")}
                        className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                      <ConfirmAction
                        action={deleteKnowledgeArticle}
                        id={article.id}
                        label={t("pages.common.beledcisiniSil", { p0: article.title })}
                        title={t("pages.knowledge.beledciniSilmek")}
                        description={t("pages.knowledge.beledciSaytdanCixarilacaqAudit")}
                        className="size-11"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </ConfirmAction>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        />
      </AdminCard>
    </>
  );
}
