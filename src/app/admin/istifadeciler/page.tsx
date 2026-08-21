import type { Metadata } from "next";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
} from "@/components/admin/admin-ui";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { PERMISSIONS, ROLE_LABELS, type Role } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { getAdminUsers, getAuditLog } from "@/lib/queries";
import { CreateUserForm, UserRow } from "./user-forms";

export const metadata: Metadata = { title: "İstifadəçilər" };
export const dynamic = "force-dynamic";

const ROLE_TONES: Record<Role, "gold" | "dark" | "neutral"> = {
  SUPER_ADMIN: "gold",
  ADMIN: "dark",
  EDITOR: "neutral",
};

export default async function AdminUsersPage() {
  const actor = await requireAdminRead(PERMISSIONS.USER_MANAGE);
  const [users, auditLog] = await Promise.all([getAdminUsers(), getAuditLog(20)]);

  return (
    <>
      <AdminPageHeader
        title="İstifadəçilər"
        description={`${users.filter((user) => user.isActive).length} aktiv hesab. Parollar heç vaxt göstərilmir — yalnız müvəqqəti parol yaradılır.`}
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "İstifadəçilər" }]}
      />

      <AdminCard bodyClassName="p-0" className="mb-6">
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
          {users.map((user) => {
            const locked = user.lockedUntil && user.lockedUntil > new Date();

            return (
              <AdminTableRow key={user.id}>
                <AdminTableCell>
                  <span className="font-medium text-ink">{user.name}</span>
                  <p className="mt-0.5 text-xs text-ink-muted">{user.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {!user.isActive && <Badge tone="neutral">Deaktiv</Badge>}
                    {locked && <Badge tone="danger">Müvəqqəti kilidli</Badge>}
                    {user.mustChangePassword && <Badge tone="warning">Parol dəyişməlidir</Badge>}
                    {user.id === actor.id && <Badge tone="gold">Siz</Badge>}
                  </div>
                </AdminTableCell>

                <AdminTableCell>
                  <Badge tone={ROLE_TONES[user.role as Role]}>
                    {ROLE_LABELS[user.role as Role]}
                  </Badge>
                </AdminTableCell>

                <AdminTableCell>
                  {user.totpEnabledAt ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-success">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      Qurulub
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-warning">
                      <ShieldAlert className="size-4" aria-hidden="true" />
                      Qurulmayıb
                    </span>
                  )}
                </AdminTableCell>

                <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                  {user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Heç vaxt"}
                  <p className="mt-0.5">{user._count.sessions} açıq sessiya</p>
                </AdminTableCell>

                <AdminTableCell align="right">
                  <div className="flex justify-end">
                    <UserRow
                      id={user.id}
                      name={user.name}
                      role={user.role}
                      isActive={user.isActive}
                      isSelf={user.id === actor.id}
                      sessionCount={user._count.sessions}
                    />
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </AdminTable>
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
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
