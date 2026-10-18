import type { Metadata } from "next";
import Link from "next/link";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { getAdminI18n } from "@/lib/admin-i18n";
import { requireAdminRead } from "@/lib/admin/guard";
import { PERMISSIONS } from "@/lib/constants";
import { formatLocalizedDateTime } from "@/i18n/date";
import { listSupportTickets } from "@/lib/telegram-bot/support";
import { SUPPORT_STATUSES } from "@/lib/telegram-bot/policy";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.support.title") };
}
export const dynamic = "force-dynamic";

const TONES = { OPEN: "warning", ANSWERED: "info", CLOSED: "neutral" } as const;

/** Telegram dəstək müraciətləri (`lead:manage`). Defolt görünüş — açıq və cavablandırılmış müraciətlər. */
export default async function SupportListPage({ searchParams }: { searchParams: Promise<{ status?: string; sehife?: string }> }) {
  await requireAdminRead(PERMISSIONS.LEAD_MANAGE);
  const { t, locale } = await getAdminI18n();
  const params = await searchParams;
  const status = params.status && (Object.values(SUPPORT_STATUSES) as string[]).includes(params.status) ? params.status : null;
  const page = Number.parseInt(params.sehife ?? "1", 10) || 1;
  const list = await listSupportTickets({ status, page });
  const tabs = [
    { key: null, label: t("pages.support.tabs.active") },
    ...Object.values(SUPPORT_STATUSES).map((value) => ({ key: value, label: t(`pages.support.status.${value}`) })),
  ];

  return (
    <>
      <AdminPageHeader
        title={t("pages.support.title")}
        description={t("pages.support.description", { open: list.openCount })}
        breadcrumbs={[{ label: t("pages.moderation.idarePaneli"), href: "/admin" }, { label: t("pages.support.title") }]}
      />
      <nav aria-label={t("pages.support.filter")} className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key ?? "active"}
            href={tab.key ? `/admin/destek?status=${tab.key}` : "/admin/destek"}
            aria-current={status === tab.key ? "page" : undefined}
            className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-sm text-ink aria-[current=page]:border-gold aria-[current=page]:bg-gold/15"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <AdminCard bodyClassName="p-0">
        {list.items.length === 0 ? (
          <p className="p-5 text-sm text-ink-muted">{t("pages.support.empty")}</p>
        ) : (
          <AdminTable
            caption={t("pages.support.title")}
            headers={[
              { label: t("pages.support.columns.who") },
              { label: t("pages.support.columns.status") },
              { label: t("pages.support.columns.messages") },
              { label: t("pages.support.columns.updated") },
            ]}
          >
            {list.items.map((ticket) => (
              <AdminTableRow key={ticket.id}>
                <AdminTableCell>
                  <Link href={`/admin/destek/${ticket.id}`} className="font-medium text-ink hover:text-gold-deep">
                    {ticket.user?.name ?? ticket.name ?? t("pages.support.anonymous")}
                  </Link>
                  <span className="block text-xs text-ink-muted">{ticket.userId ? t("pages.support.linked") : t("pages.support.notLinked")} · № {ticket.id.slice(-8)}</span>
                </AdminTableCell>
                <AdminTableCell>
                  <Badge tone={TONES[ticket.status as keyof typeof TONES] ?? "neutral"}>{t(`pages.support.status.${ticket.status === "ANSWERED" ? "ANSWERED" : ticket.status === "CLOSED" ? "CLOSED" : "OPEN"}`)}</Badge>
                </AdminTableCell>
                <AdminTableCell>{ticket._count.messages}</AdminTableCell>
                <AdminTableCell>{formatLocalizedDateTime(ticket.updatedAt, locale, "short")}</AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
      </AdminCard>
      {list.pages > 1 ? (
        <nav className="mt-4 flex justify-between text-sm" aria-label={t("pages.support.pagination")}>
          {page > 1 ? <Link className="min-h-11 py-3 text-gold-deep" href={`/admin/destek?${status ? `status=${status}&` : ""}sehife=${page - 1}`}>{t("pages.support.prev")}</Link> : <span />}
          {page < list.pages ? <Link className="min-h-11 py-3 text-gold-deep" href={`/admin/destek?${status ? `status=${status}&` : ""}sehife=${page + 1}`}>{t("pages.support.next")}</Link> : null}
        </nav>
      ) : null}
    </>
  );
}
