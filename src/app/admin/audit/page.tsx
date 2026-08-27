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
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";

export const metadata: Metadata = { title: "Audit jurnalı" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);

  const params = await searchParams;
  const rawPage = params.sehife;
  const page = Math.max(1, Number(typeof rawPage === "string" ? rawPage : "1") || 1);
  const entity = typeof params.entity === "string" ? params.entity : "";
  const query = typeof params.q === "string" ? params.q : "";

  const { entries, pageCount } = await getAdminAuditLog(page, undefined, { entity, query });

  return (
    <>
      <AdminPageHeader
        title="Audit jurnalı"
        description="Panel əməliyyatlarının dəyişdirilə bilməyən qeydi — kim, nə vaxt, nə etdi."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Audit jurnalı" }]}
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action="/admin/audit"
          searchValue={query}
          searchPlaceholder="ID, istifadəçi və ya təfərrüat…"
          selects={[{
            name: "entity",
            label: "Obyekt",
            value: entity,
            options: [
              { value: "", label: "Bütün obyektlər" },
              { value: "Partner", label: "Tərəfdaş" },
              { value: "Property", label: "Əmlak" },
              { value: "Project", label: "Layihə" },
              { value: "User", label: "İstifadəçi" },
            ],
          }]}
        />
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
                <span>{entry.summary ?? "—"}</span>
                {entry.oldValue || entry.newValue ? (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-ink-soft">Dəyişiklik</summary>
                    <pre className="mt-2 max-w-lg overflow-x-auto whitespace-pre-wrap rounded-xs bg-beige p-2 text-[11px] text-ink-soft">
                      {JSON.stringify({
                        əvvəl: entry.oldValue ? JSON.parse(entry.oldValue) : null,
                        sonra: entry.newValue ? JSON.parse(entry.newValue) : null,
                      }, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      </AdminCard>

      {pageCount > 1 && (
        <Pagination
          page={page}
          totalPages={pageCount}
          buildHref={(target) => {
            const search = new URLSearchParams();
            if (query) search.set("q", query);
            if (entity) search.set("entity", entity);
            if (target > 1) search.set("sehife", String(target));
            const suffix = search.toString();
            return suffix ? `/admin/audit?${suffix}` : "/admin/audit";
          }}
          className="mt-6"
        />
      )}
    </>
  );
}
