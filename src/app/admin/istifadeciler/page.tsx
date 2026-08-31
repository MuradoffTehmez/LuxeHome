import type { Metadata } from "next";
import { KeyRound, MonitorSmartphone, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
  StatCard,
} from "@/components/admin/admin-ui";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { PERMISSIONS, type Role } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminUsers, getAuditLog } from "@/lib/queries";
import { CreateUserForm, UserRow } from "./user-forms";
import { getAdminT } from "@/lib/admin-i18n";

export const metadata: Metadata = { title: "İstifadəçilər" };
export const dynamic = "force-dynamic";

const ROLE_TONES: Record<Role, "gold" | "dark" | "neutral"> = {
  SUPER_ADMIN: "gold",
  ADMIN: "dark",
  EDITOR: "neutral",
};

export default async function AdminUsersPage() {
  const t = await getAdminT();
  const actor = await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const [users, auditLog] = await Promise.all([getAdminUsers(), getAuditLog(20)]);
  const activeUsers = users.filter((user) => user.isActive);
  const withoutTwoFactor = activeUsers.filter((user) => !user.totpEnabledAt).length;
  const mustChangePassword = activeUsers.filter((user) => user.mustChangePassword).length;
  const openSessions = users.reduce((sum, user) => sum + user._count.sessions, 0);

  return (
    <>
      <AdminPageHeader
        title="İstifadəçilər"
        description={`${users.filter((user) => user.isActive).length} aktiv hesab. Parollar heç vaxt göstərilmir — yalnız müvəqqəti parol yaradılır.`}
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "İstifadəçilər" }]}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Aktiv hesab" value={activeUsers.length} hint={`${users.length} ümumi hesab`} icon={UserCheck} tone="success" />
        <StatCard label="2FA qurulmayıb" value={withoutTwoFactor} hint="Aktiv hesablarda" icon={ShieldAlert} tone={withoutTwoFactor > 0 ? "warning" : "success"} />
        <StatCard label="Parol dəyişməlidir" value={mustChangePassword} hint="İlk giriş gözlənilir" icon={KeyRound} tone={mustChangePassword > 0 ? "warning" : "success"} />
        <StatCard label="Açıq sessiya" value={openSessions} hint="Bütün əməkdaş cihazları" icon={MonitorSmartphone} />
      </div>

      <AdminCard bodyClassName="p-4 lg:p-0" className="mb-6">
        <AdminResponsiveList
          ariaLabel="İstifadəçilər"
          items={users}
          getKey={(user) => user.id}
          empty={<p className="py-10 text-center text-sm text-ink-muted">Hələ istifadəçi hesabı yoxdur.</p>}
          renderCard={(user) => {
            const locked = Boolean(user.lockedUntil && user.lockedUntil > new Date());
            return (
              <AdminListCard
                title={user.name}
                meta={user.email}
                status={<Badge tone={ROLE_TONES[user.role as Role]}>{t(`labels.role.${user.role as Role}`)}</Badge>}
              >
                <div className="flex flex-wrap gap-1.5">
                  {!user.isActive ? <Badge tone="neutral">Deaktiv</Badge> : null}
                  {locked ? <Badge tone="danger">Müvəqqəti kilidli</Badge> : null}
                  {user.mustChangePassword ? <Badge tone="warning">Parol dəyişməlidir</Badge> : null}
                  {user.id === actor.id ? <Badge tone="gold">Siz</Badge> : null}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-ink-muted">İki mərhələli doğrulama</dt>
                    <dd className={user.totpEnabledAt ? "mt-1 text-success" : "mt-1 text-warning"}>
                      {user.totpEnabledAt ? "Qurulub" : "Qurulmayıb"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Son giriş</dt>
                    <dd className="mt-1 text-ink">{user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Heç vaxt"}</dd>
                    <dd className="mt-1 text-xs text-ink-muted">{user._count.sessions} açıq sessiya</dd>
                  </div>
                </dl>
                <div className="mt-4 border-t border-line pt-4">
                  <UserRow
                    id={user.id}
                    name={user.name}
                    role={user.role}
                    isActive={user.isActive}
                    isSelf={user.id === actor.id}
                    sessionCount={user._count.sessions}
                    totpEnabled={Boolean(user.totpEnabledAt)}
                    mobile
                  />
                </div>
              </AdminListCard>
            );
          }}
          renderTable={(items) => (
            <AdminTable
              caption="İstifadəçilər"
              headers={[
                { label: "İstifadəçi" },
                { label: "Rol" },
                { label: "2FA" },
                { label: "Son giriş", className: "text-right" },
                { label: "İdarəetmə", className: "text-right" },
              ]}
            >
              {items.map((user) => {
                const locked = Boolean(user.lockedUntil && user.lockedUntil > new Date());
                return (
                  <AdminTableRow key={user.id}>
                    <AdminTableCell>
                      <span className="font-medium text-ink">{user.name}</span>
                      <p className="mt-0.5 text-xs text-ink-muted">{user.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!user.isActive ? <Badge tone="neutral">Deaktiv</Badge> : null}
                        {locked ? <Badge tone="danger">Müvəqqəti kilidli</Badge> : null}
                        {user.mustChangePassword ? <Badge tone="warning">Parol dəyişməlidir</Badge> : null}
                        {user.id === actor.id ? <Badge tone="gold">Siz</Badge> : null}
                      </div>
                    </AdminTableCell>
                    <AdminTableCell><Badge tone={ROLE_TONES[user.role as Role]}>{t(`labels.role.${user.role as Role}`)}</Badge></AdminTableCell>
                    <AdminTableCell>
                      {user.totpEnabledAt ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-success"><ShieldCheck className="size-4" aria-hidden="true" />Qurulub</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-warning"><ShieldAlert className="size-4" aria-hidden="true" />Qurulmayıb</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                      {user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Heç vaxt"}
                      <p className="mt-0.5">{user._count.sessions} açıq sessiya</p>
                    </AdminTableCell>
                    <AdminTableCell align="right">
                      <div className="flex justify-end">
                        <UserRow id={user.id} name={user.name} role={user.role} isActive={user.isActive} isSelf={user.id === actor.id} sessionCount={user._count.sessions} totpEnabled={Boolean(user.totpEnabledAt)} />
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })}
            </AdminTable>
          )}
        />
      </AdminCard>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[1fr_1.1fr]">
        <CreateUserForm />

        <AdminCard
          title="Son panel əməliyyatları"
          description="Audit jurnalı — kim, nə vaxt, hansı qeydi dəyişdi."
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-line">
            {auditLog.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-ink-muted">
                Hələ qeyd yoxdur.
              </li>
            )}
            {auditLog.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-0.5 px-5 py-3">
                <span className="text-sm text-ink">
                  <span className="font-medium">{entry.userEmail}</span> · {entry.action}{" "}
                  {entry.entity}
                </span>
                <span className="text-xs text-ink-muted">
                  {entry.summary ? `${entry.summary} · ` : ""}
                  {formatDateTime(entry.createdAt)}
                  {entry.ip ? ` · ${entry.ip}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
    </>
  );
}
