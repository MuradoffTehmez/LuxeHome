import type { Metadata } from "next";
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
import { AccountToggle } from "./account-toggle";
import { AccountApproval } from "./account-approval";
import { formatRelative } from "@/lib/utils";
import { PERMISSIONS, type AccountType } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminPublicAccounts } from "@/lib/queries";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.users.hesablar") };
}
export const dynamic = "force-dynamic";

const TYPE_TONE: Record<AccountType, "gold" | "dark" | "neutral"> = {
  STAFF: "dark",
  OWNER: "gold",
  AGENCY: "gold",
  USER: "neutral",
};

export default async function AdminPublicAccountsPage() {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const accounts = await getAdminPublicAccounts();

  return (
    <>
      <AdminPageHeader
        title={t("pages.users.hesablar")}
        description={t("pages.users.ictimaiQeydiyyatdanKecenIstifadeci")}
        breadcrumbs={[{ label: t("pages.users.idarePaneli"), href: "/admin" }, { label: t("pages.users.hesablar") }]}
      />

      <AdminCard bodyClassName="p-4 lg:p-0">
        <AdminResponsiveList
          ariaLabel={t("pages.users.ictimaiHesablar")}
          items={accounts}
          getKey={(account) => account.id}
          empty={<p className="py-10 text-center text-sm text-ink-muted">{t("pages.users.heleIctimaiHesabYoxdur")}</p>}
          renderCard={(account) => (
            <AdminListCard
              title={account.name}
              meta={account.email}
              status={<Badge tone={TYPE_TONE[account.accountType as AccountType]}>{t(`labels.accountType.${account.accountType as AccountType}`)}</Badge>}
              actions={
                <>
                  <AccountApproval id={account.id} name={account.name} approved={Boolean(account.approvedAt)} className="size-11" />
                  <AccountToggle id={account.id} name={account.name} isActive={account.isActive} className="size-11" />
                </>
              }
            >
              <div className="flex flex-wrap gap-2">
                <Badge tone={account.approvedAt ? "success" : "warning"}>
                  {account.approvedAt ? t("pages.misc.tesdiqlenib") : t("pages.misc.tesdiqGozleyir")}
                </Badge>
                {!account.isActive ? <Badge tone="neutral">{t("pages.users.bloklanib")}</Badge> : null}
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <dt className="text-xs text-ink-muted">{t("pages.users.elan")}</dt>
                  <dd className="tabular mt-1 text-ink">{account._count.properties}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">{t("pages.users.favorit")}</dt>
                  <dd className="tabular mt-1 text-ink">{account._count.favorites}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">{t("pages.users.sonGiris")}</dt>
                  <dd className="mt-1 text-ink">{account.lastLoginAt ? formatRelative(account.lastLoginAt) : t("pages.misc.hecVaxt")}</dd>
                </div>
              </dl>
            </AdminListCard>
          )}
          renderTable={(items) => (
            <AdminTable
              caption={t("pages.users.hesablar")}
              headers={[
                { label: t("pages.users.hesab") },
                { label: t("pages.users.nov") },
                { label: t("pages.users.tesdiq") },
                { label: t("pages.users.elan") },
                { label: t("pages.users.favorit") },
                { label: t("pages.users.sonGiris"), className: "text-right" },
                { label: t("pages.users.idareetme"), className: "text-right" },
              ]}
            >
              {items.map((account) => (
                <AdminTableRow key={account.id}>
                  <AdminTableCell>
                    <span className="font-medium text-ink">{account.name}</span>
                    <p className="mt-0.5 text-xs text-ink-muted">{account.email}</p>
                    {!account.isActive ? <Badge tone="neutral" className="mt-1">{t("pages.users.deaktiv")}</Badge> : null}
                  </AdminTableCell>
                  <AdminTableCell><Badge tone={TYPE_TONE[account.accountType as AccountType]}>{t(`labels.accountType.${account.accountType as AccountType}`)}</Badge></AdminTableCell>
                  <AdminTableCell>
                    <Badge tone={account.approvedAt ? "success" : "warning"}>
                      {account.approvedAt ? t("pages.misc.tesdiqlenib") : t("pages.misc.gozleyir")}
                    </Badge>
                  </AdminTableCell>
                  <AdminTableCell className="tabular">{account._count.properties}</AdminTableCell>
                  <AdminTableCell className="tabular">{account._count.favorites}</AdminTableCell>
                  <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">{account.lastLoginAt ? formatRelative(account.lastLoginAt) : t("pages.misc.hecVaxt")}</AdminTableCell>
                  <AdminTableCell align="right">
                    <div className="flex justify-end">
                      <AccountApproval id={account.id} name={account.name} approved={Boolean(account.approvedAt)} className="size-11" />
                      <AccountToggle id={account.id} name={account.name} isActive={account.isActive} className="size-11" />
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
