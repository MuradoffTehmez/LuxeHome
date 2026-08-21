import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  AdminTableCell,
  AdminTableRow,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { formatArea, formatNumber, formatPrice, formatRelative } from "@/lib/utils";
import {
  LISTING_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUSES,
  type ListingType,
  type PropertyStatus,
} from "@/lib/constants";
import { getAdminProperties } from "@/lib/queries";

export const metadata: Metadata = { title: "Əmlaklar" };

const STATUS_FILTERS = [
  { value: "", label: "Bütün statuslar" },
  ...Object.values(PROPERTY_STATUSES).map((value) => ({
    value,
    label: PROPERTY_STATUS_LABELS[value],
  })),
];

export default async function AdminPropertiesPage() {
  const properties = await getAdminProperties();
  const activeCount = properties.filter(
    (property) => property.status === PROPERTY_STATUSES.PUBLISHED,
  ).length;
  const draftCount = properties.filter(
    (property) => property.status === PROPERTY_STATUSES.DRAFT,
  ).length;

  return (
    <>
      <AdminPageHeader
        title="Əmlaklar"
        description={`${activeCount} aktiv, ${draftCount} qaralama elan.`}
        breadcrumbs={[{ label: "İdarə paneli", href: "/admin" }, { label: "Əmlaklar" }]}
        actions={
          <ButtonLink href="/admin/emlaklar/yeni" variant="primary" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Yeni elan
          </ButtonLink>
        }
      />

      <AdminCard bodyClassName="p-0">
        <AdminFilterBar
          searchPlaceholder="Başlıq, ünvan və ya slug üzrə axtar…"
          selects={[
            { name: "status", label: "Status", options: STATUS_FILTERS },
            {
              name: "elan",
              label: "Elan növü",
              options: [
                { value: "", label: "Hamısı" },
                { value: "SALE", label: "Satılır" },
                { value: "RENT", label: "Kirayə" },
              ],
            },
            {
              name: "tip",
              label: "Əmlak növü",
              options: [
                { value: "", label: "Hamısı" },
                { value: "menziller", label: "Mənzillər" },
                { value: "villalar", label: "Villalar" },
                { value: "heyet-evleri", label: "Həyət evləri" },
                { value: "ofisler", label: "Ofislər" },
                { value: "bag-evleri", label: "Bağ evləri" },
              ],
            },
          ]}
        />

        <AdminTable
          caption="Əmlak elanları"
          headers={[
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
          {properties.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-muted">
                Hələ əmlak əlavə edilməyib.
              </td>
            </tr>
          )}
          {properties.map((property) => (
            <AdminTableRow key={property.id}>
              <AdminTableCell className="max-w-xs">
                <div className="flex items-start gap-2">
                  {property.isFeatured && (
                    <Star
                      className="mt-1 size-3.5 shrink-0 fill-current text-gold"
                      aria-label="Tövsiyə olunan"
                    />
                  )}
                  <div className="min-w-0">
                    <Link
                      href={`/admin/emlaklar/${property.id}`}
                      className="line-clamp-1 font-medium text-ink transition-colors hover:text-gold-deep"
                    >
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
                <StatusBadge
                  status={property.status as PropertyStatus}
                  label={PROPERTY_STATUS_LABELS[property.status as PropertyStatus]}
                />
              </AdminTableCell>

              <AdminTableCell align="right" className="tabular text-sm text-ink-soft">
                {formatNumber(property.viewCount)}
              </AdminTableCell>

              <AdminTableCell align="right" className="text-xs whitespace-nowrap text-ink-muted">
                {formatRelative(property.updatedAt)}
              </AdminTableCell>

              <AdminTableCell align="right">
                <div className="flex items-center justify-end gap-0.5">
                  <Link
                    href={`/emlaklar/${property.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`«${property.title}» elanını saytda aç`}
                    title="Saytda bax"
                    className="grid size-9 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/admin/emlaklar/${property.id}`}
                    aria-label={`«${property.title}» elanını redaktə et`}
                    title="Redaktə et"
                    className="grid size-9 place-items-center rounded-xs text-ink-muted transition-colors hover:bg-beige hover:text-ink"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    aria-label={`«${property.title}» elanını sil`}
                    title="Sil"
                    className="grid size-9 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-sm text-ink-muted">
          <span className="tabular">
            {properties.length === 0
              ? "0 elan göstərilir"
              : `${properties.length} elandan 1–${properties.length} göstərilir`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="min-h-9 rounded-xs px-3 text-sm text-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Əvvəlki
            </button>
            <button
              type="button"
              disabled
              className="min-h-9 rounded-xs px-3 text-sm text-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Növbəti
            </button>
          </div>
        </div>
      </AdminCard>
    </>
  );
}
