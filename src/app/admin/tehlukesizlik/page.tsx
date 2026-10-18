import type { Metadata } from "next";
import Link from "next/link";
import { getAdminI18n, getAdminT } from "@/lib/admin-i18n";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getSecurityOverview, isSecurityEventKind } from "@/lib/security/security-overview";
import { SECURITY_EVENT_KINDS } from "@/lib/security/security-event-kinds";
import { RETENTION_POLICY } from "@/lib/security/retention-policy";
import { deviceLabel } from "@/lib/security/login-device";
import { formatLocalizedDateTime } from "@/i18n/date";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.securityCenter.title"), robots: { index: false, follow: false } };
}

const number = new Intl.NumberFormat("en-US");
const ALERT_KINDS = new Set<string>([SECURITY_EVENT_KINDS.ACCOUNT_LOCKED, SECURITY_EVENT_KINDS.CSRF_BLOCKED, SECURITY_EVENT_KINDS.FORBIDDEN]);

/**
 * Təhlükəsizlik mərkəzi (#264, PRD Modul 21): son 24 saatın giriş göstəriciləri, uğursuz cəhdlərin IP-ləri,
 * təhlükəsizlik hadisələri jurnalı və məlumat saxlama siyasəti. Yalnız `user:manage` (Super Admin).
 */
export default async function SecurityCenterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [t, { locale }] = await Promise.all([getAdminT(), getAdminI18n()]);
  await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const params = await searchParams;
  const rawKind = typeof params.tip === "string" ? params.tip : undefined;
  const kind = isSecurityEventKind(rawKind) ? rawKind : undefined;
  const page = Math.max(1, Number(typeof params.sehife === "string" ? params.sehife : 1) || 1);
  const data = await getSecurityOverview({ kind, page });
  const href = (next: { tip?: string; sehife?: number }) => {
    const query = new URLSearchParams();
    if (next.tip) query.set("tip", next.tip);
    if (next.sehife && next.sehife > 1) query.set("sehife", String(next.sehife));
    const text = query.toString();
    return text ? `/admin/tehlukesizlik?${text}` : "/admin/tehlukesizlik";
  };
  const stats = [
    { key: "failedLogins", value: data.stats.failedLogins, alert: data.stats.failedLogins > 20 },
    { key: "successfulLogins", value: data.stats.successfulLogins },
    { key: "rateLimited", value: data.stats.rateLimited, alert: data.stats.rateLimited > 0 },
    { key: "lockedAccounts", value: data.stats.lockedAccounts, alert: data.stats.lockedAccounts > 0 },
    { key: "newDevice", value: data.stats.newDevice },
    { key: "forbidden", value: data.stats.forbidden, alert: data.stats.forbidden > 0 },
    { key: "csrf", value: data.stats.csrf, alert: data.stats.csrf > 0 },
  ] as const;

  return (
    <>
      <AdminPageHeader title={t("pages.securityCenter.title")} description={t("pages.securityCenter.description")} />

      <AdminCard title={t("pages.securityCenter.stats.title")} description={t("pages.securityCenter.stats.description")} className="mb-6">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {stats.map((item) => (
            <li key={item.key} className="rounded-md border border-line p-3">
              <p className="text-xs text-ink-muted">{t(`pages.securityCenter.stats.${item.key}`)}</p>
              <p className={`mt-1 text-xl font-semibold tabular-nums ${"alert" in item && item.alert ? "text-danger" : "text-ink"}`}>{number.format(item.value)}</p>
            </li>
          ))}
        </ul>
      </AdminCard>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard title={t("pages.securityCenter.topIps.title")} description={t("pages.securityCenter.topIps.description")}>
          {data.topIps.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.securityCenter.topIps.empty")}</p> : (
            <ul className="divide-y divide-line text-sm">
              {data.topIps.map((row) => (
                <li key={row.ip} className="flex justify-between gap-3 py-2">
                  <span className="font-mono text-ink [overflow-wrap:anywhere]">{row.ip}</span>
                  <span className="tabular-nums text-ink-soft">{t("pages.securityCenter.topIps.attempts", { count: row.count })}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
        <AdminCard title={t("pages.securityCenter.retention.title")} description={t("pages.securityCenter.retention.description")}>
          <ul className="divide-y divide-line text-sm">
            {RETENTION_POLICY.map((item) => (
              <li key={item.key} className="flex justify-between gap-3 py-2">
                <span className="text-ink-soft">{t(`pages.securityCenter.retention.items.${item.key as "auditLog"}`)}</span>
                <span className="whitespace-nowrap font-medium text-ink tabular-nums">
                  {item.unit === "forever" ? t("pages.securityCenter.retention.forever") : t(`pages.securityCenter.retention.${item.unit}`, { count: item.value })}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">{t("pages.securityCenter.retention.backups")}</p>
        </AdminCard>
      </div>

      <AdminCard title={t("pages.securityCenter.events.title")} description={t("pages.securityCenter.events.total", { count: data.total })}>
        <nav aria-label={t("pages.securityCenter.events.filter")} className="mb-4 flex flex-wrap gap-2">
          {[undefined, ...Object.values(SECURITY_EVENT_KINDS)].map((value) => (
            <Link
              key={value ?? "all"}
              href={href({ tip: value })}
              aria-current={kind === value ? "page" : undefined}
              className={`rounded-full border px-3 py-1.5 text-sm ${kind === value ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-soft hover:border-gold"}`}
            >
              {value ? t(`pages.securityCenter.kinds.${value}`) : t("pages.securityCenter.events.all")}
            </Link>
          ))}
        </nav>
        {data.events.length === 0 ? <p className="text-sm text-ink-muted">{t("pages.securityCenter.events.empty")}</p> : (
          <ul className="divide-y divide-line text-sm">
            {data.events.map((row) => (
              <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <span className="min-w-0">
                  <Badge tone={ALERT_KINDS.has(row.kind) ? "warning" : "neutral"}>{isSecurityEventKind(row.kind) ? t(`pages.securityCenter.kinds.${row.kind}`) : row.kind}</Badge>
                  <span className="ml-2 font-medium text-ink">{row.user ? `${row.user.name} · ${row.user.email}` : t("pages.securityCenter.events.anonymous")}</span>
                  <span className="mt-1 block text-xs text-ink-muted [overflow-wrap:anywhere]">
                    {[row.ip, deviceLabel(row.userAgent), row.detail].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="text-xs text-ink-muted">{formatLocalizedDateTime(row.createdAt, locale)}</span>
              </li>
            ))}
          </ul>
        )}
        {data.pages > 1 && (
          <div className="mt-4 flex justify-between text-sm">
            {data.page > 1 ? <Link href={href({ tip: kind, sehife: data.page - 1 })} className="text-gold-deep hover:underline">{t("pages.securityCenter.events.prev")}</Link> : <span />}
            {data.page < data.pages ? <Link href={href({ tip: kind, sehife: data.page + 1 })} className="text-gold-deep hover:underline">{t("pages.securityCenter.events.next")}</Link> : <span />}
          </div>
        )}
      </AdminCard>
    </>
  );
}
