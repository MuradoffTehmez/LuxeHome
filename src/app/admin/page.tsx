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
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { formatPrice, formatRelative } from "@/lib/utils";
import {
  type LeadSource,
  type LeadStatus,
  type PropertyStatus,
} from "@/lib/constants";
import { getAdminT } from "@/lib/admin-i18n";
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
  const t = await getAdminT();
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
      label: t("dashboard.alerts.pendingProperties", { count: alerts.pendingProperties }),
      href: "/admin/emlaklar?status=PENDING",
    },
    alerts.unverifiedAgencies > 0 && {
      label: t("dashboard.alerts.unverifiedAgencies", { count: alerts.unverifiedAgencies }),
      href: "/admin/agentlikler",
    },
    alerts.lockedUsers > 0 && {
      label: t("dashboard.alerts.lockedUsers", { count: alerts.lockedUsers }),
      href: "/admin/istifadeciler",
    },
  ].filter((item): item is { label: string; href: string } => Boolean(item));

  const maxLeadCount = Math.max(1, ...leadBreakdown.map((row) => row.count));

  return (
    <>
      <AdminPageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        actions={
          <>
            <ButtonLink href="/admin/emlaklar/yeni" variant="primary" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              {t("dashboard.newProperty")}
            </ButtonLink>
            <ButtonLink href="/admin/blog/yeni" variant="outline" size="sm">
              <FileEdit className="size-4" aria-hidden="true" />
              {t("dashboard.writePost")}
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
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-warning/40 bg-warning-bg px-3.5 text-sm font-medium text-warning transition-colors hover:border-warning"
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
          label={t("dashboard.stats.activeProperties")}
          value={stats.activeProperties}
          hint={t("dashboard.stats.activePropertiesHint", { count: stats.draftProperties })}
          icon={Building2}
          tone="gold"
          href="/admin/emlaklar"
        />
        <StatCard
          label={t("dashboard.stats.newLeads")}
          value={stats.newLeads}
          hint={t("dashboard.stats.newLeadsHint", { count: stats.totalLeads })}
          icon={Inbox}
          tone="warning"
          href="/admin/muracietler"
        />
        <StatCard
          label={t("dashboard.stats.activeProjects")}
          value={stats.activeProjects}
          hint={t("dashboard.stats.activeProjectsHint")}
          icon={Blocks}
          tone="neutral"
          href="/admin/layiheler"
        />
        <StatCard
          label={t("dashboard.stats.publishedPosts")}
          value={stats.publishedPosts}
          hint={t("dashboard.stats.publishedPostsHint")}
          icon={Newspaper}
          tone="success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        {/* --- Son müraciətlər --- */}
        <AdminCard
          title={t("dashboard.recentLeads.title")}
          description={t("dashboard.recentLeads.description")}
          bodyClassName="p-4 lg:p-0"
          actions={
            <Link
              href="/admin/muracietler"
              className="inline-flex min-h-11 items-center text-sm text-gold-deep underline-offset-4 transition-colors hover:underline"
            >
              {t("dashboard.recentLeads.viewAll")}
            </Link>
          }
        >
          <AdminResponsiveList
            ariaLabel={t("dashboard.recentLeads.title")}
            items={recentLeads}
            getKey={(lead) => lead.id}
            empty={<p className="py-8 text-center text-sm text-ink-muted">{t("dashboard.recentLeads.empty")}</p>}
            renderCard={(lead) => (
              <AdminListCard
                title={
                  <Link
                    href={`/admin/muracietler/${lead.id}`}
                    className="inline-flex min-h-11 items-center transition-colors hover:text-gold-deep"
                  >
                    {lead.name}
                  </Link>
                }
                meta={
                  <span className="tabular">
                    {lead.phone} · {formatRelative(lead.createdAt)}
                  </span>
                }
                status={
                  <StatusBadge
                    status={lead.status as LeadStatus}
                    label={t(`labels.leadStatus.${lead.status as LeadStatus}`)}
                  />
                }
              >
                {t(`labels.leadSource.${lead.source as LeadSource}`)}
              </AdminListCard>
            )}
            renderTable={(items) => (
              <AdminTable
                caption={t("dashboard.recentLeads.title")}
                headers={[
                  { label: t("dashboard.recentLeads.customer") },
                  { label: t("dashboard.recentLeads.source") },
                  { label: t("dashboard.recentLeads.status") },
                  { label: t("dashboard.recentLeads.time"), className: "text-right" },
                ]}
              >
                {items.map((lead) => (
                  <AdminTableRow key={lead.id}>
                    <AdminTableCell>
                      <Link
                        href={`/admin/muracietler/${lead.id}`}
                        className="inline-flex min-h-11 items-center font-medium text-ink transition-colors hover:text-gold-deep"
                      >
                        {lead.name}
                      </Link>
                      <p className="tabular mt-0.5 text-xs text-ink-muted">{lead.phone}</p>
                    </AdminTableCell>
                    <AdminTableCell className="text-sm text-ink-soft">
                      {t(`labels.leadSource.${lead.source as LeadSource}`)}
                    </AdminTableCell>
                    <AdminTableCell>
                      <StatusBadge
                        status={lead.status as LeadStatus}
                        label={t(`labels.leadStatus.${lead.status as LeadStatus}`)}
                      />
                    </AdminTableCell>
                    <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                      {formatRelative(lead.createdAt)}
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
            )}
          />
        </AdminCard>

        {/* --- Son əmlaklar --- */}
        <AdminCard
          title={t("dashboard.recentProperties.title")}
          bodyClassName="p-0"
          actions={
            <Link
              href="/admin/emlaklar"
              className="inline-flex min-h-11 items-center text-sm text-gold-deep underline-offset-4 transition-colors hover:underline"
            >
              {t("dashboard.recentProperties.viewAll")}
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {recentProperties.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-ink-muted">
                {t("dashboard.recentProperties.empty")}
              </li>
            )}
            {recentProperties.map((property) => (
              <li key={property.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/emlaklar/${property.id}`}
                    className="inline-flex min-h-11 items-center text-sm font-medium text-ink transition-colors hover:text-gold-deep"
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
                  label={t(`labels.propertyStatus.${property.status as PropertyStatus}`)}
                />
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      {/* --- Analitika --- */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <AdminCard title={t("dashboard.topViewed.title")} description={t("dashboard.topViewed.description")} bodyClassName="p-0">
          <ul className="divide-y divide-line">
            {topViewed.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-ink-muted">
                {t("dashboard.topViewed.empty")}
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
                    className="inline-flex min-h-11 items-center text-sm font-medium text-ink transition-colors hover:text-gold-deep"
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

        <AdminCard title={t("dashboard.leadBreakdown.title")} description={t("dashboard.leadBreakdown.description")} bodyClassName="p-5">
          {leadBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">{t("dashboard.leadBreakdown.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {leadBreakdown.map((row) => (
                <li key={row.status} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{t(`labels.leadStatus.${row.status as LeadStatus}`)}</span>
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
          { label: t("dashboard.quickActions.newProperty"), href: "/admin/emlaklar/yeni", icon: Building2 },
          { label: t("dashboard.quickActions.newProject"), href: "/admin/layiheler/yeni", icon: Blocks },
          { label: t("dashboard.quickActions.newPost"), href: "/admin/blog/yeni", icon: Newspaper },
          { label: t("dashboard.quickActions.viewLeads"), href: "/admin/muracietler", icon: Inbox },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-paper p-4 transition-all duration-300 ease-out-soft hover:-translate-y-1 hover:border-gold hover:shadow-md"
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
