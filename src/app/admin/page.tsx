import Link from "next/link";
import {
  AlertTriangle,
  Blocks,
  Building2,
  Eye,
  FileEdit,
  Inbox,
  Megaphone,
  Newspaper,
  Plus,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
  StatCard,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { formatPrice, formatRelative } from "@/lib/utils";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  PROPERTY_STATUS_LABELS,
  type LeadSource,
  type LeadStatus,
  type PropertyStatus,
} from "@/lib/constants";
import {
  getAdminAlerts,
  getDashboardStats,
  getLeadStatusBreakdown,
  getRecentAdminLeads,
  getRecentAdminProperties,
  getTopViewedProperties,
} from "@/lib/queries";
import { SETTING_KEYS, getSetting } from "@/lib/settings";

export default async function AdminDashboardPage() {
  const [stats, recentLeads, recentProperties, announcement, alerts, topViewed, leadBreakdown] =
    await Promise.all([
      getDashboardStats(),
      getRecentAdminLeads(),
      getRecentAdminProperties(),
      getSetting(SETTING_KEYS.ADMIN_ANNOUNCEMENT),
      getAdminAlerts(),
      getTopViewedProperties(),
      getLeadStatusBreakdown(),
    ]);

  const alertItems = [
    alerts.pendingProperties > 0 && {
      label: `${alerts.pendingProperties} elan təsdiq gözləyir`,
      href: "/admin/emlaklar?status=PENDING",
    },
    alerts.unverifiedAgencies > 0 && {
      label: `${alerts.unverifiedAgencies} agentlik təsdiq gözləyir`,
      href: "/admin/agentlikler",
    },
    alerts.lockedUsers > 0 && {
      label: `${alerts.lockedUsers} əməkdaş hesabı kilidli`,
      href: "/admin/istifadeciler",
    },
  ].filter((item): item is { label: string; href: string } => Boolean(item));

  const maxLeadCount = Math.max(1, ...leadBreakdown.map((row) => row.count));

  return (
    <>
      <AdminPageHeader
        title="İdarə paneli"
        description="Saytın ümumi vəziyyəti, son müraciətlər və kontent fəaliyyəti."
        actions={
          <>
            <ButtonLink href="/admin/emlaklar/yeni" variant="primary" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Yeni əmlak
            </ButtonLink>
            <ButtonLink href="/admin/blog/yeni" variant="outline" size="sm">
              <FileEdit className="size-4" aria-hidden="true" />
              Məqalə yaz
            </ButtonLink>
          </>
        }
      />

      {/* Bildirişlər — diqqət tələb edən qeydlər */}
      {alertItems.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2.5">
          {alertItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-warning/40 bg-warning-bg px-3.5 text-sm font-medium text-warning transition-colors hover:border-warning"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Komanda qeydi — «Parametrlər» səhifəsindən yazılır */}
      {announcement && (
        <div className="mb-6 flex items-start gap-2.5 rounded-md border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink">
          <Megaphone className="mt-0.5 size-4 shrink-0 text-gold-deep" aria-hidden="true" />
          <p className="whitespace-pre-wrap">{announcement}</p>
        </div>
      )}

      {/* --- Sayğaclar --- */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aktiv əmlaklar"
          value={stats.activeProperties}
          hint={`${stats.draftProperties} qaralama gözləyir`}
          icon={Building2}
          tone="gold"
          href="/admin/emlaklar"
        />
        <StatCard
          label="Yeni müraciətlər"
          value={stats.newLeads}
          hint={`Ümumi ${stats.totalLeads} müraciət`}
          icon={Inbox}
          tone="warning"
          href="/admin/muracietler"
        />
        <StatCard
          label="Aktiv layihələr"
          value={stats.activeProjects}
          hint="Davam edən tikintilər"
          icon={Blocks}
          tone="neutral"
          href="/admin/layiheler"
        />
        <StatCard
          label="Dərc edilmiş yazılar"
          value={stats.publishedPosts}
          hint="Bloqda görünən məqalələr"
          icon={Newspaper}
          tone="success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        {/* --- Son müraciətlər --- */}
        <AdminCard
          title="Son müraciətlər"
          description="Ən son gələn beş müraciət"
          bodyClassName="p-0"
          actions={
            <Link
              href="/admin/muracietler"
              className="inline-flex min-h-9 items-center text-sm text-gold-deep underline-offset-4 transition-colors hover:underline"
            >
              Hamısı
            </Link>
          }
        >
          <AdminTable
            caption="Son müraciətlər"
            headers={[
              { label: "Müştəri" },
              { label: "Mənbə" },
              { label: "Status" },
              { label: "Vaxt", className: "text-right" },
            ]}
          >
            {recentLeads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-ink-muted">
                  Hələ müraciət yoxdur.
                </td>
              </tr>
            )}
            {recentLeads.map((lead) => (
              <AdminTableRow key={lead.id}>
                <AdminTableCell>
                  <Link
                    href="/admin/muracietler"
                    className="font-medium text-ink transition-colors hover:text-gold-deep"
                  >
                    {lead.name}
                  </Link>
                  <p className="tabular mt-0.5 text-xs text-ink-muted">{lead.phone}</p>
                </AdminTableCell>
                <AdminTableCell className="text-sm text-ink-soft">
                  {LEAD_SOURCE_LABELS[lead.source as LeadSource]}
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge
                    status={lead.status as LeadStatus}
                    label={LEAD_STATUS_LABELS[lead.status as LeadStatus]}
                  />
                </AdminTableCell>
                <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                  {formatRelative(lead.createdAt)}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        </AdminCard>

        {/* --- Son əmlaklar --- */}
        <AdminCard
          title="Son yenilənən əmlaklar"
          bodyClassName="p-0"
          actions={
            <Link
              href="/admin/emlaklar"
              className="inline-flex min-h-9 items-center text-sm text-gold-deep underline-offset-4 transition-colors hover:underline"
            >
              Hamısı
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {recentProperties.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-ink-muted">
                Hələ əmlak əlavə edilməyib.
              </li>
            )}
            {recentProperties.map((property) => (
              <li key={property.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/emlaklar/${property.id}`}
                    className="line-clamp-1 text-sm font-medium text-ink transition-colors hover:text-gold-deep"
                  >
                    {property.title}
                  </Link>
                  <p className="tabular mt-0.5 text-xs text-ink-muted">
                    {formatPrice(property.price, property.currency)} ·{" "}
                    {formatRelative(property.updatedAt)}
                  </p>
                </div>
                <StatusBadge
                  status={property.status as PropertyStatus}
                  label={PROPERTY_STATUS_LABELS[property.status as PropertyStatus]}
                />
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      {/* --- Analitika --- */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <AdminCard title="Ən çox baxılan elanlar" description="Baxış sayına görə" bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {topViewed.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-ink-muted">
                Hələ baxış qeydə alınmayıb.
              </li>
            )}
            {topViewed.map((property, index) => (
              <li key={property.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-beige text-xs font-medium text-ink-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/emlaklar/${property.id}`}
                    className="line-clamp-1 text-sm font-medium text-ink transition-colors hover:text-gold-deep"
                  >
                    {property.title}
                  </Link>
                  {property.city?.name && (
                    <p className="mt-0.5 text-xs text-ink-muted">{property.city.name}</p>
                  )}
                </div>
                <span className="tabular inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-soft">
                  <Eye className="size-4" aria-hidden="true" />
                  {property.viewCount}
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="Müraciətlər üzrə bölgü" description="Status üzrə say" bodyClassName="p-5">
          {leadBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">Hələ müraciət yoxdur.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {leadBreakdown.map((row) => (
                <li key={row.status} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{LEAD_STATUS_LABELS[row.status as LeadStatus]}</span>
                    <span className="tabular font-medium text-ink">{row.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-beige">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(row.count / maxLeadCount) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      {/* --- Sürətli keçidlər --- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Yeni əmlak elanı", href: "/admin/emlaklar/yeni", icon: Building2 },
          { label: "Yeni layihə", href: "/admin/layiheler/yeni", icon: Blocks },
          { label: "Yeni məqalə", href: "/admin/blog/yeni", icon: Newspaper },
          { label: "Müraciətlərə bax", href: "/admin/muracietler", icon: Inbox },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-md border border-line bg-paper p-4 transition-all duration-300 ease-out-soft hover:-translate-y-1 hover:border-gold hover:shadow-md"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xs bg-beige text-ink-soft">
              <action.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-ink">{action.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
