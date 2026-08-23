import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
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

      <AdminCard bodyClassName="p-0">
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
          {accounts.length === 0 && (
            <AdminTableRow>
              <AdminTableCell className="py-8 text-center text-sm text-ink-muted">
                Hələ ictimai hesab yoxdur.
              </AdminTableCell>
            </AdminTableRow>
          )}

          {accounts.map((account) => (
            <AdminTableRow key={account.id}>
              <AdminTableCell>
                <span className="font-medium text-ink">{account.name}</span>
                <p className="mt-0.5 text-xs text-ink-muted">{account.email}</p>
                {!account.isActive && <Badge tone="neutral" className="mt-1">Deaktiv</Badge>}
              </AdminTableCell>

              <AdminTableCell>
                <Badge tone={TYPE_TONE[account.accountType as AccountType]}>
                  {ACCOUNT_TYPE_LABELS[account.accountType as AccountType]}
                </Badge>
              </AdminTableCell>

              <AdminTableCell className="tabular">{account._count.properties}</AdminTableCell>
              <AdminTableCell className="tabular">{account._count.favorites}</AdminTableCell>

              <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                {account.lastLoginAt ? formatRelative(account.lastLoginAt) : "Heç vaxt"}
              </AdminTableCell>

              <AdminTableCell align="right">
                <div className="flex justify-end">
                  <AccountToggle id={account.id} name={account.name} isActive={account.isActive} />
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      </AdminCard>
    </>
  );
}
