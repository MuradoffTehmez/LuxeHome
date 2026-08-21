import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Phone, Trash2 } from "lucide-react";
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
import { formatPhone, formatRelative } from "@/lib/utils";
import {
  LEAD_SOURCE_LABELS,
  LEAD_SOURCES,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  PERMISSIONS,
  type LeadSource,
  type LeadStatus,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminLeads } from "@/lib/queries";
import { deleteLead } from "./actions";

export const metadata: Metadata = { title: "Müraciətlər" };
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/muracietler";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminRead(PERMISSIONS.LEAD_MANAGE);

  const params = await searchParams;
  const filters = {
    q: one(params, "q"),
    status: one(params, "status"),
    source: one(params, "menbe"),
    page: Number(one(params, "sehife")) || 1,
  };

  const { rows, total, page, totalPages } = await getAdminLeads(filters);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (filters.q) query.set("q", filters.q);
    if (filters.status) query.set("status", filters.status);
    if (filters.source) query.set("menbe", filters.source);
    if (nextPage > 1) query.set("sehife", String(nextPage));
    const search = query.toString();
    return search ? `${LIST_PATH}?${search}` : LIST_PATH;
  }

  return (
    <>
      <AdminPageHeader
        title="Müraciətlər"
        description={`Ümumilikdə ${total} müraciət tapıldı.`}
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Müraciətlər" }]}
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action={LIST_PATH}
          searchValue={filters.q}
          searchPlaceholder="Ad, telefon, e-poçt və ya mətn üzrə axtar…"
          selects={[
            {
              name: "status",
              label: "Status",
              value: filters.status,
              options: [
                { value: "", label: "Bütün statuslar" },
                ...Object.values(LEAD_STATUSES).map((value) => ({
                  value,
                  label: LEAD_STATUS_LABELS[value],
                })),
              ],
            },
            {
              name: "menbe",
              label: "Mənbə",
              value: filters.source,
              options: [
                { value: "", label: "Bütün mənbələr" },
                ...Object.values(LEAD_SOURCES).map((value) => ({
                  value,
                  label: LEAD_SOURCE_LABELS[value],
                })),
              ],
            },
          ]}
        />

        <AdminTable
          caption="Müraciətlər"
          headers={[
            { label: "Müştəri" },
            { label: "Mövzu" },
            { label: "Mənbə" },
            { label: "Məsul" },
            { label: "Status" },
            { label: "Vaxt", className: "text-right" },
            { label: "Əməliyyatlar", srOnly: true, className: "text-right" },
          ]}
        >
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-ink-muted">
                {filters.q || filters.status || filters.source
                  ? "Bu filtrlərə uyğun müraciət tapılmadı."
                  : "Hələ müraciət yoxdur."}
              </td>
            </tr>
          )}
          {rows.map((lead) => (
            <AdminTableRow key={lead.id}>
              <AdminTableCell>
                <Link
                  href={`${LIST_PATH}/${lead.id}`}
                  className="font-medium text-ink transition-colors hover:text-gold-deep"
                >
                  {lead.name}
                </Link>
                <a
                  href={`tel:${lead.phone}`}
                  className="tabular mt-0.5 flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-gold-deep"
                >
                  <Phone className="size-3" aria-hidden="true" />
                  {formatPhone(lead.phone)}
                </a>
              </AdminTableCell>

              <AdminTableCell className="max-w-xs">
                <span className="line-clamp-1 text-sm text-ink-soft">
                  {lead.subject ?? lead.property?.title ?? "—"}
                </span>
              </AdminTableCell>

              <AdminTableCell className="text-sm text-ink-soft">
                {LEAD_SOURCE_LABELS[lead.source as LeadSource]}
              </AdminTableCell>

              <AdminTableCell className="text-sm text-ink-soft">
                {lead.assignee?.name ?? <span className="text-ink-muted">Təyin edilməyib</span>}
              </AdminTableCell>

              <AdminTableCell>
                <StatusBadge
                  status={lead.status as LeadStatus}
                  label={LEAD_STATUS_LABELS[lead.status as LeadStatus]}
                />
              </AdminTableCell>

              <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                {formatRelative(lead.createdAt)}
              </AdminTableCell>

              <AdminTableCell align="right">
                <div className="flex items-center justify-end gap-0.5">
                  <Link
                    href={`${LIST_PATH}/${lead.id}`}
                    aria-label={`«${lead.name}» müraciətini aç`}
                    title="Ətraflı"
                    className="grid size-9 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Link>
                  <ConfirmAction
                    action={deleteLead}
                    id={lead.id}
                    label={`«${lead.name}» müraciətini sil`}
                    title="Müraciəti silmək"
                    description="Müraciət tamamilə silinəcək və bərpa edilə bilməyəcək."
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-sm text-ink-muted">
          <span className="tabular">
            {total === 0 ? "0 müraciət göstərilir" : `${total} müraciətdən ${rows.length} göstərilir`}
          </span>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </AdminCard>
    </>
  );
}
