import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, Check, MessageSquareText, Pencil, ShieldCheck, Users, X } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminT } from "@/lib/admin-i18n";
import { prisma } from "@/lib/prisma";
import { getApprovalCounts, PENDING_AGENCY_WHERE, PENDING_AGENT_WHERE } from "@/lib/admin/approvals";
import { getAdminAgencyEmployeeQueue } from "@/lib/queries";
import { AGENCY_EMPLOYEE_SOURCES, PERMISSIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { approveAgencyEmployee, rejectAgencyEmployee, toggleAgencyVerification } from "../actions";
import { approveAndPublishAgent } from "../../agentler/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.agencyHub.approvalsTitle") };
}
export const dynamic = "force-dynamic";

const rowClass = "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5";

/**
 * Agentlik və agentlərin təsdiq mərkəzi (#155). Əvvəl gözləyən agentlik siyahının
 * içində, agent profili ayrıca səhifədə redaktə formasının arxasında, komanda sorğusu
 * başqa kartda idi və menyuda heç bir sayğac yox idi. İndi hamısı bir səhifədə, hər
 * sətirdə bir kliklə təsdiq və redaktəyə keçid.
 */
export default async function AdminApprovalsPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const [counts, agencies, agents, employees] = await Promise.all([
    getApprovalCounts(),
    prisma.agency.findMany({
      where: PENDING_AGENCY_WHERE,
      select: {
        id: true,
        name: true,
        logoUrl: true,
        createdAt: true,
        user: { select: { name: true, email: true, phone: true, companyTaxId: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.agentProfile.findMany({
      where: PENDING_AGENT_WHERE,
      select: {
        id: true,
        name: true,
        isPublic: true,
        isVerified: true,
        createdAt: true,
        agency: { select: { name: true } },
        user: { select: { email: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    getAdminAgencyEmployeeQueue(),
  ]);

  const summary = [
    { icon: Building2, label: t("pages.agencyHub.pendingAgencies"), value: counts.agencies, href: "#agentlikler" },
    { icon: BadgeCheck, label: t("pages.agencyHub.pendingAgents"), value: counts.agents, href: "#agentler" },
    { icon: Users, label: t("pages.agencyHub.pendingTeam"), value: counts.employees, href: "#komanda" },
    { icon: MessageSquareText, label: t("pages.agencyHub.pendingReviews"), value: counts.reviews, href: "/admin/agentler#reyler" },
  ];

  return (
    <>
      <AdminPageHeader
        title={t("pages.agencyHub.approvalsTitle")}
        description={t("pages.agencyHub.approvalsDescription")}
        breadcrumbs={[{ label: t("pages.agents.idarePaneli"), href: "/admin" }, { label: t("pages.agencyHub.approvalsTitle") }]}
      />

      <ul className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-paper p-4 shadow-xs transition-colors hover:border-gold">
              <item.icon className="size-5 shrink-0 text-gold-deep" aria-hidden="true" />
              <span className="min-w-0">
                <span className="tabular block text-xl leading-tight font-semibold text-ink">{item.value}</span>
                <span className="block text-xs text-ink-muted">{item.label}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {counts.total === 0 && (
        <AdminCard className="mb-6">
          <EmptyState title={t("pages.agencyHub.queueEmpty")} description={t("pages.agencyHub.queueEmptyDescription")} />
        </AdminCard>
      )}

      {agencies.length > 0 && (
        <AdminCard id="agentlikler" title={t("pages.agencyHub.pendingAgencies")} description={t("pages.agencyHub.pendingAgenciesDescription")} className="mb-6" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {agencies.map((agency) => (
              <li key={agency.id} className={rowClass}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-sm border border-line bg-paper">
                    {agency.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- panel önizləməsi
                      <img src={agency.logoUrl} alt="" className="size-full object-contain p-0.5" />
                    ) : (
                      <Building2 className="size-5 text-ink-muted" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{agency.name}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {[agency.user.name, agency.user.email, agency.user.phone, agency.user.companyTaxId && t("pages.agencyHub.taxIdShort", { value: agency.user.companyTaxId })].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(agency.createdAt)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link href={`/admin/agentlikler/${agency.id}`} aria-label={t("pages.agencyHub.editNamed", { name: agency.name })} className="inline-flex size-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:text-gold-deep">
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <ConfirmAction
                    action={toggleAgencyVerification}
                    id={agency.id}
                    label={t("pages.common.tesdiqle2", { p0: agency.name })}
                    title={t("pages.misc.agentliyiTesdiqlemek")}
                    description={t("pages.misc.agentlikIctimaiAgentliklerSehifesinde")}
                    confirmLabel={t("pages.misc.tesdiqle")}
                    tone="neutral"
                    className="min-h-11 px-3 text-sm"
                  >
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    {t("pages.agencyHub.verify")}
                  </ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {agents.length > 0 && (
        <AdminCard id="agentler" title={t("pages.agencyHub.pendingAgents")} description={t("pages.agencyHub.pendingAgentsDescription")} className="mb-6" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {agents.map((agent) => (
              <li key={agent.id} className={rowClass}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{agent.name}</p>
                    {agent.isVerified ? <Badge tone="success">{t("pages.agents.tesdiqlenib")}</Badge> : <Badge tone="warning">{t("pages.agents.tesdiqGozleyir")}</Badge>}
                    {agent.isPublic ? <Badge tone="gold">{t("pages.agents.ictimai")}</Badge> : <Badge tone="neutral">{t("pages.agents.gizli")}</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {[agent.agency?.name ?? t("pages.misc.musteqil"), agent.user?.email, agent.user?.phone].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link href={`/admin/agentler/${agent.id}`} aria-label={t("pages.common.profiliniRedakteEt", { p0: agent.name })} className="inline-flex size-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:text-gold-deep">
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <ConfirmAction
                    action={approveAndPublishAgent}
                    id={agent.id}
                    label={t("pages.agencyHub.approvePublishNamed", { name: agent.name })}
                    title={t("pages.agencyHub.approvePublish")}
                    description={t("pages.agencyHub.approvePublishDescription", { name: agent.name })}
                    confirmLabel={t("pages.agencyHub.approvePublish")}
                    tone="neutral"
                    className="min-h-11 px-3 text-sm"
                  >
                    <BadgeCheck className="size-4" aria-hidden="true" />
                    {t("pages.agencyHub.approvePublish")}
                  </ConfirmAction>
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {employees.length > 0 && (
        <AdminCard id="komanda" title={t("pages.agencyHub.pendingTeam")} description={t("pages.agents.agentlikSahiblerininDevetEtdiyi")} className="mb-6" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {employees.map((employee) => (
              <li key={employee.id} className={rowClass}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{employee.user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {employee.user.email} · {employee.agency.name} · {employee.source === AGENCY_EMPLOYEE_SOURCES.REQUEST ? t("pages.agents.qosulmaSorgusu") : t("pages.agents.devet")} · {formatDateTime(employee.invitedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <ConfirmAction
                    action={approveAgencyEmployee}
                    id={employee.id}
                    label={t("pages.common.tesdiqle", { p0: employee.user.name })}
                    title={t("pages.agents.emekdasiTesdiqlemek")}
                    description={t("pages.common.agentliyineEmekdasKimiElave", { p0: employee.user.name, p1: employee.user.email, p2: employee.agency.name })}
                    confirmLabel={t("pages.agents.tesdiqle")}
                    tone="neutral"
                    className="size-11"
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                  <ConfirmAction
                    action={rejectAgencyEmployee}
                    id={employee.id}
                    label={t("pages.common.devetiniReddEt", { p0: employee.user.name })}
                    title={t("pages.agents.devetiReddEtmek")}
                    description={t("pages.common.ucunKomandaDevetiRedd", { p0: employee.user.name })}
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

      {counts.reviews > 0 && (
        <AdminCard title={t("pages.agencyHub.pendingReviews")}>
          <Link href="/admin/agentler#reyler" className="text-sm font-medium text-gold-deep hover:underline">
            {t("pages.agencyHub.reviewsLink", { count: counts.reviews })}
          </Link>
        </AdminCard>
      )}
    </>
  );
}
