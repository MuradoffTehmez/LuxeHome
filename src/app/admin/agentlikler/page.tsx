import type { Metadata } from "next";
import { Check, ShieldCheck, ShieldX, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { formatDateTime } from "@/lib/utils";
import { AGENCY_EMPLOYEE_ROLE_LABELS, PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminAgencies, getAdminAgencyEmployeeQueue } from "@/lib/queries";
import { approveAgencyEmployee, rejectAgencyEmployee, toggleAgencyVerification } from "./actions";

export const metadata: Metadata = { title: "Agentliklər" };
export const dynamic = "force-dynamic";

export default async function AdminAgenciesPage() {
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const [agencies, employeeQueue] = await Promise.all([
    getAdminAgencies(),
    getAdminAgencyEmployeeQueue(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Agentliklər"
        description="Yalnız təsdiqlənmiş agentliklər ictimai /agentlikler səhifəsində və elanları avtomatik dərc olunmuş görünür."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Agentliklər" }]}
      />

      {employeeQueue.length > 0 && (
        <AdminCard
          title="Komanda dəvətləri"
          description="Agentlik sahiblərinin dəvət etdiyi əməkdaşlar — təsdiqlənənə qədər panelə giriş almırlar."
          bodyClassName="p-0"
          className="mb-6"
        >
          <ul className="divide-y divide-line">
            {employeeQueue.map((employee) => (
              <li
                key={employee.id}
                className="flex flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{employee.user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {employee.user.email} · {employee.agency.name} ·{" "}
                    {AGENCY_EMPLOYEE_ROLE_LABELS[employee.role as keyof typeof AGENCY_EMPLOYEE_ROLE_LABELS] ??
                      employee.role}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <ConfirmAction
                    action={approveAgencyEmployee}
                    id={employee.id}
                    label={`${employee.user.name} təsdiqlə`}
                    title="Əməkdaşı təsdiqləmək"
                    description={`${employee.user.name} (${employee.user.email}) "${employee.agency.name}" agentliyinə əməkdaş kimi əlavə olunacaq.`}
                    confirmLabel="Təsdiqlə"
                    tone="neutral"
                    className="size-11"
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                  <ConfirmAction
                    action={rejectAgencyEmployee}
                    id={employee.id}
                    label={`${employee.user.name} dəvətini rədd et`}
                    title="Dəvəti rədd etmək"
                    description={`${employee.user.name} üçün komanda dəvəti rədd olunacaq.`}
                    confirmLabel="Rədd et"
                    tone="danger"
                    className="size-11"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      <AdminCard bodyClassName="p-4 lg:p-0">
        <AdminResponsiveList
          ariaLabel="Agentliklər"
          items={agencies}
          getKey={(agency) => agency.id}
          empty={
            <p className="py-10 text-center text-sm text-ink-muted">
              Hələ agentlik qeydiyyatdan keçməyib.
            </p>
          }
          renderCard={(agency) => (
            <AdminListCard
              title={agency.name}
              meta={
                <>
                  <span className="block">{agency.user.email}</span>
                  <span className="mt-1 block">{formatDateTime(agency.createdAt)}</span>
                </>
              }
              status={
                agency.isVerified ? (
                  <Badge tone="success">Təsdiqlənib</Badge>
                ) : (
                  <Badge tone="warning">Təsdiq gözləyir</Badge>
                )
              }
              actions={
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
                  className="size-11"
                >
                  {agency.isVerified ? (
                    <ShieldX className="size-4" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  )}
                </ConfirmAction>
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="tabular">{agency.user._count.properties} elan</span>
                {!agency.user.isActive ? <Badge tone="neutral">Deaktiv hesab</Badge> : null}
              </div>
            </AdminListCard>
          )}
          renderTable={(items) => (
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
              {items.map((agency) => (
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
                        className="size-11"
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
          )}
        />
      </AdminCard>
    </>
  );
}
