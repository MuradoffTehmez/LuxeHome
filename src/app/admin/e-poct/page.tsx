import { getAdminT } from "@/lib/admin-i18n";
import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Inbox, Info, Mail, MailCheck, MailWarning, Send } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow, StatCard } from "@/components/admin/admin-ui";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminEmailActivities, getAdminEmailOverview } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import { corporateEmails } from "@/config/site";
import { hasRuntimeEnv } from "@/lib/runtime-env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.ops.korporativEPoct") };
}
export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  "email.sent": "Göndərildi",
  "email.delivered": "Çatdırıldı",
  "email.opened": "Açıldı",
  "email.clicked": "Keçid açıldı",
  "email.bounced": "Geri qayıtdı",
  "email.failed": "Xəta",
  "email.complained": "Spam şikayəti",
  "email.delivery_delayed": "Gecikir",
  "email.suppressed": "Bloklandı",
  "email.received": "Qəbul edildi",
};

const CORPORATE_MAILBOXES = [
  { address: corporateEmails.info, purpose: "Ümumi əlaqə və rəsmi yazışmalar", route: "Google Workspace" },
  { address: corporateEmails.sales, purpose: "Satış müraciətləri və əmlak sorğuları", route: "Google Workspace · info@ aliası" },
  { address: corporateEmails.support, purpose: "İstifadəçi dəstəyi və cavablar", route: "Google Workspace · info@ aliası" },
  { address: corporateEmails.partners, purpose: "Agentlik və tərəfdaşlıq müraciətləri", route: "Google Workspace · info@ aliası" },
  { address: corporateEmails.notifications, purpose: "Saytın avtomatik göndəriş ünvanı", route: "Resend göndərən kimliyi" },
  { address: corporateEmails.security, purpose: "Təhlükəsizlik bildirişləri", route: "Google Workspace · info@ aliası" },
  { address: corporateEmails.finance, purpose: "Maliyyə və hesablaşma yazışmaları", route: "Google Workspace · info@ aliası" },
] as const;

function recipients(value: string): string {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").join(", ") : "—";
  } catch {
    return "—";
  }
}

