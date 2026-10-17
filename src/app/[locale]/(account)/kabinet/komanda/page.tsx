import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { requireAccount } from "@/lib/auth/guard";
import { ACCOUNT_TYPES, AGENCY_EMPLOYEE_ROLES, AGENCY_EMPLOYEE_SOURCES, AGENCY_EMPLOYEE_STATUSES, LEAD_ROUTING_MODES, MAX_AGENCY_EMPLOYEES, isLeadRoutingMode, type Locale } from "@/lib/constants";
import { buildManagedMetadata } from "@/lib/seo";
import { getAgencyEmployees, getAgencyForOwner } from "@/lib/queries";
import { InviteEmployeeForm, InviteLinkCard, LeadAlertsForm, LeadRoutingForm, ReceivesLeadsToggle, RemoveEmployeeButton, ReviewRequestButtons } from "./team-forms";
import { forbidden } from "next/navigation";
import { siteUrl } from "@/config/site";
import { localizePath } from "@/i18n/path-locale";
import { formatLocalizedDate, formatLocalizedDateTime } from "@/i18n/date";
import { countOwnListings } from "@/lib/accounts/agency-listings";
import { getAgencyMembershipHistory } from "@/lib/accounts/agency-ownership";
import { effectivePermissions, isAgencyEmployeeRole } from "@/lib/accounts/agency-access";
import { leadAlertConfigOf } from "@/lib/accounts/lead-alerts";
import { Badge } from "@/components/ui/badge";
import { MemberAccessButton, MemberSuspendButton } from "./member-forms";

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
  // Çıxarılan agentin elanlarının taleyi üçün (#159): elan sayı və təhvil ala biləcək həmkarlar.
  const approved = employees.filter((employee) => employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED);
  // Yalnız agentlik elanları — agentin şəxsi elanları ayrılmada onda qalır (#210).
  const [listingCounts, history] = await Promise.all([
    countOwnListings(approved.map((employee) => employee.user.id), agency?.id),
    agency ? getAgencyMembershipHistory(agency.id) : [],
  ]);
  // Üzvlük tarixçəsi (#210, PRD 6.6): hazırkı üzvlər yuxarıda görünür, burada keçmiş dövrlər.
  const pastMembers = history.filter((period) => period.leftAt);

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

          {/* Dəvət linki (#157): linklə gələn agent sahibin təsdiqini gözləmədən qoşulur. */}
          <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
            <h2 className="font-display text-lg text-ink">{t("inviteLink.title")}</h2>
            <p className="mt-1 mb-5 max-w-2xl text-sm leading-6 text-ink-soft">{t("inviteLink.description")}</p>
            <InviteLinkCard
              url={agency.inviteToken ? siteUrl(localizePath(`/qosul/${agency.inviteToken}`, locale)) : null}
              createdLabel={agency.inviteTokenCreatedAt ? formatLocalizedDateTime(agency.inviteTokenCreatedAt, locale) : null}
              agencyVerified={agency.isVerified}
              disabled={occupiedSeats >= MAX_AGENCY_EMPLOYEES}
            />
          </section>

          {/* Müraciət bölgüsü (#161, #224 — PRD 8.4): agentliyə gələn müraciət kimə düşsün. */}
          <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
            <h2 className="font-display text-lg text-ink">{t("routing.title")}</h2>
            <p className="mt-1 mb-5 max-w-2xl text-sm leading-6 text-ink-soft">{t("routing.description")}</p>
            <LeadRoutingForm mode={isLeadRoutingMode(agency.leadRouting) ? agency.leadRouting : LEAD_ROUTING_MODES.ROUND_ROBIN} />
          </section>

          {/* Cavabsız müraciət pillələri (#224, PRD 8.5). */}
          <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
            <h2 className="font-display text-lg text-ink">{t("alerts.title")}</h2>
            <p className="mt-1 mb-5 max-w-2xl text-sm leading-6 text-ink-soft">{t("alerts.description")}</p>
            <LeadAlertsForm {...leadAlertConfigOf(agency)} />
          </section>

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
                      <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-medium text-ink">
                        <span className="truncate">{employee.user.name}</span>
                        {employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED && (
                          <Badge tone={employee.role === AGENCY_EMPLOYEE_ROLES.MANAGER ? "info" : "neutral"}>{t(`access.roles.${isAgencyEmployeeRole(employee.role) ? employee.role : "AGENT"}`)}</Badge>
                        )}
                        {employee.suspendedAt && <Badge tone="warning">{t("access.suspendedBadge")}</Badge>}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {employee.user.email} · {t(`status.${employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED ? "approved" : employee.status === AGENCY_EMPLOYEE_STATUSES.REJECTED ? "rejected" : "pending"}`)}
                        {employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED && ` · ${t("listingCount", { count: listingCounts.get(employee.user.id) ?? 0 })}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                    {employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED && (
                      <>
                        {!employee.suspendedAt && <ReceivesLeadsToggle id={employee.id} name={employee.user.name} receives={employee.receivesLeads} />}
                        <MemberAccessButton
                          id={employee.id}
                          name={employee.user.name}
                          role={isAgencyEmployeeRole(employee.role) ? employee.role : AGENCY_EMPLOYEE_ROLES.AGENT}
                          permissions={[...effectivePermissions(employee.role, employee.permissions)]}
                        />
                        <MemberSuspendButton id={employee.id} name={employee.user.name} suspended={Boolean(employee.suspendedAt)} />
                      </>
                    )}
                    <RemoveEmployeeButton
                      id={employee.id}
                      name={employee.user.name}
                      listingCount={employee.status === AGENCY_EMPLOYEE_STATUSES.APPROVED ? listingCounts.get(employee.user.id) ?? 0 : 0}
                      teammates={approved
                        .filter((teammate) => teammate.id !== employee.id)
                        .map((teammate) => ({ userId: teammate.user.id, name: teammate.user.name }))}
                    />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {pastMembers.length > 0 && (
            <section className="rounded-xl border border-line bg-paper p-4 sm:p-6 shadow-xs">
              <h2 className="font-sans text-lg font-semibold text-ink">{t("history.title")}</h2>
              <p className="mt-1 mb-4 max-w-2xl text-sm leading-6 text-ink-soft">{t("history.description")}</p>
              <ul className="flex flex-col gap-2">
                {pastMembers.map((period) => (
                  <li key={period.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-line px-3 py-2 text-sm">
                    <span className="min-w-0 font-medium text-ink">{period.user.name}</span>
                    <span className="text-xs text-ink-muted">
                      {formatLocalizedDate(period.joinedAt, locale)} — {period.leftAt ? formatLocalizedDate(period.leftAt, locale) : ""}
                      {" · "}
                      {t(`history.reason.${period.endReason === "REMOVED" ? "removed" : "left"}`)}
                      {period.handedOver > 0 && ` · ${t("history.handedOver", { count: period.handedOver })}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
