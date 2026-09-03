import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS, ROLES } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminAuditLog, getAdminDomainEvents } from "@/lib/queries";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { clearAuditLog } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.security.auditJurnali") };
}
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function auditValue(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getAdminT();
  const user = await requireAdminRead(PERMISSIONS.SETTINGS_MANAGE);

  const params = await searchParams;
  const rawPage = params.sehife;
  const page = Math.max(1, Number(typeof rawPage === "string" ? rawPage : "1") || 1);
  const entity = typeof params.entity === "string" ? params.entity : "";
  const query = typeof params.q === "string" ? params.q : "";

  const [{ entries, pageCount, total }, domainEvents] = await Promise.all([
    getAdminAuditLog(page, 12, { entity, query }),
    getAdminDomainEvents(),
  ]);

  return (
    <>
      <AdminPageHeader
        title={t("pages.security.auditJurnali")}
        description={t("pages.common.panelEmeliyyatlarininPesekarIzleme", { p0: total })}
        breadcrumbs={[{ label: t("pages.security.idarePaneli"), href: "/admin" }, { label: t("pages.security.auditJurnali") }]}
        actions={user.role === ROLES.SUPER_ADMIN && total > 0 ? (
          <ConfirmAction
            action={clearAuditLog}
            id="all"
            label={t("pages.security.auditJurnaliniSifirla")}
            title={t("pages.security.auditJurnaliniSifirlamaq")}
            description={t("pages.common.qeydSilinecekBuEmeliyyat", { p0: total })}
            confirmLabel={t("pages.security.jurnaliSifirla")}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </ConfirmAction>
        ) : undefined}
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action="/admin/audit"
          searchValue={query}
          searchPlaceholder={t("pages.security.idIstifadeciVeYa")}
          selects={[{
            name: "entity",
            label: t("pages.security.obyekt"),
            value: entity,
            options: [
              { value: "", label: t("pages.security.butunObyektler") },
              { value: "Partner", label: t("pages.security.terefdas") },
              { value: "Property", label: t("pages.security.emlak") },
              { value: "Project", label: t("pages.security.layihe") },
              { value: "User", label: t("pages.security.istifadeci") },
            ],
          }]}
        />
        <div className="p-0">
          {entries.length === 0 ? <EmptyState title={t("pages.security.auditQeydiYoxdur")} /> : (
            <AdminTable
                caption={t("pages.security.auditJurnali")}
                headers={[
                  { label: t("pages.security.tarix") },
                  { label: t("pages.security.kim") },
                  { label: t("pages.security.emeliyyat") },
                  { label: t("pages.security.obyekt") },
                  { label: t("pages.security.teferruat") },
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
                          <summary className="cursor-pointer text-ink-soft">{t("pages.security.deyisiklik")}</summary>
                          <pre className="mt-2 max-w-lg overflow-x-auto whitespace-pre-wrap rounded-xs bg-beige p-2 text-[11px] text-ink-soft">
                            {JSON.stringify({ əvvəl: auditValue(entry.oldValue), sonra: auditValue(entry.newValue) }, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
          )}
        </div>
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

      <AdminCard
        title={t("pages.security.domenHadiseleri")}
        description={t("pages.security.domenHadiseleriTesviri")}
        className="mt-6"
        bodyClassName="p-0"
      >
        {domainEvents.length === 0 ? (
          <EmptyState title={t("pages.security.domenHadisesiYoxdur")} />
        ) : (
          <AdminTable
            caption={t("pages.security.domenHadiseleri")}
            headers={[
              { label: t("pages.security.tarix") },
              { label: t("pages.security.hadiseNovu") },
              { label: t("pages.security.obyekt") },
              { label: t("pages.security.melumat") },
            ]}
          >
            {domainEvents.map((event) => (
              <AdminTableRow key={event.id}>
                <AdminTableCell className="text-xs text-ink-muted whitespace-nowrap">
                  {formatDateTime(event.createdAt)}
                </AdminTableCell>
                <AdminTableCell>
                  <span className="rounded-xs bg-beige px-2 py-1 text-xs font-medium text-ink-soft">
                    {event.type}
                  </span>
                </AdminTableCell>
                <AdminTableCell className="text-xs text-ink-muted">
                  {event.entityType} · {event.entityId.slice(0, 12)}
                </AdminTableCell>
                <AdminTableCell className="max-w-lg text-xs text-ink-muted [overflow-wrap:anywhere]">
                  {event.payload ? (
                    <pre className="overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(auditValue(event.payload), null, 2)}
                    </pre>
                  ) : "—"}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
