import type { Metadata } from "next";
import { Pagination } from "@/components/ui/pagination";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminAuditLog } from "@/lib/queries";

export const metadata: Metadata = { title: "Audit jurnalı" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);

  const params = await searchParams;
  const rawPage = params.sehife;
  const page = Math.max(1, Number(typeof rawPage === "string" ? rawPage : "1") || 1);

  const { entries, pageCount } = await getAdminAuditLog(page);

  return (
    <>
      <AdminPageHeader
        title="Audit jurnalı"
        description="Panel əməliyyatlarının dəyişdirilə bilməyən qeydi — kim, nə vaxt, nə etdi."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Audit jurnalı" }]}
      />

      <AdminCard bodyClassName="p-0">
        <AdminTable
          caption="Audit jurnalı"
          headers={[
            { label: "Tarix" },
            { label: "Kim" },
            { label: "Əməliyyat" },
            { label: "Obyekt" },
            { label: "Təfərrüat" },
          ]}
        >
          {entries.map((entry) => (
            <AdminTableRow key={entry.id}>
              <AdminTableCell className="text-xs text-ink-muted whitespace-nowrap">
                {formatDateTime(entry.createdAt)}
              </AdminTableCell>
              <AdminTableCell className="text-xs">{entry.userEmail}</AdminTableCell>
              <AdminTableCell>
                <span className="rounded-xs bg-beige px-2 py-1 text-xs font-medium text-ink-soft">
                  {entry.action}
                </span>
              </AdminTableCell>
              <AdminTableCell className="text-xs text-ink-muted">
                {entry.entity}
                {entry.entityId && <span className="text-ink-muted"> · {entry.entityId.slice(0, 8)}</span>}
              </AdminTableCell>
              <AdminTableCell className="max-w-xs text-xs text-ink-muted [overflow-wrap:anywhere]">
                {entry.summary ?? "—"}
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      </AdminCard>

      {pageCount > 1 && (
        <Pagination
          page={page}
          totalPages={pageCount}
          buildHref={(target) => `/admin/audit?sehife=${target}`}
          className="mt-6"
        />
      )}
    </>
  );
}
