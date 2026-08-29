import type { Metadata } from "next";
import { LogOut, ShieldAlert, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
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
import { requireAdminRead } from "@/lib/admin/guard";
import {
  getAdminActiveSessions,
  getAdminLockedUsers,
  getAdminLoginAttempts,
} from "@/lib/queries";
import { revokeAdminSession, unlockUserAccount } from "./actions";
import { hasRuntimeEnv } from "@/lib/runtime-env";

export const metadata: Metadata = { title: "Təhlükəsizlik" };
export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  OK: "Uğurlu",
  BAD_PASSWORD: "Yanlış parol",
  BAD_TOTP: "Yanlış 2FA kodu",
  LOCKED: "Hesab kilidli",
  RATE_LIMITED: "Sürət limiti",
  INACTIVE: "Deaktiv hesab",
};

function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Naməlum cihaz";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Safari\//.test(userAgent)
        ? "Safari"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : "Naməlum brauzer";
  return browser;
}

export default async function AdminSecurityPage() {
  await requireAdminRead(PERMISSIONS.USER_MANAGE);

  const [attempts, sessions, lockedUsers] = await Promise.all([
    getAdminLoginAttempts(50),
    getAdminActiveSessions(100),
    getAdminLockedUsers(),
  ]);
  const turnstileSecretReady =
    hasRuntimeEnv("TURNSTILE_SECRET") || hasRuntimeEnv("TURNSTILE_SECRET_KEY");
  const turnstileReady =
    hasRuntimeEnv("TURNSTILE_SITE_KEY") &&
    turnstileSecretReady &&
    hasRuntimeEnv("TURNSTILE_HOSTNAMES");

  return (
    <>
      <AdminPageHeader
        title="Təhlükəsizlik"
        description="Giriş cəhdləri, aktiv sessiyalar və kilidlənmiş hesablar."
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Təhlükəsizlik" }]}
      />

      <div className="flex flex-col gap-6">
        <AdminCard title="Bot müdafiəsi" description="Cloudflare Turnstile server tərəfli token yoxlaması">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-ink-soft">Admin və istifadəçi girişi, qeydiyyat, parol bərpası və müraciət formaları qorunur. Token hər əməliyyat növünə ayrıca bağlanır.</p>
            <Badge tone={turnstileReady ? "success" : "danger"}>{turnstileReady ? "Aktiv" : "Konfiqurasiya tamamlanmayıb"}</Badge>
          </div>
        </AdminCard>
        {lockedUsers.length > 0 && (
          <AdminCard
            title="Kilidlənmiş hesablar"
            description="Ardıcıl uğursuz giriş cəhdlərindən sonra müvəqqəti bağlanıb."
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-line">
              {lockedUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                      <ShieldAlert className="size-3.5 shrink-0 text-danger" aria-hidden="true" />
                      {user.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {user.email} · {user.failedAttempts} uğursuz cəhd · {formatDateTime(user.lockedUntil!)}-a qədər
                    </p>
                  </div>
                  <ConfirmAction
                    action={unlockUserAccount}
                    id={user.id}
                    label={`${user.name} kilidini aç`}
                    title="Kilidi açmaq"
                    description={`${user.name} (${user.email}) dərhal yenidən giriş edə biləcək.`}
                    confirmLabel="Kilidi aç"
                    tone="neutral"
                    className="size-11 shrink-0"
                  >
                    <Unlock className="size-4" aria-hidden="true" />
                  </ConfirmAction>
                </li>
              ))}
            </ul>
          </AdminCard>
        )}

        <AdminCard title="Aktiv sessiyalar" description={`${sessions.length} aktiv sessiya`} bodyClassName="p-4 lg:p-0">
          {sessions.length === 0 ? (
            <EmptyState title="Aktiv sessiya yoxdur" />
          ) : (
            <AdminResponsiveList
              ariaLabel="Aktiv sessiyalar"
              items={sessions}
              getKey={(session) => session.id}
              empty={<EmptyState title="Aktiv sessiya yoxdur" />}
              renderCard={(session) => (
                <AdminListCard
                  title={session.user.name}
                  meta={session.user.email}
                  actions={
                    <ConfirmAction
                      action={revokeAdminSession}
                      id={session.id}
                      label={`${session.user.email} sessiyasını bağla`}
                      title="Sessiyanı bağlamaq"
                      description={`${session.user.name} (${session.user.email}) bu cihazdan çıxarılacaq.`}
                      confirmLabel="Bağla"
                      tone="danger"
                      className="size-11"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                    </ConfirmAction>
                  }
                >
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-xs text-ink-muted">Cihaz</dt>
                      <dd className="mt-1 text-ink">{deviceLabel(session.userAgent)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-muted">IP</dt>
                      <dd className="mt-1 text-ink [overflow-wrap:anywhere]">{session.ip ?? "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-ink-muted">Son aktivlik</dt>
                      <dd className="mt-1 text-ink">{formatDateTime(session.lastSeenAt)}</dd>
                    </div>
                  </dl>
                </AdminListCard>
              )}
              renderTable={(items) => (
                <AdminTable
                  caption="Aktiv sessiyalar"
                  headers={[
                    { label: "İstifadəçi" },
                    { label: "Cihaz" },
                    { label: "IP" },
                    { label: "Son aktivlik" },
                    { label: "İdarəetmə", className: "text-right" },
                  ]}
                >
                  {items.map((session) => (
                    <AdminTableRow key={session.id}>
                      <AdminTableCell>
                        <span className="font-medium text-ink">{session.user.name}</span>
                        <p className="text-xs text-ink-muted">{session.user.email}</p>
                      </AdminTableCell>
                      <AdminTableCell className="text-xs text-ink-muted">
                        {deviceLabel(session.userAgent)}
                      </AdminTableCell>
                      <AdminTableCell className="text-xs text-ink-muted">{session.ip ?? "—"}</AdminTableCell>
                      <AdminTableCell className="text-xs text-ink-muted whitespace-nowrap">
                        {formatDateTime(session.lastSeenAt)}
                      </AdminTableCell>
                      <AdminTableCell align="right">
                        <div className="flex justify-end">
                          <ConfirmAction
                            action={revokeAdminSession}
                            id={session.id}
                            label={`${session.user.email} sessiyasını bağla`}
                            title="Sessiyanı bağlamaq"
                            description={`${session.user.name} (${session.user.email}) bu cihazdan çıxarılacaq.`}
                            confirmLabel="Bağla"
                            tone="danger"
                            className="size-11"
                          >
                            <LogOut className="size-4" aria-hidden="true" />
                          </ConfirmAction>
                        </div>
                      </AdminTableCell>
                    </AdminTableRow>
                  ))}
                </AdminTable>
              )}
            />
          )}
        </AdminCard>

        <AdminCard title="Son giriş cəhdləri" bodyClassName="p-4 lg:p-0">
          <AdminResponsiveList
            ariaLabel="Giriş cəhdləri"
            items={attempts}
            getKey={(attempt) => attempt.id}
            empty={<EmptyState title="Giriş cəhdi yoxdur" />}
            renderCard={(attempt) => (
              <AdminListCard
                title={attempt.email}
                status={
                  <Badge tone={attempt.success ? "success" : "danger"}>
                    {REASON_LABELS[attempt.reason ?? ""] ?? (attempt.success ? "Uğurlu" : "Uğursuz")}
                  </Badge>
                }
              >
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-ink-muted">IP</dt>
                    <dd className="mt-1 text-ink [overflow-wrap:anywhere]">{attempt.ip ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Tarix</dt>
                    <dd className="mt-1 text-ink">{formatDateTime(attempt.createdAt)}</dd>
                  </div>
                </dl>
              </AdminListCard>
            )}
            renderTable={(items) => (
              <AdminTable
                caption="Giriş cəhdləri"
                headers={[{ label: "E-poçt" }, { label: "IP" }, { label: "Nəticə" }, { label: "Tarix" }]}
              >
                {items.map((attempt) => (
                  <AdminTableRow key={attempt.id}>
                    <AdminTableCell className="text-xs">{attempt.email}</AdminTableCell>
                    <AdminTableCell className="text-xs text-ink-muted">{attempt.ip ?? "—"}</AdminTableCell>
                    <AdminTableCell>
                      <Badge tone={attempt.success ? "success" : "danger"}>
                        {REASON_LABELS[attempt.reason ?? ""] ?? (attempt.success ? "Uğurlu" : "Uğursuz")}
                      </Badge>
                    </AdminTableCell>
                    <AdminTableCell className="text-xs text-ink-muted whitespace-nowrap">
                      {formatDateTime(attempt.createdAt)}
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
            )}
          />
        </AdminCard>
      </div>
    </>
  );
}
