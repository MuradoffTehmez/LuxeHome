import type { Metadata } from "next";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { prisma } from "@/lib/prisma";
import { findManyInChunks } from "@/lib/d1-chunks";
import { formatLocalizedDateTime } from "@/i18n/date";
import { getPaymentProvider } from "@/lib/payments/provider";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.finance.payments.title"), robots: { index: false, follow: false } };
}

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TONE = { PENDING: "warning", SUCCEEDED: "success", FAILED: "danger", REFUNDED: "neutral" } as const;

/**
 * Ödəniş əməliyyatları (#246, PRD 16.7) — yalnız oxu. Provayder qoşulmayıb, ona görə siyahı adətən boşdur;
 * səhifə gələcək inteqrasiyada uğursuz, gözləyən və geri qaytarılmış ödənişləri izləmək üçündür.
 */
export default async function PaymentsPage() {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.BILLING_MANAGE);
  const transactions = await prisma.paymentTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, userId: true, provider: true, kind: true, amountMinor: true, currency: true, status: true, failureReason: true, invoiceNumber: true, createdAt: true },
  });
  const users = await findManyInChunks([...new Set(transactions.map((row) => row.userId))], 0, (chunk) =>
    prisma.user.findMany({ where: { id: { in: chunk } }, select: { id: true, email: true } }));
  const emailOf = new Map(users.map((user) => [user.id, user.email]));
  const provider = getPaymentProvider();

  return (
    <>
      <AdminPageHeader title={t("pages.finance.payments.title")} description={t("pages.finance.payments.description")} />
      <div role="note" className="mb-6 rounded-lg border border-line bg-paper p-4 text-sm text-ink">
        {provider ? t("pages.finance.payments.provider", { id: provider.id }) : t("pages.finance.payments.noProvider")}
      </div>
      <AdminCard title={t("pages.finance.payments.listTitle")}>
        {transactions.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("pages.finance.payments.empty")}</p>
        ) : (
          <AdminTable
            caption={t("pages.finance.payments.listTitle")}
            headers={[
              { label: t("pages.finance.payments.date") },
              { label: t("pages.finance.subscriptions.account") },
              { label: t("pages.finance.payments.amount") },
              { label: t("pages.finance.subscriptions.statusLabel") },
              { label: t("pages.finance.payments.invoice") },
            ]}
          >
            {transactions.map((row) => (
              <AdminTableRow key={row.id}>
                <AdminTableCell className="whitespace-nowrap text-xs">{formatLocalizedDateTime(row.createdAt, locale)}</AdminTableCell>
                <AdminTableCell>{emailOf.get(row.userId) ?? "—"}</AdminTableCell>
                <AdminTableCell className="tabular-nums">{row.kind === "REFUND" ? "−" : ""}{money.format(row.amountMinor / 100)} {row.currency}</AdminTableCell>
                <AdminTableCell>
                  <Badge tone={TONE[row.status as keyof typeof TONE] ?? "neutral"}>{t(`pages.finance.paymentStatus.${row.status as "PENDING"}`)}</Badge>
                  {row.failureReason && <span className="mt-1 block text-xs text-danger">{row.failureReason}</span>}
                </AdminTableCell>
                <AdminTableCell className="font-mono text-xs">{row.invoiceNumber ?? "—"}</AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
