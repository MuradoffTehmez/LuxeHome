import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Eye, EyeOff, Pencil, Plus, RotateCcw, ScanEye, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { AdminCard, AdminPageHeader, AdminTable, AdminTableCell, AdminTableRow } from "@/components/admin/admin-ui";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminListCard, AdminResponsiveList } from "@/components/admin/admin-responsive-list";
import { ConfirmAction } from "@/components/admin/confirm-action";
import {
  PARTNER_STATUS_LABELS,
  PARTNER_STATUS_TONE,
  PARTNER_STATUSES,
  PARTNERSHIP_TYPE_LABELS,
  PARTNERSHIP_TYPES,
  PERMISSIONS,
  type PartnerStatus,
  type PartnershipType,
} from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getAdminPartnerCountries,
  getAdminPartners,
  getAdminPartnerStatusCounts,
  getPartnerExpiryAlerts,
} from "@/lib/queries";
import { daysUntilPartnershipEnd } from "@/lib/partners";
import { formatRelative, isUnoptimizedImage } from "@/lib/utils";
import { deletePartner, restorePartner, togglePartnerVisibility } from "./actions";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";

export const metadata: Metadata = { title: "Tərəfdaşlar" };
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/terefdaslar";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

function createdFrom(period: string): Date | undefined {
  const days = Number(period);
  if (![7, 30, 365].includes(days)) return undefined;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function statusBadge(status: string) {
  const normalized = status in PARTNER_STATUS_LABELS ? (status as PartnerStatus) : PARTNER_STATUSES.DRAFT;
  return <Badge tone={PARTNER_STATUS_TONE[normalized]}>{PARTNER_STATUS_LABELS[normalized]}</Badge>;
}

export default async function AdminPartnersPage({ searchParams }: { searchParams: SearchParams }) {
  const { locale } = await getAdminI18n();
  const user = await requireAdminRead(PERMISSIONS.PARTNER_VIEW);
  const canCreate = hasPermission(user.role, PERMISSIONS.PARTNER_CREATE);
  const canUpdate = hasPermission(user.role, PERMISSIONS.PARTNER_UPDATE);
  const canDelete = hasPermission(user.role, PERMISSIONS.PARTNER_DELETE);
  const canPublish = hasPermission(user.role, PERMISSIONS.PARTNER_PUBLISH);
  const params = await searchParams;
  const deleted = one(params, "silinmis") === "1";
  const period = one(params, "yaradilma");
  const filters = {
    search: one(params, "q"),
    status: one(params, "status"),
    type: one(params, "tip"),
    verified: one(params, "tesdiq"),
    official: one(params, "resmi"),
    featured: one(params, "secilmis"),
    homepage: one(params, "ana_sehife"),
    country: one(params, "olke"),
    createdFrom: createdFrom(period),
    deleted,
    page: Number(one(params, "sehife")) || 1,
  };

  const [{ items, total, page, totalPages }, counts, countries, alerts] = await Promise.all([
    getAdminPartners(filters),
    getAdminPartnerStatusCounts(),
    getAdminPartnerCountries(),
    deleted ? Promise.resolve([]) : getPartnerExpiryAlerts(30),
  ]);

  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    if (filters.search) query.set("q", filters.search);
    if (filters.status) query.set("status", filters.status);
    if (filters.type) query.set("tip", filters.type);
    if (filters.verified) query.set("tesdiq", filters.verified);
    if (filters.official) query.set("resmi", filters.official);
    if (filters.featured) query.set("secilmis", filters.featured);
    if (filters.homepage) query.set("ana_sehife", filters.homepage);
    if (filters.country) query.set("olke", filters.country);
    if (period) query.set("yaradilma", period);
    if (deleted) query.set("silinmis", "1");
    if (nextPage > 1) query.set("sehife", String(nextPage));
    const search = query.toString();
    return search ? `${LIST_PATH}?${search}` : LIST_PATH;
  }

  const renderActions = (partner: (typeof items)[number]) => deleted ? (canDelete ? (
    <ConfirmAction
      action={restorePartner}
      id={partner.id}
      label={`«${partner.name}» tərəfdaşını bərpa et`}
      title="Tərəfdaşı bərpa etmək"
      description="Qeyd arxiv statusunda bərpa ediləcək və avtomatik public olmayacaq."
      confirmLabel="Bərpa et"
      tone="neutral"
    >
      <RotateCcw className="size-4" aria-hidden="true" />
    </ConfirmAction>
  ) : null) : (
    <>
      {canPublish ? (
        <ConfirmAction
          action={togglePartnerVisibility}
          id={partner.id}
          label={partner.showPublicly ? `«${partner.name}» tərəfdaşını saytdan gizlət` : `«${partner.name}» tərəfdaşını saytda göstər`}
          title={partner.showPublicly ? "Tərəfdaşı saytdan gizlətmək" : "Tərəfdaşı saytda göstərmək"}
          description={partner.showPublicly ? "Məlumat silinməyəcək; ictimai profil və ana səhifə görünüşü bağlanacaq." : "Aktiv tərəfdaşın ictimai profili dərhal açılacaq."}
          confirmLabel={partner.showPublicly ? "Gizlət" : "Saytda göstər"}
          tone={partner.showPublicly ? "danger" : "neutral"}
        >
          {partner.showPublicly ? <EyeOff className="size-4" aria-hidden="true" /> : <ScanEye className="size-4" aria-hidden="true" />}
        </ConfirmAction>
      ) : null}
      {partner.showPublicly ? (
        <Link
          href={localizePath(`/terefdaslar/${partner.slug}`, locale)}
          target="_blank"
          rel="noreferrer"
          className="grid size-11 place-items-center rounded-xs text-ink-muted hover:bg-beige hover:text-ink"
          aria-label={`${partner.name} profilini saytda aç`}
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
      {canUpdate ? (
        <Link
          href={`${LIST_PATH}/${partner.id}`}
          className="grid size-11 place-items-center rounded-xs text-ink-muted hover:bg-beige hover:text-ink"
          aria-label={`${partner.name} tərəfdaşını redaktə et`}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
      {canDelete ? (
        <ConfirmAction
          action={deletePartner}
          id={partner.id}
          label={`«${partner.name}» tərəfdaşını sil`}
          title="Tərəfdaşı silmək"
          description="Qeyd soft-delete ediləcək; əlaqələr və audit izi saxlanılacaq."
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      ) : null}
    </>
  );

  return (
    <>
      <AdminPageHeader
        title="Tərəfdaşlar"
        description="Rəsmi tərəfdaş profilləri, statuslar, müqavilə müddətləri və əlaqələr."
        actions={
          <>
            <ButtonLink href={`${LIST_PATH}?silinmis=1`} variant="outline" size="sm">Silinmişlər</ButtonLink>
            {canCreate ? <ButtonLink href={`${LIST_PATH}/yeni`} size="sm"><Plus className="size-4" aria-hidden="true" />Yeni tərəfdaş</ButtonLink> : null}
          </>
        }
      />

      <nav aria-label="Tərəfdaş statusları" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <Link href={LIST_PATH} className="inline-flex min-h-11 shrink-0 items-center rounded-xs border border-line px-4 text-sm text-ink">
          Hamısı <span className="ml-2 text-ink-muted">{Object.values(counts).reduce((sum, value) => sum + value, 0)}</span>
        </Link>
        {[
          PARTNER_STATUSES.ACTIVE,
          PARTNER_STATUSES.PENDING,
          PARTNER_STATUSES.EXPIRED,
          PARTNER_STATUSES.ARCHIVED,
        ].map((status) => (
          <Link key={status} href={`${LIST_PATH}?status=${status}`} className="inline-flex min-h-11 shrink-0 items-center rounded-xs border border-line px-4 text-sm text-ink">
            {PARTNER_STATUS_LABELS[status]} <span className="ml-2 text-ink-muted">{counts[status] ?? 0}</span>
          </Link>
        ))}
      </nav>

      {alerts.length > 0 ? (
        <AdminCard className="mb-5" title="Müqavilə müddəti xəbərdarlığı">
          <ul className="space-y-2">
            {alerts.map((partner) => {
              const days = daysUntilPartnershipEnd(partner);
              return (
                <li key={partner.id} className="flex flex-wrap items-center gap-2 text-sm text-warning">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                  <Link href={`${LIST_PATH}/${partner.id}`} className="font-medium underline-offset-4 hover:underline">{partner.name}</Link>
                  <span>{days !== null && days < 0 ? "müddəti bitib" : `${days} gün qalıb`}</span>
                </li>
              );
            })}
          </ul>
        </AdminCard>
      ) : null}

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action={LIST_PATH}
          searchValue={filters.search}
          searchPlaceholder="Ad, hüquqi ad, sayt və ya e-poçt…"
          resultLabel={`${total} tərəfdaş`}
          hidden={deleted ? { silinmis: "1" } : {}}
          selects={[
            { name: "status", label: "Status", value: filters.status, options: [{ value: "", label: "Bütün statuslar" }, ...Object.values(PARTNER_STATUSES).map((value) => ({ value, label: PARTNER_STATUS_LABELS[value] }))] },
            { name: "tip", label: "Tip", value: filters.type, options: [{ value: "", label: "Bütün növlər" }, ...Object.values(PARTNERSHIP_TYPES).map((value) => ({ value, label: PARTNERSHIP_TYPE_LABELS[value] }))] },
            { name: "tesdiq", label: "Təsdiq", value: filters.verified, options: [{ value: "", label: "Təsdiq: hamısı" }, { value: "1", label: "Təsdiqlənib" }, { value: "0", label: "Təsdiqlənməyib" }] },
            { name: "resmi", label: "Rəsmi", value: filters.official, options: [{ value: "", label: "Rəsmi: hamısı" }, { value: "1", label: "Rəsmi" }, { value: "0", label: "Rəsmi deyil" }] },
            { name: "secilmis", label: "Seçilmiş", value: filters.featured, options: [{ value: "", label: "Seçilmiş: hamısı" }, { value: "1", label: "Seçilmiş" }, { value: "0", label: "Seçilməyib" }] },
            { name: "ana_sehife", label: "Ana səhifə", value: filters.homepage, options: [{ value: "", label: "Ana səhifə: hamısı" }, { value: "1", label: "Göstərilir" }, { value: "0", label: "Göstərilmir" }] },
            { name: "olke", label: "Ölkə", value: filters.country, options: [{ value: "", label: "Bütün ölkələr" }, ...countries.map((value) => ({ value, label: value }))] },
            { name: "yaradilma", label: "Yaradılma", value: period, options: [{ value: "", label: "Bütün tarixlər" }, { value: "7", label: "Son 7 gün" }, { value: "30", label: "Son 30 gün" }, { value: "365", label: "Son 1 il" }] },
          ]}
        />

        <div className="p-4 sm:p-5">
          <AdminResponsiveList
            ariaLabel="Tərəfdaş siyahısı"
            items={items}
            getKey={(partner) => partner.id}
            empty={<EmptyState title="Tərəfdaş tapılmadı" description="Filtrləri dəyişin və ya yeni tərəfdaş yaradın." />}
            renderCard={(partner) => (
              <AdminListCard
                title={partner.name}
                meta={`${PARTNERSHIP_TYPE_LABELS[partner.partnershipType as PartnershipType] ?? partner.partnershipType} · ${partner.city || partner.country || "Yerləşmə yoxdur"}`}
                status={statusBadge(partner.status)}
                actions={renderActions(partner)}
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span>Elan: {partner._count.properties}</span><span>Layihə: {partner._count.projects}</span>
                  <span>{partner.verified ? "Təsdiqlənib" : "Təsdiqsiz"}</span><span>{partner.showOnHomepage ? "Ana səhifədə" : "Ana səhifədə deyil"}</span>
                </div>
              </AdminListCard>
            )}
            renderTable={(rows) => (
              <AdminTable
                caption="Tərəfdaşlar"
                headers={[
                  { label: "Loqo / Ad" }, { label: "Tip" }, { label: "Status" },
                  { label: "Təsdiq / Rəsmi" }, { label: "Seçilmiş / Ana səhifə" },
                  { label: "Başlama / Bitmə" }, { label: "Elan / Layihə" },
                  { label: "Son yenilənmə" }, { label: "Əməliyyat", srOnly: true },
                ]}
              >
                {rows.map((partner) => (
                  <AdminTableRow key={partner.id}>
                    <AdminTableCell>
                      <div className="flex min-w-44 items-center gap-3">
                        <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xs border border-line bg-ivory text-xs font-semibold text-ink">
                          {partner.logoUrl ?? partner.logoLight ?? partner.logoDark ? <Image src={(partner.logoUrl ?? partner.logoLight ?? partner.logoDark) as string} alt="" fill sizes="44px" unoptimized={isUnoptimizedImage((partner.logoUrl ?? partner.logoLight ?? partner.logoDark) as string)} className={!partner.logoUrl && !partner.logoLight ? "object-contain bg-navy p-1" : "object-contain p-1"} /> : partner.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div><p className="font-medium text-ink">{partner.name}</p><p className="text-xs text-ink-muted">/{partner.slug}</p></div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>{PARTNERSHIP_TYPE_LABELS[partner.partnershipType as PartnershipType] ?? partner.partnershipType}</AdminTableCell>
                    <AdminTableCell>{statusBadge(partner.status)}</AdminTableCell>
                    <AdminTableCell><div className="flex flex-col gap-1 text-xs"><span>{partner.verified ? "Təsdiqlənib" : "Təsdiqsiz"}</span><span>{partner.officialPartner ? "Rəsmi" : "Rəsmi deyil"}</span></div></AdminTableCell>
                    <AdminTableCell><div className="flex flex-col gap-1 text-xs"><span>{partner.featured ? "Seçilmiş" : "Adi"}</span><span>{partner.showOnHomepage ? "Ana səhifədə" : "Göstərilmir"}</span></div></AdminTableCell>
                    <AdminTableCell><div className="flex flex-col gap-1 text-xs"><span>{partner.officialSince?.toLocaleDateString("az-AZ") ?? "—"}</span><span>{partner.partnershipEndDate?.toLocaleDateString("az-AZ") ?? "—"}</span></div></AdminTableCell>
                    <AdminTableCell>{partner._count.properties} / {partner._count.projects}</AdminTableCell>
                    <AdminTableCell className="whitespace-nowrap text-xs text-ink-muted">{formatRelative(partner.updatedAt)}</AdminTableCell>
                    <AdminTableCell><div className="flex justify-end">{renderActions(partner)}</div></AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
            )}
          />
          <div className="mt-5"><Pagination page={page} totalPages={totalPages} buildHref={buildHref} /></div>
        </div>
      </AdminCard>
    </>
  );
}
