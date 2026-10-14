import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BadgeCheck, Building2, Check, Clock, MessageSquareText, Pencil, ShieldCheck, Users, X } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ReasonAction } from "@/components/admin/reason-action";
import { BulkRowCheckbox, BulkSelectionForm, type BulkIntentConfig } from "@/components/admin/bulk-selection";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminT } from "@/lib/admin-i18n";
import { prisma } from "@/lib/prisma";
import { getApprovalCounts, PENDING_AGENCY_WHERE, PENDING_AGENT_WHERE } from "@/lib/admin/approvals";
import { APPROVAL_SLA_TONE, approvalSla } from "@/lib/admin/approval-sla";
import { getAdminAgencyEmployeeQueue } from "@/lib/queries";
import { AGENCY_EMPLOYEE_SOURCES, PERMISSIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import {
  approveAgencyEmployee,
  bulkApproveQueue,
  rejectAgencyApplication,
  rejectAgencyEmployee,
  toggleAgencyVerification,
} from "../actions";
import { approveAndPublishAgent, rejectAgentApplication } from "../../agentler/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.agencyHub.approvalsTitle") };
}
export const dynamic = "force-dynamic";

const rowClass = "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5";

/**
 * Agentlik və agentlərin təsdiq mərkəzi (#155, #157). Hamısı bir səhifədə: hər sətirdə
 * təsdiq, səbəbli rədd və redaktəyə keçid, hər kartda toplu təsdiq. Sətirlər ən köhnədən
 * başlayır və gözləmə müddəti SLA rəngi ilə göstərilir (24 saat — sarı, 72 saat — qırmızı).
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

  const now = new Date();
  const waiting = (since: Date) => {
    const sla = approvalSla(since, now);
    return (
      <Badge tone={APPROVAL_SLA_TONE[sla.level]} className="gap-1">
        <Clock className="size-3" aria-hidden="true" />
        {sla.hours < 48 ? t("pages.agencyHub.waitingHours", { count: sla.hours }) : t("pages.agencyHub.waitingDays", { count: sla.days })}
      </Badge>
    );
  };
  const overdue = [
    ...agencies.map((item) => item.createdAt),
    ...agents.map((item) => item.createdAt),
    ...employees.map((item) => item.invitedAt),
  ].filter((since) => approvalSla(since, now).level === "overdue").length;

  const summary = [
    { icon: Building2, label: t("pages.agencyHub.pendingAgencies"), value: counts.agencies, href: "#agentlikler" },
    { icon: BadgeCheck, label: t("pages.agencyHub.pendingAgents"), value: counts.agents, href: "#agentler" },
    { icon: Users, label: t("pages.agencyHub.pendingTeam"), value: counts.employees, href: "#komanda" },
    { icon: MessageSquareText, label: t("pages.agencyHub.pendingReviews"), value: counts.reviews, href: "/admin/agentler#reyler" },
  ];
  const bulkDescriptions = {
    agency: t("pages.agencyHub.bulkApproveAgencies"),
    agent: t("pages.agencyHub.bulkApproveAgents"),
    employee: t("pages.agencyHub.bulkApproveTeam"),
  };
  const bulkIntent = (intent: keyof typeof bulkDescriptions): BulkIntentConfig[] => [
    {
      intent,
      label: t("pages.agencyHub.bulkApprove"),
      icon: "approve",
      confirm: {
        title: t("pages.agencyHub.bulkApproveTitle"),
        description: bulkDescriptions[intent],
        confirmLabel: t("pages.agencyHub.bulkApprove"),
      },
    },
  ];
  const agencyPresets = [
    t("pages.agencyHub.rejectPresets.agencyTaxId"),
    t("pages.agencyHub.rejectPresets.agencyBrand"),
    t("pages.agencyHub.rejectPresets.agencyContact"),
    t("pages.agencyHub.rejectPresets.agencyDuplicate"),
  ];
  const agentPresets = [
    t("pages.agencyHub.rejectPresets.agentProfile"),
    t("pages.agencyHub.rejectPresets.agentPhone"),
    t("pages.agencyHub.rejectPresets.agentAgency"),
  ];
  const teamPresets = [
    t("pages.agencyHub.rejectPresets.teamUnknown"),
    t("pages.agencyHub.rejectPresets.teamProfile"),
  ];
  const sourceLabel = (source: string) =>
    source === AGENCY_EMPLOYEE_SOURCES.REQUEST
      ? t("pages.agents.qosulmaSorgusu")
      : source === AGENCY_EMPLOYEE_SOURCES.LINK
        ? t("pages.agencyHub.inviteLinkSource")
        : t("pages.agents.devet");

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

      {overdue > 0 && (
        <p role="status" className="mb-6 flex items-start gap-2.5 rounded-md border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("pages.agencyHub.overdueNotice", { count: overdue })}
        </p>
      )}

      {counts.total === 0 && (
        <AdminCard className="mb-6">
          <EmptyState title={t("pages.agencyHub.queueEmpty")} description={t("pages.agencyHub.queueEmptyDescription")} />
        </AdminCard>
      )}

      {agencies.length > 0 && (
        <AdminCard id="agentlikler" title={t("pages.agencyHub.pendingAgencies")} description={t("pages.agencyHub.pendingAgenciesDescription")} className="mb-6" bodyClassName="p-0">
          <BulkSelectionForm action={bulkApproveQueue} intents={bulkIntent("agency")}>
            <ul className="divide-y divide-line">
              {agencies.map((agency) => (
                <li key={agency.id} className={rowClass}>
                  <div className="flex min-w-0 items-center gap-3">
                    <BulkRowCheckbox id={agency.id} label={t("components.bulk.selectRow", { name: agency.name })} />
                    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-sm border border-line bg-paper">
                      {agency.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- panel önizləməsi
                        <img src={agency.logoUrl} alt="" className="size-full object-contain" />
                      ) : (
                        <Building2 className="size-5 text-ink-muted" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">{agency.name}</p>
                        {waiting(agency.createdAt)}
                        {!agency.user.companyTaxId && <Badge tone="warning">{t("pages.agencyHub.taxIdMissing")}</Badge>}
                      </div>
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
                    <ReasonAction
                      action={rejectAgencyApplication}
                      id={agency.id}
                      label={t("pages.agencyHub.rejectNamed", { name: agency.name })}
                      title={t("pages.agencyHub.rejectAgencyTitle")}
                      description={t("pages.agencyHub.rejectAgencyDescription", { name: agency.name })}
                      confirmLabel={t("pages.agencyHub.reject")}
                      presets={agencyPresets}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </ReasonAction>
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
          </BulkSelectionForm>
        </AdminCard>
      )}

      {agents.length > 0 && (
        <AdminCard id="agentler" title={t("pages.agencyHub.pendingAgents")} description={t("pages.agencyHub.pendingAgentsDescription")} className="mb-6" bodyClassName="p-0">
          <BulkSelectionForm action={bulkApproveQueue} intents={bulkIntent("agent")}>
            <ul className="divide-y divide-line">
              {agents.map((agent) => (
                <li key={agent.id} className={rowClass}>
                  <div className="flex min-w-0 items-center gap-3">
                    <BulkRowCheckbox id={agent.id} label={t("components.bulk.selectRow", { name: agent.name })} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">{agent.name}</p>
                        {waiting(agent.createdAt)}
                        {agent.isPublic ? <Badge tone="gold">{t("pages.agents.ictimai")}</Badge> : <Badge tone="neutral">{t("pages.agents.gizli")}</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {[agent.agency?.name ?? t("pages.misc.musteqil"), agent.user?.email, agent.user?.phone].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/admin/agentler/${agent.id}`} aria-label={t("pages.common.profiliniRedakteEt", { p0: agent.name })} className="inline-flex size-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:text-gold-deep">
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                    <ReasonAction
                      action={rejectAgentApplication}
                      id={agent.id}
                      label={t("pages.agencyHub.rejectNamed", { name: agent.name })}
                      title={t("pages.agencyHub.rejectAgentTitle")}
                      description={t("pages.agencyHub.rejectAgentDescription", { name: agent.name })}
                      confirmLabel={t("pages.agencyHub.reject")}
                      presets={agentPresets}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </ReasonAction>
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
          </BulkSelectionForm>
        </AdminCard>
      )}

      {employees.length > 0 && (
        <AdminCard id="komanda" title={t("pages.agencyHub.pendingTeam")} description={t("pages.agents.agentlikSahiblerininDevetEtdiyi")} className="mb-6" bodyClassName="p-0">
          <BulkSelectionForm action={bulkApproveQueue} intents={bulkIntent("employee")}>
            <ul className="divide-y divide-line">
              {employees.map((employee) => (
                <li key={employee.id} className={rowClass}>
                  <div className="flex min-w-0 items-center gap-3">
                    <BulkRowCheckbox id={employee.id} label={t("components.bulk.selectRow", { name: employee.user.name })} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">{employee.user.name}</p>
                        {waiting(employee.invitedAt)}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {employee.user.email} · {employee.agency.name} · {sourceLabel(employee.source)} · {formatDateTime(employee.invitedAt)}
                      </p>
                    </div>
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
                    <ReasonAction
                      action={rejectAgencyEmployee}
                      id={employee.id}
                      label={t("pages.common.devetiniReddEt", { p0: employee.user.name })}
                      title={t("pages.agents.devetiReddEtmek")}
                      description={t("pages.common.ucunKomandaDevetiRedd", { p0: employee.user.name })}
                      confirmLabel={t("pages.agents.reddEt")}
                      presets={teamPresets}
                      required={false}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </ReasonAction>
                  </div>
                </li>
              ))}
            </ul>
          </BulkSelectionForm>
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
