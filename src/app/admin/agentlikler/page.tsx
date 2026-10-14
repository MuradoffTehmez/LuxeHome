import type { Metadata } from "next";
import { Building2, Pencil, Search, ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";
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
import { PERMISSIONS } from "@/lib/constants";
import { countAgencyOffers } from "@/lib/agency-profile";
import { buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminAgencies, getAdminAgencyEmployeeQueue } from "@/lib/queries";
import { bulkAgencies, toggleAgencyVerification } from "./actions";
import { AccountDelete } from "../hesablar/account-delete";
import { BulkRowCheckbox, BulkSelectionForm } from "@/components/admin/bulk-selection";
import { AgencyProfileRepair } from "./agency-profile-repair";
import { AgencyLogoEditor } from "./agency-logo-editor";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.agents.agentlikler") };
}
export const dynamic = "force-dynamic";

const STATUSES = ["all", "pending", "verified", "missing"] as const;
type StatusFilter = (typeof STATUSES)[number];

export default async function AdminAgenciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const params = await searchParams;
  const status: StatusFilter = STATUSES.includes(params.status as StatusFilter) ? (params.status as StatusFilter) : "all";
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const [allAgencies, employeeQueue] = await Promise.all([
    getAdminAgencies(),
    getAdminAgencyEmployeeQueue(),
  ]);
  const matchesStatus = (account: (typeof allAgencies)[number], value: StatusFilter) =>
    value === "all"
    || (value === "pending" && account.agency != null && !account.agency.isVerified)
    || (value === "verified" && account.agency?.isVerified === true)
    || (value === "missing" && account.agency == null);
  const needle = query.toLocaleLowerCase("az");
  const agencies = allAgencies.filter((account) =>
    matchesStatus(account, status)
    && (!needle || [account.agency?.name, account.name, account.email].some((value) => value?.toLocaleLowerCase("az").includes(needle))),
  );
  const tabs = [
    { value: "all" as const, label: t("pages.agencyHub.tabAll") },
    { value: "pending" as const, label: t("pages.agencyHub.tabPending") },
    { value: "verified" as const, label: t("pages.agencyHub.tabVerified") },
    { value: "missing" as const, label: t("pages.agencyHub.tabMissing") },
  ].map((tab) => ({ ...tab, count: allAgencies.filter((account) => matchesStatus(account, tab.value)).length }));
  const tabHref = (value: StatusFilter) => {
    const next = new URLSearchParams();
    if (value !== "all") next.set("status", value);
    if (query) next.set("q", query);
    const text = next.toString();
    return text ? `/admin/agentlikler?${text}` : "/admin/agentlikler";
  };
  // Təklif sayı sahib + təsdiqlənmiş agentlərin elanlarıdır — ictimai kataloqla eyni qayda.
  const offers = await countAgencyOffers(
    agencies.flatMap((account) => (account.agency ? [{ id: account.agency.id, userId: account.id }] : [])),
  );
  const offerTotal = (account: (typeof agencies)[number]) => (account.agency ? offers.get(account.agency.id)?.total ?? 0 : 0);
  const editLink = (account: (typeof agencies)[number]) => account.agency ? (
    <Link
      href={`/admin/agentlikler/${account.agency.id}`}
      aria-label={t("pages.agencyHub.editNamed", { name: account.agency.name })}
      className="inline-flex size-11 items-center justify-center rounded-xs text-ink-soft transition-colors hover:text-gold-deep"
    >
      <Pencil className="size-4" aria-hidden="true" />
    </Link>
  ) : null;
  const logo = (account: (typeof agencies)[number]) => (
    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xs border border-line bg-paper">
      {account.agency?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- panel önizləməsi
        <img src={account.agency.logoUrl} alt="" className="size-full object-contain p-0.5" />
      ) : (
        <Building2 className="size-4 text-ink-muted" aria-hidden="true" />
      )}
    </span>
  );
  const bulkIntents = [
    { intent: "approve", label: t("components.bulk.approve"), icon: "approve" as const },
    { intent: "revoke", label: t("components.bulk.revoke"), icon: "revoke" as const },
    {
      intent: "delete",
      label: t("components.bulk.delete"),
      icon: "delete" as const,
      tone: "danger" as const,
      confirm: {
        title: t("components.bulk.deleteAgenciesTitle"),
        description: t("components.bulk.deleteAgenciesDescription"),
        confirmLabel: t("components.bulk.delete"),
      },
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={t("pages.agents.agentlikler")}
        description={t("pages.agents.yalnizTesdiqlenmisAgentliklerIctimai")}
        breadcrumbs={[{ label: t("pages.agents.idarePaneli"), href: "/admin" }, { label: t("pages.agents.agentlikler") }]}
      />

      {employeeQueue.length > 0 && (
        <AdminCard className="mb-6">
          <Link href="/admin/agentlikler/tesdiq#komanda" className="text-sm font-medium text-gold-deep hover:underline">
            {t("pages.agencyHub.teamQueueLink", { count: employeeQueue.length })}
          </Link>
        </AdminCard>
      )}

      {/* Status tabları və axtarış — URL-dədir, JS-siz də işləyir. */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label={t("pages.agencyHub.statusNav")} className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tabHref(tab.value)}
              aria-current={status === tab.value ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors",
                status === tab.value ? "border-gold bg-gold/10 font-medium text-ink" : "border-line bg-paper text-ink-soft hover:border-gold",
              )}
            >
              {tab.label}
              <span className="tabular text-xs text-ink-muted">{tab.count}</span>
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" role="search" aria-label={t("pages.agencyHub.searchLabel")}>
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <label htmlFor="agency-admin-search" className="sr-only">{t("pages.agencyHub.searchLabel")}</label>
          <input
            id="agency-admin-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t("pages.agencyHub.searchPlaceholder")}
            className="min-h-11 w-full min-w-0 rounded-sm border border-line-strong bg-paper px-3 text-sm text-ink lg:w-72"
          />
          <button type="submit" className={buttonClassName("outline", "sm", false, "min-h-11 shrink-0")}>
            <Search className="size-4" aria-hidden="true" />
            <span className="sr-only">{t("pages.agencyHub.searchLabel")}</span>
          </button>
        </form>
      </div>

      <AdminCard bodyClassName="p-0">
        <BulkSelectionForm action={bulkAgencies} intents={bulkIntents}>
        <div className="p-4 lg:p-0">
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
              title={
                <span className="flex items-center gap-2">
                  <BulkRowCheckbox id={account.id} label={t("components.bulk.selectRow", { name: account.agency?.name ?? account.name })} />
                  {logo(account)}
                  {account.agency?.name ?? account.name}
                </span>
              }
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
              actions={<>{editLink(account)}{account.agency ? (
                <ConfirmAction
                  action={toggleAgencyVerification}
                  id={account.agency.id}
                  label={account.agency.isVerified ? t("pages.common.tesdiqiniLegvEt", { p0: account.agency.name }) : t("pages.common.tesdiqle2", { p0: account.agency.name })}
                  title={account.agency.isVerified ? t("pages.misc.tesdiqiLegvEtmek") : t("pages.misc.agentliyiTesdiqlemek")}
                  description={
                    account.agency.isVerified
                      ? t("pages.misc.agentlikIctimaiSehifedenGizledilecek")
                      : t("pages.misc.agentlikIctimaiAgentliklerSehifesinde")
                  }
                  confirmLabel={account.agency.isVerified ? t("pages.misc.legvEt") : t("pages.misc.tesdiqle")}
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
              <AccountDelete id={account.id} name={account.agency?.name ?? account.name} className="size-11" />
              </>}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="tabular">{t("pages.agencyHub.offerCount", { count: offerTotal(account) })}</span>
                {!account.isActive ? <Badge tone="neutral">{t("pages.agents.deaktivHesab")}</Badge> : null}
              </div>
              {account.agency ? (
                <AgencyLogoEditor agencyId={account.agency.id} name={account.agency.name} logoUrl={account.agency.logoUrl} />
              ) : null}
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
                { label: t("components.bulk.select"), srOnly: true, className: "w-9" },
                { label: t("pages.agents.agentlik") },
                { label: t("pages.agencyHub.offersColumn") },
                { label: t("pages.agents.qeydiyyatTarixi") },
                { label: t("pages.agents.status") },
                { label: t("pages.agents.idareetme"), className: "text-right" },
              ]}
            >
              {items.map((account) => (
                <AdminTableRow key={account.id}>
                  <AdminTableCell className="w-9">
                    <BulkRowCheckbox id={account.id} label={t("components.bulk.selectRow", { name: account.agency?.name ?? account.name })} />
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="flex items-center gap-2">
                      {logo(account)}
                      <span className="font-medium text-ink">{account.agency?.name ?? account.name}</span>
                    </span>
                    <p className="mt-0.5 text-xs text-ink-muted">{account.email}</p>
                    {!account.isActive && (
                      <Badge tone="neutral" className="mt-1">{t("pages.agents.deaktivHesab")}</Badge>
                    )}
                    {account.agency ? (
                      <AgencyLogoEditor agencyId={account.agency.id} name={account.agency.name} logoUrl={account.agency.logoUrl} />
                    ) : null}
                  </AdminTableCell>
                  <AdminTableCell className="tabular">{offerTotal(account)}</AdminTableCell>
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
                      {editLink(account)}
                      {!account.agency ? (
                        <AgencyProfileRepair userId={account.id} defaultName={account.name} />
                      ) : (
                      <ConfirmAction
                        action={toggleAgencyVerification}
                        id={account.agency.id}
                        label={account.agency.isVerified ? t("pages.common.tesdiqiniLegvEt", { p0: account.agency.name }) : t("pages.common.tesdiqle2", { p0: account.agency.name })}
                        title={account.agency.isVerified ? t("pages.misc.tesdiqiLegvEtmek") : t("pages.misc.agentliyiTesdiqlemek")}
                        description={
                          account.agency.isVerified
                            ? t("pages.misc.agentlikIctimaiSehifedenGizledilecek")
                            : t("pages.misc.agentlikIctimaiAgentliklerSehifesinde")
                        }
                        confirmLabel={account.agency.isVerified ? t("pages.misc.legvEt") : t("pages.misc.tesdiqle")}
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
                      <AccountDelete id={account.id} name={account.agency?.name ?? account.name} className="size-11" />
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        />
        </div>
        </BulkSelectionForm>
      </AdminCard>
    </>
  );
}
