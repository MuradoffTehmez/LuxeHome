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
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUSES,
  type ListingType,
  type PropertyStatus,
} from "@/lib/constants";
import { getAdminProperties, getPropertyFormOptions } from "@/lib/queries";
import { deleteProperty, restoreProperty } from "./actions";
import { BulkActionsForm, RowCheckbox } from "./bulk-actions";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";

export const metadata: Metadata = { title: "Əmlaklar" };
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
        label={`«${property.title}» elanını bərpa et`}
        title="Elanı bərpa etmək"
        description="Elan yenidən aktiv siyahıya qayıdacaq. Statusu dəyişmir."
        confirmLabel="Bərpa et"
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
          aria-label={`«${property.title}» elanını saytda aç`}
          title="Saytda bax"
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Eye className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href={`${LIST_PATH}/${property.id}`}
          aria-label={`«${property.title}» elanını redaktə et`}
          title="Redaktə et"
          className="grid size-11 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
        <ConfirmAction
          action={deleteProperty}
          id={property.id}
          label={`«${property.title}» elanını sil`}
          title="Elanı silmək"
          description="Elan saytdan çıxarılacaq, amma zibil qutusunda qalacaq və bərpa edilə bilər."
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
        title={deleted ? "Silinmiş elanlar" : "Əmlaklar"}
        description={
          deleted
            ? "Silinmiş elanlar burada saxlanılır və bərpa edilə bilər."
            : `Ümumilikdə ${total} elan tapıldı.`
        }
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          ...(deleted ? [{ label: "Əmlaklar", href: LIST_PATH }] : []),
          { label: deleted ? "Silinmişlər" : "Əmlaklar" },
        ]}
        actions={
          <>
            <ButtonLink
              href={deleted ? LIST_PATH : `${LIST_PATH}?silinmis=1`}
              variant="outline"
              size="sm"
            >
              {deleted ? "Aktiv elanlar" : "Zibil qutusu"}
            </ButtonLink>
            <ButtonLink href={`${LIST_PATH}/yeni`} variant="primary" size="sm">
              <Plus className="size-4" aria-hidden="true" />
              Yeni elan
            </ButtonLink>
          </>
        }
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          action={LIST_PATH}
          searchValue={filters.q}
          searchPlaceholder="Başlıq, ünvan və ya slug üzrə axtar…"
          resultLabel={`${total} elan tapıldı`}
          hidden={deleted ? { silinmis: "1" } : {}}
          selects={[
            {
              name: "status",
              label: "Status",
              value: filters.status,
              options: [
                { value: "", label: "Bütün statuslar" },
                ...Object.values(PROPERTY_STATUSES).map((value) => ({
                  value,
                  label: PROPERTY_STATUS_LABELS[value],
                })),
              ],
            },
            {
              name: "elan",
              label: "Elan növü",
              value: filters.listingType,
              options: [
                { value: "", label: "Hamısı" },
                ...Object.values(LISTING_TYPES).map((value) => ({
                  value,
                  label: LISTING_TYPE_LABELS[value],
                })),
              ],
            },
            {
              name: "tip",
              label: "Əmlak növü",
              value: filters.typeId,
              options: [
                { value: "", label: "Bütün növlər" },
                ...options.types.map((type) => ({ value: type.id, label: type.name })),
              ],
            },
            {
              name: "seher",
              label: "Şəhər",
              value: filters.cityId,
              options: [
                { value: "", label: "Bütün şəhərlər" },
                ...options.cities.map((city) => ({ value: city.id, label: city.name })),
              ],
            },
          ]}
        />

        <BulkActionsForm mode={deleted ? "deleted" : "active"}>
        <div className="p-4 lg:p-0">
          <AdminResponsiveList
            ariaLabel="Əmlak elanları"
            items={rows}
            getKey={(property) => property.id}
            empty={
              <p className="py-10 text-center text-sm text-ink-muted">
                {filters.q || filters.status || filters.listingType
                  ? "Bu filtrlərə uyğun elan tapılmadı."
                  : "Hələ əmlak əlavə edilməyib."}
              </p>
            }
            renderCard={(property) => (
              <AdminListCard
                title={
                  <span className="flex items-start gap-2">
                    <RowCheckbox id={property.id} />
                    {property.isFeatured ? (
                      <Star className="mt-1 size-3.5 shrink-0 fill-current text-gold" aria-label="Tövsiyə olunan" />
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
                    label={PROPERTY_STATUS_LABELS[property.status as PropertyStatus]}
                  />
                }
                actions={renderActions(property)}
              >
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <dt className="text-xs text-ink-muted">Elan</dt>
                    <dd className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={property.listingType === "SALE" ? "dark" : "gold"}>
                        {LISTING_TYPE_LABELS[property.listingType as ListingType]}
                      </Badge>
                      <span>{property.type.name}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Qiymət</dt>
                    <dd className="tabular mt-1 font-medium text-ink">{formatPrice(property.price, property.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Ölçü</dt>
                    <dd className="tabular mt-1 text-ink">
                      {property.area ? formatArea(property.area) : "—"}
                      {property.rooms ? ` · ${property.rooms} otaq` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Baxış</dt>
                    <dd className="tabular mt-1 text-ink">{formatNumber(property.viewCount)}</dd>
                  </div>
                </dl>
              </AdminListCard>
            )}
            renderTable={(items) => (
              <AdminTable
                caption="Əmlak elanları"
                headers={[
                  { label: "Seç", srOnly: true },
                  { label: "Elan" },
                  { label: "Növ" },
                  { label: "Qiymət", className: "text-right" },
                  { label: "Ölçü", className: "text-right" },
                  { label: "Status" },
                  { label: "Baxış", className: "text-right" },
                  { label: "Yenilənib", className: "text-right" },
                  { label: "Əməliyyatlar", srOnly: true, className: "text-right" },
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
                          <Star className="mt-1 size-3.5 shrink-0 fill-current text-gold" aria-label="Tövsiyə olunan" />
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
                          {LISTING_TYPE_LABELS[property.listingType as ListingType]}
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
                      <StatusBadge status={property.status as PropertyStatus} label={PROPERTY_STATUS_LABELS[property.status as PropertyStatus]} />
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
            {total === 0 ? "0 elan göstərilir" : `${total} elandan ${rows.length} göstərilir`}
          </span>
          <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </AdminCard>
    </>
  );
}
