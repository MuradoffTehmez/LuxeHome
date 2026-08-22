import type { Metadata } from "next";
import { ShieldCheck, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { formatDateTime } from "@/lib/utils";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminAgencies } from "@/lib/queries";
import { toggleAgencyVerification } from "./actions";

export const metadata: Metadata = { title: "Agentliklər" };
export const dynamic = "force-dynamic";

export default async function AdminAgenciesPage() {
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const agencies = await getAdminAgencies();

  return (
    <>
      <AdminPageHeader
        title="Agentliklər"
        description="Yalnız təsdiqlənmiş agentliklər ictimai /agentlikler səhifəsində və elanları avtomatik dərc olunmuş görünür."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Agentliklər" }]}
      />

      <AdminCard bodyClassName="p-0">
        <AdminTable
          caption="Agentliklər"
          headers={[
            { label: "Agentlik" },
            { label: "Elan sayı" },
            { label: "Qeydiyyat tarixi" },
            { label: "Status" },
            { label: "İdarəetmə", className: "text-right" },
          ]}
        >
          {agencies.length === 0 && (
            <AdminTableRow>
              <AdminTableCell className="py-8 text-center text-sm text-ink-muted">
                Hələ agentlik qeydiyyatdan keçməyib.
              </AdminTableCell>
            </AdminTableRow>
          )}

          {agencies.map((agency) => (
            <AdminTableRow key={agency.id}>
              <AdminTableCell>
                <span className="font-medium text-ink">{agency.name}</span>
                <p className="mt-0.5 text-xs text-ink-muted">{agency.user.email}</p>
                {!agency.user.isActive && (
                  <Badge tone="neutral" className="mt-1">Deaktiv hesab</Badge>
                )}
              </AdminTableCell>

              <AdminTableCell className="tabular">{agency.user._count.properties}</AdminTableCell>

              <AdminTableCell className="text-xs text-ink-muted">
                {formatDateTime(agency.createdAt)}
              </AdminTableCell>

              <AdminTableCell>
                {agency.isVerified ? (
                  <Badge tone="success">Təsdiqlənib</Badge>
                ) : (
                  <Badge tone="warning">Təsdiq gözləyir</Badge>
                )}
              </AdminTableCell>

              <AdminTableCell align="right">
                <div className="flex justify-end">
                  <ConfirmAction
                    action={toggleAgencyVerification}
                    id={agency.id}
                    label={agency.isVerified ? `«${agency.name}» təsdiqini ləğv et` : `«${agency.name}» təsdiqlə`}
                    title={agency.isVerified ? "Təsdiqi ləğv etmək" : "Agentliyi təsdiqləmək"}
                    description={
                      agency.isVerified
                        ? "Agentlik ictimai səhifədən gizlədiləcək. Elanları saytda qalır."
                        : "Agentlik ictimai /agentlikler səhifəsində görünəcək və yeni elanları avtomatik dərc olunacaq."
                    }
                    confirmLabel={agency.isVerified ? "Ləğv et" : "Təsdiqlə"}
                    tone={agency.isVerified ? "danger" : "neutral"}
                  >
                    {agency.isVerified ? (
                      <ShieldX className="size-4" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="size-4" aria-hidden="true" />
                    )}
                  </ConfirmAction>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
