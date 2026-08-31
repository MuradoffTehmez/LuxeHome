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
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.partners.terefdaslar") };
}
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

function statusBadge(status: string, t: Awaited<ReturnType<typeof getAdminT>>) {
  const normalized = status in PARTNER_STATUS_LABELS ? (status as PartnerStatus) : PARTNER_STATUSES.DRAFT;
  return <Badge tone={PARTNER_STATUS_TONE[normalized]}>{t(`labels.partnerStatus.${normalized}`)}</Badge>;
}

export default async function AdminPartnersPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getAdminT();
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
      label={t("pages.common.terefdasiniBerpaEt", { p0: partner.name })}
      title={t("pages.partners.terefdasiBerpaEtmek")}
      description={t("pages.partners.qeydArxivStatusundaBerpa")}
      confirmLabel={t("pages.partners.berpaEt")}
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
          label={partner.showPublicly ? t("pages.common.terefdasiniSaytdanGizlet", { p0: partner.name }) : t("pages.common.terefdasiniSaytdaGoster", { p0: partner.name })}
          title={partner.showPublicly ? t("pages.misc.terefdasiSaytdanGizletmek") : t("pages.misc.terefdasiSaytdaGostermek")}
          description={partner.showPublicly ? t("pages.misc.melumatSilinmeyecekIctimaiProfil") : t("pages.misc.aktivTerefdasinIctimaiProfili")}
          confirmLabel={partner.showPublicly ? t("pages.misc.gizlet") : t("pages.misc.saytdaGoster")}
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
          aria-label={t("pages.common.profiliniSaytdaAc", { p0: partner.name })}
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
      {canUpdate ? (
        <Link
          href={`${LIST_PATH}/${partner.id}`}
          className="grid size-11 place-items-center rounded-xs text-ink-muted hover:bg-beige hover:text-ink"
          aria-label={t("pages.common.terefdasiniRedakteEt", { p0: partner.name })}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
      {canDelete ? (
        <ConfirmAction
          action={deletePartner}
          id={partner.id}
          label={t("pages.common.terefdasiniSil", { p0: partner.name })}
          title={t("pages.partners.terefdasiSilmek")}
          description={t("pages.partners.qeydSoftDeleteEdilecek")}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      ) : null}
    </>
  );

  return (
    <>
      <AdminPageHeader
        title={t("pages.partners.terefdaslar")}
        description={t("pages.partners.resmiTerefdasProfilleriStatuslar")}
        actions={
          <>
            <ButtonLink href={`${LIST_PATH}?silinmis=1`} variant="outline" size="sm">{t("pages.partners.silinmisler")}</ButtonLink>
            {canCreate ? <ButtonLink href={`${LIST_PATH}/yeni`} size="sm"><Plus className="size-4" aria-hidden="true" />{t("pages.partners.yeniTerefdas")}</ButtonLink> : null}
          </>
        }
      />

      <nav aria-label={t("pages.partners.terefdasStatuslari")} className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <Link href={LIST_PATH} className="inline-flex min-h-11 shrink-0 items-center rounded-xs border border-line px-4 text-sm text-ink">
          {t("pages.partners.hamisi")} <span className="ml-2 text-ink-muted">{Object.values(counts).reduce((sum, value) => sum + value, 0)}</span>
        </Link>
        {[
          PARTNER_STATUSES.ACTIVE,
          PARTNER_STATUSES.PENDING,
          PARTNER_STATUSES.EXPIRED,
          PARTNER_STATUSES.ARCHIVED,
        ].map((status) => (
          <Link key={status} href={`${LIST_PATH}?status=${status}`} className="inline-flex min-h-11 shrink-0 items-center rounded-xs border border-line px-4 text-sm text-ink">
            {t(`labels.partnerStatus.${status}`)} <span className="ml-2 text-ink-muted">{counts[status] ?? 0}</span>
          </Link>
        ))}
      </nav>

      {alerts.length > 0 ? (
        <AdminCard className="mb-5" title={t("pages.partners.muqavileMuddetiXeberdarligi")}>
          <ul className="space-y-2">
            {alerts.map((partner) => {
              const days = daysUntilPartnershipEnd(partner);
              return (
                <li key={partner.id} className="flex flex-wrap items-center gap-2 text-sm text-warning">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                  <Link href={`${LIST_PATH}/${partner.id}`} className="font-medium underline-offset-4 hover:underline">{partner.name}</Link>
                  <span>{days !== null && days < 0 ? t("pages.common.muddetiBitib") : t("pages.common.gunQalib", { p0: days ?? 0 })}</span>
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
          searchPlaceholder={t("pages.partners.adHuquqiAdSayt")}
          resultLabel={t("pages.common.terefdas", { p0: total })}
          hidden={deleted ? { silinmis: "1" } : {}}
          selects={[
            { name: "status", label: t("pages.partners.status"), value: filters.status, options: [{ value: "", label: t("pages.partners.butunStatuslar") }, ...Object.values(PARTNER_STATUSES).map((value) => ({ value, label: t(`labels.partnerStatus.${value}`) }))] },
            { name: "tip", label: t("pages.partners.tip"), value: filters.type, options: [{ value: "", label: t("pages.partners.butunNovler") }, ...Object.values(PARTNERSHIP_TYPES).map((value) => ({ value, label: t(`labels.partnershipType.${value}`) }))] },
            { name: "tesdiq", label: t("pages.partners.tesdiq"), value: filters.verified, options: [{ value: "", label: t("pages.partners.tesdiqHamisi") }, { value: "1", label: t("pages.partners.tesdiqlenib") }, { value: "0", label: t("pages.partners.tesdiqlenmeyib") }] },
            { name: "resmi", label: t("pages.partners.resmi"), value: filters.official, options: [{ value: "", label: t("pages.partners.resmiHamisi") }, { value: "1", label: t("pages.partners.resmi") }, { value: "0", label: t("pages.partners.resmiDeyil") }] },
            { name: "secilmis", label: t("pages.partners.secilmis"), value: filters.featured, options: [{ value: "", label: t("pages.partners.secilmisHamisi") }, { value: "1", label: t("pages.partners.secilmis") }, { value: "0", label: t("pages.partners.secilmeyib") }] },
            { name: "ana_sehife", label: t("pages.partners.anaSehife"), value: filters.homepage, options: [{ value: "", label: t("pages.partners.anaSehifeHamisi") }, { value: "1", label: t("pages.partners.gosterilir") }, { value: "0", label: t("pages.partners.gosterilmir") }] },
            { name: "olke", label: t("pages.partners.olke"), value: filters.country, options: [{ value: "", label: t("pages.partners.butunOlkeler") }, ...countries.map((value) => ({ value, label: value }))] },
            { name: "yaradilma", label: t("pages.partners.yaradilma"), value: period, options: [{ value: "", label: t("pages.partners.butunTarixler") }, { value: "7", label: t("pages.partners.son7Gun") }, { value: "30", label: t("pages.partners.son30Gun") }, { value: "365", label: t("pages.partners.son1Il") }] },
          ]}
        />

        <div className="p-4 sm:p-5">
          <AdminResponsiveList
            ariaLabel={t("pages.partners.terefdasSiyahisi")}
            items={items}
            getKey={(partner) => partner.id}
            empty={<EmptyState title={t("pages.partners.terefdasTapilmadi")} description={t("pages.partners.filtrleriDeyisinVeYa")} />}
            renderCard={(partner) => (
              <AdminListCard
                title={partner.name}
                meta={`${t(`labels.partnershipType.${partner.partnershipType as PartnershipType}`) ?? partner.partnershipType} · ${partner.city || partner.country || t("pages.misc.yerlesmeYoxdur")}`}
                status={statusBadge(partner.status, t)}
                actions={renderActions(partner)}
              >
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span>Elan: {partner._count.properties}</span><span>Layihə: {partner._count.projects}</span>
                  <span>{partner.verified ? t("pages.misc.tesdiqlenib") : t("pages.misc.tesdiqsiz")}</span><span>{partner.showOnHomepage ? t("pages.misc.anaSehifede") : t("pages.misc.anaSehifedeDeyil")}</span>
                </div>
              </AdminListCard>
            )}
            renderTable={(rows) => (
              <AdminTable
                caption={t("pages.partners.terefdaslar")}
                headers={[
                  { label: t("pages.partners.loqoAd") }, { label: t("pages.partners.tip") }, { label: t("pages.partners.status") },
                  { label: t("pages.partners.tesdiqResmi") }, { label: t("pages.partners.secilmisAnaSehife") },
                  { label: t("pages.partners.baslamaBitme") }, { label: t("pages.partners.elanLayihe") },
                  { label: t("pages.partners.sonYenilenme") }, { label: t("pages.partners.emeliyyat"), srOnly: true },
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
                    <AdminTableCell>{t(`labels.partnershipType.${partner.partnershipType as PartnershipType}`) ?? partner.partnershipType}</AdminTableCell>
                    <AdminTableCell>{statusBadge(partner.status, t)}</AdminTableCell>
                    <AdminTableCell><div className="flex flex-col gap-1 text-xs"><span>{partner.verified ? t("pages.misc.tesdiqlenib") : t("pages.misc.tesdiqsiz")}</span><span>{partner.officialPartner ? t("pages.misc.resmi") : t("pages.misc.resmiDeyil")}</span></div></AdminTableCell>
                    <AdminTableCell><div className="flex flex-col gap-1 text-xs"><span>{partner.featured ? t("pages.misc.secilmis") : "Adi"}</span><span>{partner.showOnHomepage ? t("pages.misc.anaSehifede") : t("pages.misc.gosterilmir")}</span></div></AdminTableCell>
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
