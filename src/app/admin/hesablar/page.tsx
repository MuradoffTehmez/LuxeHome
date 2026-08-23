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
import { formatRelative } from "@/lib/utils";
import { ACCOUNT_TYPE_LABELS, PERMISSIONS, type AccountType } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminPublicAccounts } from "@/lib/queries";

export const metadata: Metadata = { title: "Hesablar" };
export const dynamic = "force-dynamic";

const TYPE_TONE: Record<AccountType, "gold" | "dark" | "neutral"> = {
  STAFF: "dark",
  OWNER: "gold",
  AGENCY: "gold",
  USER: "neutral",
};

export default async function AdminPublicAccountsPage() {
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const accounts = await getAdminPublicAccounts();

  return (
    <>
      <AdminPageHeader
        title="Hesablar"
        description="İctimai qeydiyyatdan keçən istifadəçi, mülk sahibi və agentlik hesabları. Əməkdaş hesabları «İstifadəçilər» bölməsindədir."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Hesablar" }]}
      />

      <AdminCard bodyClassName="p-4 lg:p-0">
        <AdminResponsiveList
          ariaLabel="İctimai hesablar"
          items={accounts}
          getKey={(account) => account.id}
          empty={<p className="py-10 text-center text-sm text-ink-muted">Hələ ictimai hesab yoxdur.</p>}
          renderCard={(account) => (
            <AdminListCard
              title={account.name}
              meta={account.email}
              status={<Badge tone={TYPE_TONE[account.accountType as AccountType]}>{ACCOUNT_TYPE_LABELS[account.accountType as AccountType]}</Badge>}
              actions={<AccountToggle id={account.id} name={account.name} isActive={account.isActive} className="size-11" />}
            >
              {!account.isActive ? <Badge tone="neutral">Deaktiv</Badge> : null}
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <dt className="text-xs text-ink-muted">Elan</dt>
                  <dd className="tabular mt-1 text-ink">{account._count.properties}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Favorit</dt>
                  <dd className="tabular mt-1 text-ink">{account._count.favorites}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Son giriş</dt>
                  <dd className="mt-1 text-ink">{account.lastLoginAt ? formatRelative(account.lastLoginAt) : "Heç vaxt"}</dd>
                </div>
              </dl>
            </AdminListCard>
          )}
          renderTable={(items) => (
            <AdminTable
              caption="Hesablar"
              headers={[
                { label: "Hesab" },
                { label: "Növ" },
                { label: "Elan" },
                { label: "Favorit" },
                { label: "Son giriş", className: "text-right" },
                { label: "İdarəetmə", className: "text-right" },
              ]}
            >
              {items.map((account) => (
                <AdminTableRow key={account.id}>
                  <AdminTableCell>
                    <span className="font-medium text-ink">{account.name}</span>
                    <p className="mt-0.5 text-xs text-ink-muted">{account.email}</p>
                    {!account.isActive ? <Badge tone="neutral" className="mt-1">Deaktiv</Badge> : null}
                  </AdminTableCell>
                  <AdminTableCell><Badge tone={TYPE_TONE[account.accountType as AccountType]}>{ACCOUNT_TYPE_LABELS[account.accountType as AccountType]}</Badge></AdminTableCell>
                  <AdminTableCell className="tabular">{account._count.properties}</AdminTableCell>
                  <AdminTableCell className="tabular">{account._count.favorites}</AdminTableCell>
                  <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">{account.lastLoginAt ? formatRelative(account.lastLoginAt) : "Heç vaxt"}</AdminTableCell>
                  <AdminTableCell align="right"><div className="flex justify-end"><AccountToggle id={account.id} name={account.name} isActive={account.isActive} className="size-11" /></div></AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        />
      </AdminCard>
    </>
  );
}
