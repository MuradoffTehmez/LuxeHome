import Link from "next/link";
import {
  Blocks,
  Building2,
  Eye,
  FileEdit,
  Inbox,
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
  DemoNotice,
  StatCard,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { formatNumber, formatPrice, formatRelative } from "@/lib/utils";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  PROPERTY_STATUS_LABELS,
} from "@/lib/constants";
import { mockLeads, mockProperties, mockStats } from "@/lib/admin-mock";

export default function AdminDashboardPage() {
  const recentLeads = mockLeads.slice(0, 5);
  const recentProperties = mockProperties.slice(0, 5);

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

      <DemoNotice className="mb-6" />

      {/* --- Sayğaclar --- */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aktiv əmlaklar"
          value={mockStats.activeProperties}
          hint={`${mockStats.draftProperties} qaralama gözləyir`}
          icon={Building2}
          tone="gold"
          href="/admin/emlaklar"
        />
        <StatCard
          label="Yeni müraciətlər"
          value={mockStats.newLeads}
          hint={`Ümumi ${mockStats.totalLeads} müraciət`}
          icon={Inbox}
          tone="warning"
          href="/admin/muracietler"
        />
        <StatCard
          label="Aktiv layihələr"
          value={mockStats.activeProjects}
          hint="Davam edən tikintilər"
          icon={Blocks}
          tone="neutral"
          href="/admin/layiheler"
        />
        <StatCard
          label="30 günlük baxış"
          value={formatNumber(mockStats.viewsLast30Days)}
          hint="Bütün əmlak səhifələri üzrə"
          icon={Eye}
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
                  {LEAD_SOURCE_LABELS[lead.source]}
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
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
                  status={property.status}
                  label={PROPERTY_STATUS_LABELS[property.status]}
                />
              </li>
            ))}
          </ul>
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
