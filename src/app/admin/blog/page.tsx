import type { Metadata } from "next";
import Link from "next/link";
import { Eye, FolderTree, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { formatNumber, formatRelative } from "@/lib/utils";
import {
  PERMISSIONS,
  POST_STATUSES,
  type PostStatus,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminBlogCategories, getAdminPosts } from "@/lib/queries";
import { deletePost, restorePost } from "./actions";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getAdminT } from "@/lib/admin-i18n";

export const metadata: Metadata = { title: "Bloq" };
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/blog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminBlogPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getAdminT();
  const { locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.BLOG_MANAGE);

  const params = await searchParams;
  const deleted = one(params, "silinmis") === "1";

  const filters = {
    q: one(params, "q"),
    status: one(params, "status"),
    categoryId: one(params, "kateqoriya"),
    deleted,
    page: Number(one(params, "sehife")) || 1,
  };

  const [{ rows, total, page, totalPages }, categories] = await Promise.all([
    getAdminPosts(filters),
    getAdminBlogCategories(),
  ]);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.status) query.set("status", filters.status);
    if (filters.categoryId) query.set("kateqoriya", filters.categoryId);
    if (deleted) query.set("silinmis", "1");
    if (nextPage > 1) query.set("sehife", String(nextPage));
    const search = query.toString();
    return search ? `${LIST_PATH}?${search}` : LIST_PATH;
  }

  function renderActions(post: (typeof rows)[number]) {
    return deleted ? (
      <ConfirmAction
        action={restorePost}
        id={post.id}
        label={`«${post.title}» məqaləsini bərpa et`}
        title="Məqaləni bərpa etmək"
        description="Məqalə yenidən aktiv siyahıya qayıdacaq."
        confirmLabel="Bərpa et"
        tone="neutral"
        className="size-11"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
      </ConfirmAction>
    ) : (
      <>
        <Link
          href={localizePath(`/blog/${post.slug}`, locale)}
          target="_blank"
          rel="noreferrer"
          aria-label={`«${post.title}» məqaləsini saytda aç`}
          title="Saytda bax"
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href={`${LIST_PATH}/${post.id}`}
          aria-label={`«${post.title}» məqaləsini redaktə et`}
          title="Redaktə et"
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
        <ConfirmAction
          action={deletePost}
          id={post.id}
          label={`«${post.title}» məqaləsini sil`}
          title="Məqaləni silmək"
          description="Məqalə saytdan çıxarılacaq, amma zibil qutusunda qalacaq."
          className="size-11"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={deleted ? "Silinmiş məqalələr" : "Bloq"}
        description={
          deleted
            ? "Silinmiş məqalələr burada saxlanılır və bərpa edilə bilər."
            : `Ümumilikdə ${total} məqalə tapıldı.`
        }
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          ...(deleted ? [{ label: "Bloq", href: LIST_PATH }] : []),
          { label: deleted ? "Silinmişlər" : "Bloq" },
        ]}
        actions={
          <>
            <ButtonLink href={`${LIST_PATH}/kateqoriyalar`} variant="outline" size="sm">
              <FolderTree className="size-4" aria-hidden="true" />
              Kateqoriyalar
            </ButtonLink>
            <ButtonLink
              href={deleted ? LIST_PATH : `${LIST_PATH}?silinmis=1`}
              variant="outline"
              size="sm"
            >
              {deleted ? "Aktiv məqalələr" : "Zibil qutusu"}
            </ButtonLink>
            <ButtonLink href={`${LIST_PATH}/yeni`} variant="primary" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Yeni məqalə
            </ButtonLink>
          </>
        }
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action={LIST_PATH}
          searchValue={filters.q}
          searchPlaceholder="Başlıq və ya slug üzrə axtar…"
          resultLabel={`${total} məqalə tapıldı`}
          hidden={deleted ? { silinmis: "1" } : {}}
          selects={[
            {
              name: "status",
              label: "Status",
              value: filters.status,
              options: [
                { value: "", label: "Bütün statuslar" },
                ...Object.values(POST_STATUSES).map((value) => ({
                  value,
                  label: t(`labels.postStatus.${value}`),
                })),
              ],
            },
            {
              name: "kateqoriya",
              label: "Kateqoriya",
              value: filters.categoryId,
              options: [
                { value: "", label: "Bütün kateqoriyalar" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ],
            },
          ]}
        />

        <div className="p-4 lg:p-0">
          <AdminResponsiveList
            ariaLabel="Bloq məqalələri"
            items={rows}
            getKey={(post) => post.id}
            empty={
              <p className="py-10 text-center text-sm text-ink-muted">
                {filters.q || filters.status || filters.categoryId
                  ? "Bu filtrlərə uyğun məqalə tapılmadı."
                  : "Hələ məqalə yazılmayıb."}
              </p>
            }
            renderCard={(post) => (
              <AdminListCard
                title={
                  <Link href={`${LIST_PATH}/${post.id}`} className="transition-colors hover:text-gold-deep">
                    {post.title}
                  </Link>
                }
                meta={
                  <>
                    {post.readMinutes} dəq oxu · /{post.slug}
                    <span className="mt-1 block">{formatRelative(post.updatedAt)}</span>
                  </>
                }
                status={
                  <StatusBadge status={post.status as PostStatus} label={t(`labels.postStatus.${post.status as PostStatus}`)} />
                }
                actions={renderActions(post)}
              >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <dt className="text-xs text-ink-muted">Kateqoriya</dt>
                    <dd className="mt-1 text-ink">{post.category?.name ?? "Kateqoriyasız"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Müəllif</dt>
                    <dd className="mt-1 text-ink">{post.author?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Baxış</dt>
                    <dd className="tabular mt-1 text-ink">{formatNumber(post.viewCount)}</dd>
                  </div>
                </dl>
              </AdminListCard>
            )}
            renderTable={(items) => (
              <AdminTable
                caption="Bloq məqalələri"
                headers={[
                  { label: "Məqalə" },
                  { label: "Kateqoriya" },
                  { label: "Müəllif" },
                  { label: "Status" },
                  { label: "Baxış", className: "text-right" },
                  { label: "Yenilənib", className: "text-right" },
                  { label: "Əməliyyatlar", srOnly: true, className: "text-right" },
                ]}
              >
                {items.map((post) => (
                  <AdminTableRow key={post.id}>
                    <AdminTableCell className="max-w-sm">
                      <Link href={`${LIST_PATH}/${post.id}`} className="line-clamp-1 font-medium text-ink transition-colors hover:text-gold-deep">{post.title}</Link>
                      <p className="mt-0.5 text-xs text-ink-muted">{post.readMinutes} dəq oxu · /{post.slug}</p>
                    </AdminTableCell>
                    <AdminTableCell className="text-sm text-ink-soft">
                      {post.category?.name ?? <span className="text-ink-muted">Kateqoriyasız</span>}
                    </AdminTableCell>
                    <AdminTableCell className="text-sm text-ink-soft">{post.author?.name ?? "—"}</AdminTableCell>
                    <AdminTableCell>
                      <StatusBadge status={post.status as PostStatus} label={t(`labels.postStatus.${post.status as PostStatus}`)} />
                    </AdminTableCell>
                    <AdminTableCell align="right" className="tabular text-sm text-ink-soft">{formatNumber(post.viewCount)}</AdminTableCell>
                    <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">{formatRelative(post.updatedAt)}</AdminTableCell>
                    <AdminTableCell align="right">
                      <div className="flex items-center justify-end gap-0.5">{renderActions(post)}</div>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
            )}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-sm text-ink-muted">
          <span className="tabular">
            {total === 0 ? "0 məqalə göstərilir" : `${total} məqalədən ${rows.length} göstərilir`}
          </span>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </AdminCard>
    </>
  );
}
