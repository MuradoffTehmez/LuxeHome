import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmAction } from "@/components/admin/confirm-action";
import { formatRelative } from "@/lib/utils";
import {
  PERMISSIONS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPES,
  type ProjectStatus,
  type ProjectType,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminProjects } from "@/lib/queries";
import { deleteProject, restoreProject } from "./actions";

export const metadata: Metadata = { title: "Layihələr" };
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/layiheler";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminRead(PERMISSIONS.PROJECT_MANAGE);

  const params = await searchParams;
  const deleted = one(params, "silinmis") === "1";

  const filters = {
    q: one(params, "q"),
    status: one(params, "status"),
    projectType: one(params, "tip"),
    deleted,
    page: Number(one(params, "sehife")) || 1,
  };

  const { rows, total, page, totalPages } = await getAdminProjects(filters);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.status) query.set("status", filters.status);
    if (filters.projectType) query.set("tip", filters.projectType);
    if (deleted) query.set("silinmis", "1");
    if (nextPage > 1) query.set("sehife", String(nextPage));
    const search = query.toString();
    return search ? `${LIST_PATH}?${search}` : LIST_PATH;
  }

  return (
    <>
      <AdminPageHeader
        title={deleted ? "Silinmiş layihələr" : "Layihələr"}
        description={
          deleted
            ? "Silinmiş layihələr burada saxlanılır və bərpa edilə bilər."
            : `Ümumilikdə ${total} layihə tapıldı.`
        }
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          ...(deleted ? [{ label: "Layihələr", href: LIST_PATH }] : []),
          { label: deleted ? "Silinmişlər" : "Layihələr" },
        ]}
        actions={
          <>
            <ButtonLink
              href={deleted ? LIST_PATH : `${LIST_PATH}?silinmis=1`}
              variant="outline"
              size="sm"
            >
              {deleted ? "Aktiv layihələr" : "Zibil qutusu"}
            </ButtonLink>
            <ButtonLink href={`${LIST_PATH}/yeni`} variant="primary" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Yeni layihə
            </ButtonLink>
          </>
        }
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action={LIST_PATH}
          searchValue={filters.q}
          searchPlaceholder="Ad və ya slug üzrə axtar…"
          hidden={deleted ? { silinmis: "1" } : {}}
          selects={[
            {
              name: "status",
              label: "Status",
              value: filters.status,
              options: [
                { value: "", label: "Bütün statuslar" },
                ...Object.values(PROJECT_STATUSES).map((value) => ({
                  value,
                  label: PROJECT_STATUS_LABELS[value],
                })),
              ],
            },
            {
              name: "tip",
              label: "Layihə növü",
              value: filters.projectType,
              options: [
                { value: "", label: "Bütün növlər" },
                ...Object.values(PROJECT_TYPES).map((value) => ({
                  value,
                  label: PROJECT_TYPE_LABELS[value],
                })),
              ],
            },
          ]}
        />

        <AdminTable
          caption="Layihələr"
          headers={[
            { label: "Layihə" },
            { label: "Növ" },
            { label: "Status" },
            { label: "Elan", className: "text-right" },
            { label: "Şəkil", className: "text-right" },
            { label: "Yenilənib", className: "text-right" },
            { label: "Əməliyyatlar", srOnly: true, className: "text-right" },
          ]}
        >
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-muted">
                {filters.q || filters.status || filters.projectType
                  ? "Bu filtrlərə uyğun layihə tapılmadı."
                  : "Hələ layihə əlavə edilməyib."}
              </td>
            </tr>
          )}
          {rows.map((project) => (
            <AdminTableRow key={project.id}>
              <AdminTableCell className="max-w-xs">
                <Link
                  href={`${LIST_PATH}/${project.id}`}
                  className="line-clamp-1 font-medium text-ink transition-colors hover:text-gold-deep"
                >
                  {project.name}
                </Link>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {[project.city?.name, project.year ? `${project.year}` : null]
                    .filter(Boolean)
                    .join(" · ") || `/${project.slug}`}
                </p>
              </AdminTableCell>

              <AdminTableCell>
                <Badge tone="neutral">
                  {PROJECT_TYPE_LABELS[project.projectType as ProjectType]}
                </Badge>
                {!project.isActive && (
                  <p className="mt-1 text-xs text-ink-muted">Saytda gizlidir</p>
                )}
              </AdminTableCell>

              <AdminTableCell>
                <StatusBadge
                  status={project.status as ProjectStatus}
                  label={PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                />
              </AdminTableCell>

              <AdminTableCell align="right" className="tabular text-sm text-ink-soft">
                {project._count.properties}
              </AdminTableCell>

              <AdminTableCell align="right" className="tabular text-sm text-ink-soft">
                {project._count.images}
              </AdminTableCell>

              <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                {formatRelative(project.updatedAt)}
              </AdminTableCell>

              <AdminTableCell align="right">
                <div className="flex items-center justify-end gap-0.5">
                  {deleted ? (
                    <ConfirmAction
                      action={restoreProject}
                      id={project.id}
                      label={`«${project.name}» layihəsini bərpa et`}
                      title="Layihəni bərpa etmək"
                      description="Layihə yenidən aktiv siyahıya qayıdacaq."
                      confirmLabel="Bərpa et"
                      tone="neutral"
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                    </ConfirmAction>
                  ) : (
                    <>
                      <Link
                        href={`/layiheler/${project.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`«${project.name}» layihəsini saytda aç`}
                        title="Saytda bax"
                        className="grid size-9 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </Link>
                      <Link
                        href={`${LIST_PATH}/${project.id}`}
                        aria-label={`«${project.name}» layihəsini redaktə et`}
                        title="Redaktə et"
                        className="grid size-9 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                      <ConfirmAction
                        action={deleteProject}
                        id={project.id}
                        label={`«${project.name}» layihəsini sil`}
                        title="Layihəni silmək"
                        description="Layihə saytdan çıxarılacaq, amma zibil qutusunda qalacaq. Ona bağlı elanlar silinmir."
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </ConfirmAction>
                    </>
                  )}
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-sm text-ink-muted">
          <span className="tabular">
            {total === 0 ? "0 layihə göstərilir" : `${total} layihədən ${rows.length} göstərilir`}
          </span>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </AdminCard>
    </>
  );
}