export default async function AdminEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getAdminT();
  await requireAdminRead(PERMISSIONS.LEAD_MANAGE);
  const params = await searchParams;
  const one = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const page = Math.max(1, Number(one("sehife")) || 1);
  const filters = { query: one("q"), direction: one("istiqamet"), eventType: one("hadise") };
  const [{ rows, total, pageCount }, overview] = await Promise.all([
    getAdminEmailActivities(page, filters),
    getAdminEmailOverview(),
  ]);
  const webhookConfigured = hasRuntimeEnv("RESEND_WEBHOOK_SECRET");
  const senderConfigured = hasRuntimeEnv("RESEND_API_KEY");

  const buildHref = (target: number) => {
    const query = new URLSearchParams();
    if (filters.query) query.set("q", filters.query);
    if (filters.direction) query.set("istiqamet", filters.direction);
    if (filters.eventType) query.set("hadise", filters.eventType);
    if (target > 1) query.set("sehife", String(target));
    return query.size ? `/admin/e-poct?${query}` : "/admin/e-poct";
  };

  return (
    <>
      <AdminPageHeader title={t("pages.ops.korporativEPoct")} description={`${total} məktub üzrə göndəriş, çatdırılma və qəbul metadatası.`} breadcrumbs={[{ label: t("pages.ops.idarePaneli"), href: "/admin" }, { label: t("pages.ops.korporativEPoct") }]} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("pages.ops.butunFealiyyet")} value={overview.total} hint={t("pages.ops.mezmunDeyilYalnizMetadata")} icon={Mail} />
        <StatCard label={t("pages.ops.gonderilen")} value={overview.outbound} hint={`${overview.delivered} çatdırılma təsdiqi`} icon={Send} tone="gold" />
        <StatCard label={t("pages.ops.daxilOlan")} value={overview.inbound} hint={t("pages.ops.webhookIleQeydeAlinir")} icon={Inbox} tone="success" />
        <StatCard label={t("pages.ops.problemli")} value={overview.problems} hint={t("pages.ops.xetaBounceSpamVe")} icon={AlertTriangle} tone={overview.problems > 0 ? "warning" : "success"} />
      </div>

      <AdminCard className="mb-6" bodyClassName="p-4 sm:p-5">
        <div className="flex items-start gap-3 text-sm">
          {webhookConfigured ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" /> : <Info className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />}
          <div>
            <p className="font-medium text-ink">{webhookConfigured ? "Resend webhook secret-i aktivdir" : "Resend webhook quraşdırılması tamamlanmalıdır"}</p>
            <p className="mt-1 text-ink-soft">
              {t("pages.ops.gonderisXidmeti")} <strong className="text-ink">{senderConfigured ? "aktiv" : "konfiqurasiya edilməyib"}</strong>. {webhookConfigured ? "Çatdırılma hadisələri imza yoxlanışından sonra avtomatik qeydə alınır." : <>{t("pages.ops.resendPanelinde")} <code>/api/webhooks/resend</code> {t("pages.ops.endpointIUcunHadiseleri")} <code>RESEND_WEBHOOK_SECRET</code> {t("pages.ops.kimiElaveEdin")}</>} Məktub məzmunu bu cədvəldə saxlanılmır.
            </p>
          </div>
        </div>
      </AdminCard>

      <AdminCard className="mb-6" title={t("pages.ops.korporativUnvanlar")} description={t("pages.ops.qebulGoogleWorkspaceAvtomatik")} bodyClassName="p-0">
        <AdminTable caption={t("pages.ops.korporativEPoctUnvanlari")} headers={[{ label: t("pages.ops.unvan") }, { label: t("pages.ops.istifadeMeqsedi") }, { label: t("pages.ops.marsrut") }, { label: t("pages.ops.status"), className: "text-right" }] }>
          {CORPORATE_MAILBOXES.map((mailbox) => (
            <AdminTableRow key={mailbox.address}>
              <AdminTableCell className="font-medium [overflow-wrap:anywhere]">{mailbox.address}</AdminTableCell>
              <AdminTableCell className="text-ink-soft">{mailbox.purpose}</AdminTableCell>
              <AdminTableCell className="text-xs text-ink-muted">{mailbox.route}</AdminTableCell>
              <AdminTableCell align="right"><Badge tone="success">{t("pages.ops.aktiv")}</Badge></AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      </AdminCard>

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar action="/admin/e-poct" searchValue={filters.query} searchPlaceholder={t("pages.ops.gonderenAlanVeYa")} resultLabel={`${total} məktub`} selects={[
          { name: "istiqamet", label: t("pages.ops.istiqamet"), value: filters.direction, options: [{ value: "", label: t("pages.ops.hamisi") }, { value: "INBOUND", label: t("pages.ops.daxilOlan") }, { value: "OUTBOUND", label: t("pages.ops.gonderilen") }] },
          { name: "hadise", label: t("pages.ops.hadise"), value: filters.eventType, options: [{ value: "", label: t("pages.ops.butunHadiseler") }, ...Object.entries(EVENT_LABELS).map(([value, label]) => ({ value, label }))] },
        ]} />
        {rows.length === 0 ? <EmptyState title={t("pages.ops.ePoctFealiyyetiYoxdur")} description={t("pages.ops.gonderislerAvtomatikDigerHadiseler")} /> : (
          <AdminTable caption={t("pages.ops.korporativEPoctFealiyyeti")} headers={[{ label: t("pages.ops.tarix") }, { label: t("pages.ops.istiqamet") }, { label: t("pages.ops.status") }, { label: t("pages.ops.movzu") }, { label: t("pages.ops.gonderen") }, { label: t("pages.ops.alan") }, { label: t("pages.ops.qosma") }] }>
            {rows.map((row) => (
              <AdminTableRow key={row.id}>
                <AdminTableCell className="whitespace-nowrap text-xs text-ink-muted">{formatDateTime(row.lastEventAt)}</AdminTableCell>
                <AdminTableCell><Badge tone={row.direction === "INBOUND" ? "gold" : "neutral"}>{row.direction === "INBOUND" ? <><MailCheck className="mr-1 size-3" />{t("pages.ops.daxilOlan")}</> : <><MailWarning className="mr-1 size-3" />{t("pages.ops.gonderilen")}</>}</Badge></AdminTableCell>
                <AdminTableCell><Badge tone={row.eventType === "email.failed" || row.eventType === "email.bounced" ? "danger" : row.eventType === "email.delivered" || row.eventType === "email.received" ? "success" : "neutral"}>{EVENT_LABELS[row.eventType] ?? row.eventType}</Badge></AdminTableCell>
                <AdminTableCell className="max-w-xs"><span className="line-clamp-2">{row.subject || "Mövzusuz"}</span></AdminTableCell>
                <AdminTableCell className="max-w-56 text-xs text-ink-muted [overflow-wrap:anywhere]">{row.fromAddress || "—"}</AdminTableCell>
                <AdminTableCell className="max-w-56 text-xs text-ink-muted [overflow-wrap:anywhere]">{recipients(row.toAddresses)}</AdminTableCell>
                <AdminTableCell className="tabular text-center">{row.attachmentCount}</AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}
        {pageCount > 1 ? <div className="border-t border-line px-5 py-4"><Pagination page={page} totalPages={pageCount} buildHref={buildHref} /></div> : null}
      </AdminCard>
    </>
  );
}
