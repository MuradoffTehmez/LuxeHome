import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, AGENCY_EMPLOYEE_SOURCES, AGENCY_EMPLOYEE_STATUSES, MAX_AGENCY_EMPLOYEES, type Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";
import { getAgencyEmployees, getAgencyForOwner } from "@/lib/queries";
import { InviteEmployeeForm, RemoveEmployeeButton, ReviewRequestButtons } from "./team-forms";
import { forbidden } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.team" });
  return buildManagedMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/komanda", noIndex: true, locale: locale as Locale });
}

export const dynamic = "force-dynamic";

export default async function CabinetTeamPage() {
  const locale = await getLocale() as Locale;
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) forbidden();

  const agency = await getAgencyForOwner(user.id);
  const allEmployees = agency ? await getAgencyEmployees(agency.id) : [];
  // Agentin qoşulma sorğuları ayrıca bölmədədir — onları sahib özü təsdiqləyir.
  const isOpenRequest = (employee: (typeof allEmployees)[number]) =>
    employee.source === AGENCY_EMPLOYEE_SOURCES.REQUEST && employee.status === AGENCY_EMPLOYEE_STATUSES.PENDING;
  const requests = allEmployees.filter(isOpenRequest);
  const employees = allEmployees.filter((employee) => !isOpenRequest(employee));
  // Yer tutanlar: təsdiqlənmişlər və gözləyən dəvətlər (`occupiedAgencySeats` ilə eyni qayda).
  const occupiedSeats = employees.filter((employee) => employee.status !== AGENCY_EMPLOYEE_STATUSES.REJECTED).length;
  const t = await getTranslations("account.team");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        contained
        compact
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description", { count: MAX_AGENCY_EMPLOYEES })}
      />

      {!agency ? (
        <EmptyState
          title={t("completeProfile")}
          description={t("completeProfileDescription")}
        />
      ) : (
        <>
          {requests.length > 0 && (
            <section className="rounded-xl border border-gold/40 bg-paper p-4 shadow-xs sm:p-6">
              <h2 className="font-display text-lg text-ink">{t("requests")}</h2>
              <p className="mt-1 mb-4 text-sm text-ink-soft">{t("requestsDescription")}</p>
              <ul className="divide-y divide-line">
                {requests.map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{request.user.name}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {[request.user.email, request.user.phone].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <ReviewRequestButtons id={request.id} name={request.user.name} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
            <h2 className="mb-5 font-display text-lg text-ink">{t("newInvite")}</h2>
            <InviteEmployeeForm disabled={occupiedSeats >= MAX_AGENCY_EMPLOYEES} />
          </section>

          <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
            <h2 className="mb-5 font-display text-lg text-ink">{t("employees")}</h2>
            {employees.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("empty")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {employees.map((employee) => (
                  <li key={employee.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{employee.user.name}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {employee.user.email} · {t(`status.${employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "approved" : employee.status === AGENCY_EMPLOYEE_STATUSES.REJECTED ? "rejected" : "pending"}`)}
                      </p>
                    </div>
                    <RemoveEmployeeButton id={employee.id} name={employee.user.name} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
