import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { getAdminI18n } from "@/lib/admin-i18n";
import { requireAdminRead } from "@/lib/admin/guard";
import { PERMISSIONS } from "@/lib/constants";
import { formatLocalizedDateTime } from "@/i18n/date";
import { getSupportTicket } from "@/lib/telegram-bot/support";
import { SupportForms } from "./support-forms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getAdminI18n();
  return { title: t("pages.support.title") };
}
export const dynamic = "force-dynamic";

/** Bir dəstək müraciəti: yazışma və cavab forması. Hesab bağlıdırsa yalnız ad və e-poçt göstərilir (operatorun işi üçün). */
export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminRead(PERMISSIONS.LEAD_MANAGE);
  const { t, locale } = await getAdminI18n();
  const ticket = await getSupportTicket((await params).id);
  if (!ticket) notFound();
  const status = ticket.status === "ANSWERED" ? "ANSWERED" : ticket.status === "CLOSED" ? "CLOSED" : "OPEN";

  return (
    <>
      <AdminPageHeader
        title={t("pages.support.ticketTitle", { id: ticket.id.slice(-8) })}
        description={ticket.user ? `${ticket.user.name} · ${ticket.user.email}` : ticket.name ?? t("pages.support.anonymous")}
        breadcrumbs={[{ label: t("pages.moderation.idarePaneli"), href: "/admin" }, { label: t("pages.support.title"), href: "/admin/destek" }, { label: ticket.id.slice(-8) }]}
      />
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <AdminCard title={t("pages.support.thread")} actions={<Badge tone={status === "OPEN" ? "warning" : status === "ANSWERED" ? "info" : "neutral"}>{t(`pages.support.status.${status}`)}</Badge>}>
          <ol className="flex flex-col gap-3">
            {ticket.messages.map((message) => (
              <li
                key={message.id}
                className={message.direction === "OUT" ? "ml-auto max-w-[85%] rounded-lg bg-gold/15 px-4 py-3" : "mr-auto max-w-[85%] rounded-lg border border-line bg-paper px-4 py-3"}
              >
                <p className="text-xs text-ink-muted">
                  {message.direction === "OUT" ? t("pages.support.operator") : t("pages.support.customer")} · {formatLocalizedDateTime(message.createdAt, locale, "short")}
                </p>
                <p className="mt-1 text-sm break-words whitespace-pre-wrap text-ink">{message.body}</p>
              </li>
            ))}
          </ol>
        </AdminCard>
        <AdminCard title={t("pages.support.replyTitle")}>
          {status === "CLOSED" ? (
            <p className="text-sm text-ink-muted">{t("pages.support.closedHint")}</p>
          ) : (
            <SupportForms ticketId={ticket.id} canDeliver={Boolean(ticket.chatId)} />
          )}
        </AdminCard>
      </div>
    </>
  );
}
