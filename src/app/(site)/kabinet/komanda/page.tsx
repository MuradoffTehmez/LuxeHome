import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, AGENCY_EMPLOYEE_STATUS_LABELS, MAX_AGENCY_EMPLOYEES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { getAgencyEmployees, getAgencyForOwner } from "@/lib/queries";
import { InviteEmployeeForm, RemoveEmployeeButton } from "./team-forms";
import { forbidden } from "next/navigation";

export const metadata: Metadata = buildMetadata({
  title: "Komanda",
  description: "Agentlik komandasını idarə edin.",
  path: "/kabinet/komanda",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function CabinetTeamPage() {
  const user = await requireAccount();
  if (user.accountType !== ACCOUNT_TYPES.AGENCY) forbidden();

  const agency = await getAgencyForOwner(user.id);
  const employees = agency ? await getAgencyEmployees(agency.id) : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        contained
        compact
        eyebrow="Kabinet"
        title="Komanda"
        description={`Sahibdən əlavə maksimum ${MAX_AGENCY_EMPLOYEES} əməkdaş dəvət edə bilərsiniz. Dəvət LuxeHome heyəti təsdiqləndikdən sonra aktiv olur.`}
      />

      {!agency ? (
        <EmptyState
          title="Əvvəlcə agentlik profilini tamamlayın"
          description="Komanda idarə etmək üçün profildə agentlik adını daxil edin."
        />
      ) : (
        <>
          <section className="rounded-md border border-line bg-paper p-4 sm:p-6">
            <h2 className="mb-5 font-display text-lg text-ink">Yeni dəvət</h2>
            <InviteEmployeeForm disabled={employees.filter((e) => e.status !== "REJECTED").length >= MAX_AGENCY_EMPLOYEES} />
          </section>

          <section className="rounded-md border border-line bg-paper p-4 sm:p-6">
            <h2 className="mb-5 font-display text-lg text-ink">Əməkdaşlar</h2>
            {employees.length === 0 ? (
              <p className="text-sm text-ink-muted">Hələ əməkdaş dəvət olunmayıb.</p>
            ) : (
              <ul className="divide-y divide-line">
                {employees.map((employee) => (
                  <li key={employee.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{employee.user.name}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {employee.user.email} · {AGENCY_EMPLOYEE_STATUS_LABELS[employee.status as keyof typeof AGENCY_EMPLOYEE_STATUS_LABELS] ?? employee.status}
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
