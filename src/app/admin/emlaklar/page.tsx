import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Pencil, Plus, RotateCcw, Star, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import {
  AdminListCard,
  AdminResponsiveList,
} from "@/components/admin/admin-responsive-list";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { formatArea, formatNumber, formatPrice, formatRelative } from "@/lib/utils";
import {
  LISTING_TYPES,
  PROPERTY_STATUSES,
  type ListingType,
  type PropertyStatus,
} from "@/lib/constants";
import { getAdminProperties, getPropertyFormOptions } from "@/lib/queries";
import { deleteProperty, restoreProperty } from "./actions";
import { BulkActionsForm, RowCheckbox } from "./bulk-actions";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.properties.emlaklar") };
}
export const dynamic = "force-dynamic";

const LIST_PATH = "/admin/emlaklar";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getAdminT();
  const { locale } = await getAdminI18n();
  const params = await searchParams;
  const deleted = one(params, "silinmis") === "1";

  const filters = {
    q: one(params, "q"),
    status: one(params, "status"),
    listingType: one(params, "elan"),
    typeId: one(params, "tip"),
    cityId: one(params, "seher"),
    deleted,
    page: Number(one(params, "sehife")) || 1,
  };

  const [{ rows, total, page, totalPages }, options] = await Promise.all([
    getAdminProperties(filters),
    getPropertyFormOptions(),
  ]);

  // Cari filtrləri saxlayan səhifələmə linki
  function buildHref(nextPage: number): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({
      q: filters.q,
      status: filters.status,
      elan: filters.listingType,
      tip: filters.typeId,
      seher: filters.cityId,
      silinmis: deleted ? "1" : "",
    })) {
      if (value) query.set(key, value);
    }
    if (nextPage > 1) query.set("sehife", String(nextPage));
    const search = query.toString();
    return search ? `${LIST_PATH}?${search}` : LIST_PATH;
  }

  function renderActions(property: (typeof rows)[number]) {
    return deleted ? (
      <ConfirmAction
        action={restoreProperty}
        id={property.id}
        label={t("pages.common.elaniniBerpaEt", { p0: property.title })}
        title={t("pages.properties.elaniBerpaEtmek")}
        description={t("pages.properties.elanYenidenAktivSiyahiya")}
        confirmLabel={t("pages.properties.berpaEt")}
        tone="neutral"
        className="size-11"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
      </ConfirmAction>
    ) : (
      <>
        <Link
          href={localizePath(`/emlaklar/${property.slug}`, locale)}
          target="_blank"
          rel="noreferrer"
          aria-label={t("pages.common.elaniniSaytdaAc", { p0: property.title })}
          title={t("pages.properties.saytdaBax")}
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href={`${LIST_PATH}/${property.id}`}
          aria-label={t("pages.common.elaniniRedakteEt", { p0: property.title })}
          title={t("pages.properties.redakteEt")}
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
        <ConfirmAction
          action={deleteProperty}
          id={property.id}
          label={t("pages.common.elaniniSil", { p0: property.title })}
          title={t("pages.properties.elaniSilmek")}
          description={t("pages.properties.elanSaytdanCixarilacaqAmma")}
          className="size-11"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title={deleted ? t("pages.misc.silinmisElanlar") : t("pages.misc.emlaklar")}
        description={
          deleted
            ? t("pages.misc.silinmisElanlarBuradaSaxlanilir")
            : t("pages.common.umumilikdeElanTapildi", { p0: total })
        }
        breadcrumbs={[
          { label: t("pages.properties.idarePaneli"), href: "/admin" },
          ...(deleted ? [{ label: t("pages.properties.emlaklar"), href: LIST_PATH }] : []),
          { label: deleted ? t("pages.misc.silinmisler") : t("pages.misc.emlaklar") },
        ]}
        actions={
          <>
            <ButtonLink
              href={deleted ? LIST_PATH : `${LIST_PATH}?silinmis=1`}
              variant="outline"
              size="sm"
            >
              {deleted ? t("pages.misc.aktivElanlar") : t("pages.misc.zibilQutusu")}
            </ButtonLink>
            <ButtonLink href={`${LIST_PATH}/yeni`} variant="primary" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              {t("pages.properties.yeniElan")}
            </ButtonLink>
          </>
        }
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action={LIST_PATH}
          searchValue={filters.q}
          searchPlaceholder={t("pages.properties.basliqUnvanVeYa")}
          resultLabel={t("pages.common.elanTapildi", { p0: total })}
          hidden={deleted ? { silinmis: "1" } : {}}
          selects={[
            {
              name: "status",
              label: t("pages.properties.status"),
              value: filters.status,
              options: [
                { value: "", label: t("pages.properties.butunStatuslar") },
                ...Object.values(PROPERTY_STATUSES).map((value) => ({
                  value,
                  label: t(`labels.propertyStatus.${value}`),
                })),
              ],
            },
            {
              name: "elan",
              label: t("pages.properties.elanNovu"),
              value: filters.listingType,
              options: [
                { value: "", label: t("pages.properties.hamisi") },
                ...Object.values(LISTING_TYPES).map((value) => ({
                  value,
                  label: t(`labels.listingType.${value}`),
                })),
              ],
            },
            {
              name: "tip",
              label: t("pages.properties.emlakNovu"),
              value: filters.typeId,
              options: [
                { value: "", label: t("pages.properties.butunNovler") },
                ...options.types.map((type) => ({ value: type.id, label: type.name })),
              ],
            },
            {
              name: "seher",
              label: t("pages.properties.seher"),
              value: filters.cityId,
              options: [
                { value: "", label: t("pages.properties.butunSeherler") },
                ...options.cities.map((city) => ({ value: city.id, label: city.name })),
              ],
            },
          ]}
        />

        <BulkActionsForm mode={deleted ? "deleted" : "active"}>
        <div className="p-4 lg:p-0">
          <AdminResponsiveList
            ariaLabel={t("pages.properties.emlakElanlari")}
            items={rows}
            getKey={(property) => property.id}
            empty={
              <p className="py-10 text-center text-sm text-ink-muted">
                {filters.q || filters.status || filters.listingType
                  ? t("pages.misc.buFiltrlereUygunElan")
                  : t("pages.misc.heleEmlakElaveEdilmeyib")}
              </p>
            }
            renderCard={(property) => (
              <AdminListCard
                title={
                  <span className="flex items-start gap-2">
                    <RowCheckbox id={property.id} />
                    {property.isFeatured ? (
                      <Star className="mt-1 size-3.5 shrink-0 fill-current text-gold" aria-label={t("pages.properties.tovsiyeOlunan")} />
                    ) : null}
                    <Link href={`${LIST_PATH}/${property.id}`} className="transition-colors hover:text-gold-deep">
                      {property.title}
                    </Link>
                  </span>
                }
                meta={
                  <>
                    {[property.district?.name, property.city.name].filter(Boolean).join(", ")}
                    <span className="mt-1 block">{formatRelative(property.updatedAt)}</span>
                  </>
                }
                status={
                  <StatusBadge
                    status={property.status as PropertyStatus}
                    label={t(`labels.propertyStatus.${property.status as PropertyStatus}`)}
                  />
                }
                actions={renderActions(property)}
              >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.properties.elan")}</dt>
                    <dd className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={property.listingType === "SALE" ? "dark" : "gold"}>
                        {t(`labels.listingType.${property.listingType as ListingType}`)}
                      </Badge>
                      <span>{property.type.name}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.properties.qiymet")}</dt>
                    <dd className="tabular mt-1 font-medium text-ink">{formatPrice(property.price, property.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.properties.olcu")}</dt>
                    <dd className="tabular mt-1 text-ink">
                      {property.area ? formatArea(property.area) : "—"}
                      {property.rooms ? ` · ${property.rooms} otaq` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">{t("pages.properties.baxis")}</dt>
                    <dd className="tabular mt-1 text-ink">{formatNumber(property.viewCount)}</dd>
                  </div>
                </dl>
              </AdminListCard>
            )}
            renderTable={(items) => (
              <AdminTable
                caption={t("pages.properties.emlakElanlari")}
                headers={[
                  { label: t("pages.properties.sec"), srOnly: true },
                  { label: t("pages.properties.elan") },
                  { label: t("pages.properties.nov") },
                  { label: t("pages.properties.qiymet"), className: "text-right" },
                  { label: t("pages.properties.olcu"), className: "text-right" },
                  { label: t("pages.properties.status") },
                  { label: t("pages.properties.baxis"), className: "text-right" },
                  { label: t("pages.properties.yenilenib"), className: "text-right" },
                  { label: t("pages.properties.emeliyyatlar"), srOnly: true, className: "text-right" },
                ]}
              >
                {items.map((property) => (
                  <AdminTableRow key={property.id}>
                    <AdminTableCell className="w-9">
                      <RowCheckbox id={property.id} />
                    </AdminTableCell>
                    <AdminTableCell className="max-w-xs">
                      <div className="flex items-start gap-2">
                        {property.isFeatured ? (
                          <Star className="mt-1 size-3.5 shrink-0 fill-current text-gold" aria-label={t("pages.properties.tovsiyeOlunan")} />
                        ) : null}
                        <div className="min-w-0">
                          <Link href={`${LIST_PATH}/${property.id}`} className="line-clamp-1 font-medium text-ink transition-colors hover:text-gold-deep">
                            {property.title}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {[property.district?.name, property.city.name].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell>
                      <div className="flex flex-col gap-1">
                        <Badge tone={property.listingType === "SALE" ? "dark" : "gold"}>
                          {t(`labels.listingType.${property.listingType as ListingType}`)}
                        </Badge>
                        <span className="text-xs text-ink-muted">{property.type.name}</span>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell align="right" className="tabular font-medium whitespace-nowrap">
                      {formatPrice(property.price, property.currency)}
                    </AdminTableCell>
                    <AdminTableCell align="right" className="tabular text-sm whitespace-nowrap text-ink-soft">
                      {property.area ? formatArea(property.area) : "—"}
                      {property.rooms ? ` · ${property.rooms} otaq` : ""}
                    </AdminTableCell>
                    <AdminTableCell>
                      <StatusBadge status={property.status as PropertyStatus} label={t(`labels.propertyStatus.${property.status as PropertyStatus}`)} />
                    </AdminTableCell>
                    <AdminTableCell align="right" className="tabular text-sm text-ink-soft">
                      {formatNumber(property.viewCount)}
                    </AdminTableCell>
                    <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                      {formatRelative(property.updatedAt)}
                    </AdminTableCell>
                    <AdminTableCell align="right">
                      <div className="flex items-center justify-end gap-0.5">{renderActions(property)}</div>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTable>
            )}
          />
        </div>
        </BulkActionsForm>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-sm text-ink-muted">
          <span className="tabular">
            {total === 0 ? t("pages.misc.0ElanGosterilir") : t("pages.common.elandanGosterilir", { p0: total, p1: rows.length })}
          </span>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </AdminCard>
    </>
  );
}
