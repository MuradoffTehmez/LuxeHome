import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, MAX_AGENCY_EMPLOYEES, type Locale } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { getAgencyEmployees, getAgencyForOwner } from "@/lib/queries";
import { InviteEmployeeForm, RemoveEmployeeButton } from "./team-forms";
import { forbidden } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.team" });
  return buildMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/kabinet/komanda", noIndex: true, locale: locale as Locale });
}

export const dynamic = "force-dynamic";

export default async function CabinetTeamPage() {
  const locale = await getLocale() as Locale;
  const user = await requireAccount(locale);
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) forbidden();

  const agency = await getAgencyForOwner(user.id);
  const employees = agency ? await getAgencyEmployees(agency.id) : [];
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
          <section className="rounded-md border border-line bg-paper p-4 sm:p-6">
            <h2 className="mb-5 font-display text-lg text-ink">{t("newInvite")}</h2>
            <InviteEmployeeForm disabled={employees.filter((e) => e.status !== "REJECTED").length >= MAX_AGENCY_EMPLOYEES} />
          </section>

          <section className="rounded-md border border-line bg-paper p-4 sm:p-6">
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
                        {employee.user.email} · {t(`status.${employee.status === "APPROVED" ? "approved" : employee.status === "REJECTED" ? "rejected" : "pending"}`)}
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
