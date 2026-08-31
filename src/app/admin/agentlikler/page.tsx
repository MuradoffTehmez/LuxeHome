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
import { AgencyProfileRepair } from "./agency-profile-repair";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.agents.agentlikler") };
}
export const dynamic = "force-dynamic";

export default async function AdminAgenciesPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const [agencies, employeeQueue] = await Promise.all([
    getAdminAgencies(),
    getAdminAgencyEmployeeQueue(),
  ]);

  return (
    <>
      <AdminPageHeader
        title={t("pages.agents.agentlikler")}
        description={t("pages.agents.yalnizTesdiqlenmisAgentliklerIctimai")}
        breadcrumbs={[{ label: t("pages.agents.idarePaneli"), href: "/admin" }, { label: t("pages.agents.agentlikler") }]}
      />

      {employeeQueue.length > 0 && (
        <AdminCard
          title={t("pages.agents.komandaDevetleri")}
          description={t("pages.agents.agentlikSahiblerininDevetEtdiyi")}
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
                    {t(`labels.agencyEmployeeRole.${employee.role as keyof typeof AGENCY_EMPLOYEE_ROLE_LABELS}`) ??
                      employee.role}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <ConfirmAction
                    action={approveAgencyEmployee}
                    id={employee.id}
                    label={`${employee.user.name} təsdiqlə`}
                    title={t("pages.agents.emekdasiTesdiqlemek")}
                    description={`${employee.user.name} (${employee.user.email}) "${employee.agency.name}" agentliyinə əməkdaş kimi əlavə olunacaq.`}
                    confirmLabel={t("pages.agents.tesdiqle")}
                    tone="neutral"
                    className="size-11"
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                  <ConfirmAction
                    action={rejectAgencyEmployee}
                    id={employee.id}
                    label={`${employee.user.name} dəvətini rədd et`}
                    title={t("pages.agents.devetiReddEtmek")}
                    description={`${employee.user.name} üçün komanda dəvəti rədd olunacaq.`}
                    confirmLabel={t("pages.agents.reddEt")}
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
          ariaLabel={t("pages.agents.agentlikler")}
          items={agencies}
          getKey={(account) => account.id}
          empty={
            <p className="py-10 text-center text-sm text-ink-muted">
              {t("pages.agents.heleAgentlikTipliHesab")}
            </p>
          }
          renderCard={(account) => (
            <AdminListCard
              title={account.agency?.name ?? account.name}
              meta={
                <>
                  <span className="block">{account.email}</span>
                  <span className="mt-1 block">{formatDateTime(account.createdAt)}</span>
                </>
              }
              status={
                !account.agency ? (
                  <Badge tone="danger">{t("pages.agents.profilYoxdur")}</Badge>
                ) : account.agency.isVerified ? (
                  <Badge tone="success">{t("pages.agents.tesdiqlenib")}</Badge>
                ) : (
                  <Badge tone="warning">{t("pages.agents.tesdiqGozleyir")}</Badge>
                )
              }
              actions={account.agency ? (
                <ConfirmAction
                  action={toggleAgencyVerification}
                  id={account.agency.id}
                  label={account.agency.isVerified ? `«${account.agency.name}» təsdiqini ləğv et` : `«${account.agency.name}» təsdiqlə`}
                  title={account.agency.isVerified ? "Təsdiqi ləğv etmək" : "Agentliyi təsdiqləmək"}
                  description={
                    account.agency.isVerified
                      ? "Agentlik ictimai səhifədən gizlədiləcək. Elanları saytda qalır."
                      : "Agentlik ictimai /agentlikler səhifəsində görünəcək və yeni elanları avtomatik dərc olunacaq."
                  }
                  confirmLabel={account.agency.isVerified ? "Ləğv et" : "Təsdiqlə"}
                  tone={account.agency.isVerified ? "danger" : "neutral"}
                  className="size-11"
                >
                  {account.agency.isVerified ? (
                    <ShieldX className="size-4" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  )}
                </ConfirmAction>
              ) : null}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="tabular">{account._count.properties} elan</span>
                {!account.isActive ? <Badge tone="neutral">{t("pages.agents.deaktivHesab")}</Badge> : null}
              </div>
              {!account.agency ? (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-3 text-xs text-ink-muted">{t("pages.agents.kohneQeydiyyatYarimciqQalib")}</p>
                  <AgencyProfileRepair userId={account.id} defaultName={account.name} />
                </div>
              ) : null}
            </AdminListCard>
          )}
          renderTable={(items) => (
            <AdminTable
              caption={t("pages.agents.agentlikler")}
              headers={[
                { label: t("pages.agents.agentlik") },
                { label: t("pages.agents.elanSayi") },
                { label: t("pages.agents.qeydiyyatTarixi") },
                { label: t("pages.agents.status") },
                { label: t("pages.agents.idareetme"), className: "text-right" },
              ]}
            >
              {items.map((account) => (
                <AdminTableRow key={account.id}>
                  <AdminTableCell>
                    <span className="font-medium text-ink">{account.agency?.name ?? account.name}</span>
                    <p className="mt-0.5 text-xs text-ink-muted">{account.email}</p>
                    {!account.isActive && (
                      <Badge tone="neutral" className="mt-1">{t("pages.agents.deaktivHesab")}</Badge>
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="tabular">{account._count.properties}</AdminTableCell>
                  <AdminTableCell className="text-xs text-ink-muted">
                    {formatDateTime(account.createdAt)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {!account.agency ? (
                      <Badge tone="danger">{t("pages.agents.profilYoxdur")}</Badge>
                    ) : account.agency.isVerified ? (
                      <Badge tone="success">{t("pages.agents.tesdiqlenib")}</Badge>
                    ) : (
                      <Badge tone="warning">{t("pages.agents.tesdiqGozleyir")}</Badge>
                    )}
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <div className="flex min-w-72 justify-end">
                      {!account.agency ? (
                        <AgencyProfileRepair userId={account.id} defaultName={account.name} />
                      ) : (
                      <ConfirmAction
                        action={toggleAgencyVerification}
                        id={account.agency.id}
                        label={account.agency.isVerified ? `«${account.agency.name}» təsdiqini ləğv et` : `«${account.agency.name}» təsdiqlə`}
                        title={account.agency.isVerified ? "Təsdiqi ləğv etmək" : "Agentliyi təsdiqləmək"}
                        description={
                          account.agency.isVerified
                            ? "Agentlik ictimai səhifədən gizlədiləcək. Elanları saytda qalır."
                            : "Agentlik ictimai /agentlikler səhifəsində görünəcək və yeni elanları avtomatik dərc olunacaq."
                        }
                        confirmLabel={account.agency.isVerified ? "Ləğv et" : "Təsdiqlə"}
                        tone={account.agency.isVerified ? "danger" : "neutral"}
                        className="size-11"
                      >
                        {account.agency.isVerified ? (
                          <ShieldX className="size-4" aria-hidden="true" />
                        ) : (
                          <ShieldCheck className="size-4" aria-hidden="true" />
                        )}
                      </ConfirmAction>
                      )}
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
