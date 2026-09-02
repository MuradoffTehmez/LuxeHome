import { getAdminT } from "@/lib/admin-i18n";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.security.tehlukesizlik") };
}
export const dynamic = "force-dynamic";

/** Etiketlər dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const reasonLabels = (t: Awaited<ReturnType<typeof getAdminT>>): Record<string, string> => ({
  OK: t("pages.misc.ugurlu"),
  BAD_PASSWORD: t("pages.misc.yanlisParol"),
  BAD_TOTP: t("pages.misc.yanlis2faKodu"),
  LOCKED: t("pages.misc.hesabKilidli"),
  RATE_LIMITED: t("pages.misc.suretLimiti"),
  INACTIVE: t("pages.misc.deaktivHesab"),
});

function deviceLabel(userAgent: string | null, t: Awaited<ReturnType<typeof getAdminT>>): string {
  if (!userAgent) return t("pages.misc.namelumCihaz");
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Safari\//.test(userAgent)
        ? "Safari"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : t("pages.misc.namelumBrauzer");
  return browser;
}

export default async function AdminSecurityPage() {
  const t = await getAdminT();
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
        title={t("pages.security.tehlukesizlik")}
        description={t("pages.security.girisCehdleriAktivSessiyalar")}
        breadcrumbs={[{ label: t("pages.security.idarePaneli"), href: "/admin" }, { label: t("pages.security.tehlukesizlik") }]}
      />

      <div className="flex flex-col gap-6">
        <AdminCard title={t("pages.security.botMudafiesi")} description={t("pages.security.cloudflareTurnstileServerTerefli")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-ink-soft">{t("pages.security.botMudafiesiTesviri")}</p>
            <Badge tone={turnstileReady ? "success" : "danger"}>{turnstileReady ? t("pages.misc.aktiv") : t("pages.misc.konfiqurasiyaTamamlanmayib")}</Badge>
          </div>
        </AdminCard>
        {lockedUsers.length > 0 && (
          <AdminCard
            title={t("pages.security.kilidlenmisHesablar")}
            description={t("pages.security.ardicilUgursuzGirisCehdlerinden")}
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
                      {t("pages.security.kilidMelumati", { email: user.email, count: user.failedAttempts, date: formatDateTime(user.lockedUntil!) })}
                    </p>
                  </div>
                  <ConfirmAction
                    action={unlockUserAccount}
                    id={user.id}
                    label={t("pages.common.kilidiniAc", { p0: user.name })}
                    title={t("pages.security.kilidiAcmaq")}
                    description={t("pages.common.derhalYenidenGirisEde", { p0: user.name, p1: user.email })}
                    confirmLabel={t("pages.security.kilidiAc")}
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

        <AdminCard title={t("pages.security.aktivSessiyalar")} description={t("pages.security.aktivSessiyaSayi", { count: sessions.length })} bodyClassName="p-4 lg:p-0">
          {sessions.length === 0 ? (
            <EmptyState title={t("pages.security.aktivSessiyaYoxdur")} />
          ) : (
            <AdminResponsiveList
              ariaLabel={t("pages.security.aktivSessiyalar")}
              items={sessions}
              getKey={(session) => session.id}
              empty={<EmptyState title={t("pages.security.aktivSessiyaYoxdur")} />}
              renderCard={(session) => (
                <AdminListCard
                  title={session.user.name}
                  meta={session.user.email}
                  actions={
                    <ConfirmAction
                      action={revokeAdminSession}
                      id={session.id}
                      label={t("pages.common.sessiyasiniBagla", { p0: session.user.email })}
                      title={t("pages.security.sessiyaniBaglamaq")}
                      description={t("pages.common.buCihazdanCixarilacaq", { p0: session.user.name, p1: session.user.email })}
                      confirmLabel={t("pages.security.bagla")}
                      tone="danger"
                      className="size-11"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                    </ConfirmAction>
                  }
                >
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-xs text-ink-muted">{t("pages.security.cihaz")}</dt>
                      <dd className="mt-1 text-ink">{deviceLabel(session.userAgent, t)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-muted">IP</dt>
                      <dd className="mt-1 text-ink [overflow-wrap:anywhere]">{session.ip ?? "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-ink-muted">{t("pages.security.sonAktivlik")}</dt>
                      <dd className="mt-1 text-ink">{formatDateTime(session.lastSeenAt)}</dd>
                    </div>
                  </dl>
                </AdminListCard>
              )}
              renderTable={(items) => (
                <AdminTable
                  caption={t("pages.security.aktivSessiyalar")}
                  headers={[
                    { label: t("pages.security.istifadeci") },
                    { label: t("pages.security.cihaz") },
                    { label: "IP" },
                    { label: t("pages.security.sonAktivlik") },
                    { label: t("pages.security.idareetme"), className: "text-right" },
                  ]}
                >
                  {items.map((session) => (
                    <AdminTableRow key={session.id}>
                      <AdminTableCell>
                        <span className="font-medium text-ink">{session.user.name}</span>
                        <p className="text-xs text-ink-muted">{session.user.email}</p>
                      </AdminTableCell>
                      <AdminTableCell className="text-xs text-ink-muted">
                        {deviceLabel(session.userAgent, t)}
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
                            label={t("pages.common.sessiyasiniBagla", { p0: session.user.email })}
                            title={t("pages.security.sessiyaniBaglamaq")}
                            description={t("pages.common.buCihazdanCixarilacaq", { p0: session.user.name, p1: session.user.email })}
                            confirmLabel={t("pages.security.bagla")}
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

        <AdminCard title={t("pages.security.sonGirisCehdleri")} bodyClassName="p-4 lg:p-0">
          <AdminResponsiveList
            ariaLabel={t("pages.security.girisCehdleri")}
            items={attempts}
            getKey={(attempt) => attempt.id}
            empty={<EmptyState title={t("pages.security.girisCehdiYoxdur")} />}
            renderCard={(attempt) => (
              <AdminListCard
                title={attempt.email}
                status={
                  <Badge tone={attempt.success ? "success" : "danger"}>
                    {reasonLabels(t)[attempt.reason ?? ""] ?? (attempt.success ? t("pages.misc.ugurlu") : t("pages.misc.ugursuz"))}
                  </Badge>
                }
              >
                <dl className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-ink-muted">IP</dt>
                    <dd className="mt-1 text-ink [overflow-wrap:anywhere]">{attempt.ip ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.security.tarix")}</dt>
                    <dd className="mt-1 text-ink">{formatDateTime(attempt.createdAt)}</dd>
                  </div>
                </dl>
              </AdminListCard>
            )}
            renderTable={(items) => (
              <AdminTable
                caption={t("pages.security.girisCehdleri")}
                headers={[{ label: t("pages.security.ePoct") }, { label: "IP" }, { label: t("pages.security.netice") }, { label: t("pages.security.tarix") }]}
              >
                {items.map((attempt) => (
                  <AdminTableRow key={attempt.id}>
                    <AdminTableCell className="text-xs">{attempt.email}</AdminTableCell>
                    <AdminTableCell className="text-xs text-ink-muted">{attempt.ip ?? "—"}</AdminTableCell>
                    <AdminTableCell>
                      <Badge tone={attempt.success ? "success" : "danger"}>
                        {reasonLabels(t)[attempt.reason ?? ""] ?? (attempt.success ? t("pages.misc.ugurlu") : t("pages.misc.ugursuz"))}
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
