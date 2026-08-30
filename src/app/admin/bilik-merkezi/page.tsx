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
  KNOWLEDGE_AUDIENCE_LABELS,
  KNOWLEDGE_STATUS_LABELS,
  PERMISSIONS,
  type KnowledgeAudience,
  type KnowledgeStatus,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminKnowledgeArticles } from "@/lib/knowledge";
import { deleteKnowledgeArticle } from "./actions";

export const metadata: Metadata = { title: "Bilik Mərkəzi" };
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/bilik-merkezi";

const SUB_PAGES = [
  { href: `${LIST_PATH}/kateqoriyalar`, label: "Mövzular", icon: FolderTree },
  { href: `${LIST_PATH}/lugat`, label: "Lüğət", icon: BookOpen },
  { href: `${LIST_PATH}/suallar`, label: "Suallar (FAQ)", icon: HelpCircle },
] as const;

export default async function AdminKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminRead(PERMISSIONS.KNOWLEDGE_MANAGE);

  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";

  const articles = await getAdminKnowledgeArticles({ search, status });

  return (
    <>
      <AdminPageHeader
        title="Bilik Mərkəzi"
        description="Daşınmaz əmlak bələdçiləri, termin lüğəti və CMS-dən idarə olunan suallar. Məzmun Azərbaycan Respublikasının qanunvericiliyinə istinad etməlidir."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Bilik Mərkəzi" }]}
        actions={
          <ButtonLink href={`${LIST_PATH}/yeni`}>
            <Plus className="size-4" aria-hidden="true" />
            Yeni bələdçi
          </ButtonLink>
        }
      />

      <nav aria-label="Bilik Mərkəzi bölmələri" className="mb-6 flex flex-wrap gap-2">
        {SUB_PAGES.map((page) => (
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
          ariaLabel="Bələdçilər"
          items={articles}
          getKey={(article) => article.id}
          empty={
            <p className="py-10 text-center text-sm text-ink-muted">
              Hələ bələdçi yaradılmayıb.
            </p>
          }
          renderCard={(article) => (
            <AdminListCard
              title={article.title}
              meta={`/bilik-merkezi/${article.slug}`}
              status={
                <StatusBadge
                  status={article.status as "DRAFT" | "PUBLISHED"}
                  label={KNOWLEDGE_STATUS_LABELS[article.status as KnowledgeStatus] ?? article.status}
                />
              }
              actions={
                <>
                  <Link
                    href={`${LIST_PATH}/${article.id}`}
                    aria-label={`«${article.title}» bələdçisini redaktə et`}
                    title="Redaktə et"
                    className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <ConfirmAction
                    action={deleteKnowledgeArticle}
                    id={article.id}
                    label={`«${article.title}» bələdçisini sil`}
                    title="Bələdçini silmək"
                    description="Bələdçi saytdan çıxarılacaq. Audit jurnalında qeyd qalır."
                    className="size-11"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                </>
              }
            >
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-ink-muted">Mövzu</dt>
                  <dd className="mt-1 text-ink">{article.category?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Auditoriya</dt>
                  <dd className="mt-1 text-ink">
                    {KNOWLEDGE_AUDIENCE_LABELS[article.audience as KnowledgeAudience] ??
                      article.audience}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Baxış</dt>
                  <dd className="tabular mt-1 text-ink">{formatNumber(article.viewCount)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Yenilənib</dt>
                  <dd className="mt-1 text-ink">{formatRelative(article.updatedAt)}</dd>
                </div>
              </dl>
            </AdminListCard>
          )}
          renderTable={(items) => (
            <AdminTable
              caption="Bilik Mərkəzi bələdçiləri"
              headers={[
                { label: "Başlıq" },
                { label: "Mövzu" },
                { label: "Auditoriya" },
                { label: "Status" },
                { label: "Baxış", className: "text-right" },
                { label: "Yenilənib", className: "text-right" },
                { label: "Əməliyyatlar", srOnly: true, className: "text-right" },
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
                    {KNOWLEDGE_AUDIENCE_LABELS[article.audience as KnowledgeAudience] ??
                      article.audience}
                  </AdminTableCell>
                  <AdminTableCell>
                    <StatusBadge
                      status={article.status as "DRAFT" | "PUBLISHED"}
                      label={
                        KNOWLEDGE_STATUS_LABELS[article.status as KnowledgeStatus] ?? article.status
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
                        aria-label={`«${article.title}» bələdçisini redaktə et`}
                        title="Redaktə et"
                        className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                      <ConfirmAction
                        action={deleteKnowledgeArticle}
                        id={article.id}
                        label={`«${article.title}» bələdçisini sil`}
                        title="Bələdçini silmək"
                        description="Bələdçi saytdan çıxarılacaq. Audit jurnalında qeyd qalır."
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
