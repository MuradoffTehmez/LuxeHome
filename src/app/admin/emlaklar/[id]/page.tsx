import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, History, Trash2 } from "lucide-react";
import { AdminCard, AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { getAdminPropertyById, getPropertyFormOptions } from "@/lib/queries";
import { deleteProperty, updateProperty } from "../actions";
import type { PropertyFormValues } from "../form-values";
import { PropertyForm } from "../property-form";
import { localizePath } from "@/i18n/path-locale";
import { getAdminI18n } from "@/lib/admin-i18n";
import { getAdminT } from "@/lib/admin-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAdminT();
  return { title: t("pages.properties.elaninRedaktesi") };
}
export const dynamic = "force-dynamic";

/** Rəqəm sahələri formada sətir kimi yaşayır — `null` boş input deməkdir. */
const num = (value: number | null): string => (value === null ? "" : String(value));

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getAdminT();
  const { locale } = await getAdminI18n();
  await requireAdminRead(PERMISSIONS.PROPERTY_MANAGE);

  const { id } = await params;
  const [property, options] = await Promise.all([
    getAdminPropertyById(id),
    getPropertyFormOptions(),
  ]);

  if (!property) notFound();

  const initial: PropertyFormValues = {
    id: property.id,
    title: property.title,
    slug: property.slug,
    description: property.description,
    listingType: property.listingType,
    status: property.status,
    price: num(property.price),
    currency: property.currency,
    pricePeriod: property.pricePeriod ?? "",
    typeId: property.typeId,
    cityId: property.cityId,
    districtId: property.districtId ?? "",
    metroId: property.metroId ?? "",
    projectId: property.projectId ?? "",
    address: property.address ?? "",
    latitude: num(property.latitude),
    longitude: num(property.longitude),
    rooms: num(property.rooms),
    bedrooms: num(property.bedrooms),
    bathrooms: num(property.bathrooms),
    area: num(property.area),
    landArea: num(property.landArea),
    floor: num(property.floor),
    totalFloors: num(property.totalFloors),
    renovation: property.renovation ?? "",
    documentStatus: property.documentStatus ?? "",
    buildingType: property.buildingType ?? "",
    videoUrl: property.videoUrl ?? "",
    isFeatured: property.isFeatured,
    featuredUntil: property.featuredUntil ? property.featuredUntil.toISOString().slice(0, 10) : "",
    reservationEnabled: property.reservationEnabled,
    assignedAgentId: property.assignedAgentId ?? "",
    metaTitle: property.metaTitle ?? "",
    metaDescription: property.metaDescription ?? "",
    noIndex: property.noIndex,
    canonicalUrl: property.canonicalUrl ?? "",
    ogTitle: property.ogTitle ?? "",
    ogDescription: property.ogDescription ?? "",
    ogImage: property.ogImage ?? "",
    featureIds: property.features.map((feature) => feature.featureId),
    images: property.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      isCover: image.isCover,
    })),
  };

  return (
    <>
      <AdminPageHeader
        title={property.title}
        description={
          property.deletedAt
            ? t("pages.common.buElanTarixindeSilinib", { p0: formatDateTime(property.deletedAt) })
            : t("pages.common.sonYenilenmeBaxis", { p0: formatDateTime(property.updatedAt), p1: property.viewCount })
        }
        breadcrumbs={[
          { label: t("pages.properties.idarePaneli"), href: "/admin" },
          { label: t("pages.properties.emlaklar"), href: "/admin/emlaklar" },
          { label: t("pages.properties.redakte") },
        ]}
        actions={
          <Link
            href={localizePath(`/emlaklar/${property.slug}`, locale)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            {t("pages.properties.saytdaBax")}
          </Link>
        }
      />

      <PropertyForm
        action={updateProperty}
        options={options}
        initial={initial}
        submitLabel={t("pages.properties.deyisiklikleriSaxla")}
        extraActions={
          property.deletedAt ? null : (
            <ConfirmAction
              action={deleteProperty}
              id={property.id}
              label={t("pages.properties.elaniSil")}
              title={t("pages.properties.elaniSilmek")}
              description={t("pages.properties.elanSaytdanCixarilacaqAmma")}
              redirectTo="/admin/emlaklar"
              className="mr-auto"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </ConfirmAction>
          )
        }
      />

      <AdminCard
        title={t("pages.properties.qiymetTarixcesi")}
        description={t("pages.properties.qiymetTarixcesiTesviri")}
        className="mt-6"
      >
        {property.priceHistory.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("pages.properties.qiymetTarixcesiBosdur")}</p>
        ) : (
          <ol className="divide-y divide-line">
            {property.priceHistory.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                <History className="size-4 shrink-0 text-gold-deep" aria-hidden="true" />
                <span className="font-medium text-ink">
                  {formatPrice(entry.oldPrice, entry.currency)} → {formatPrice(entry.newPrice, entry.currency)}
                </span>
                <span className="text-xs text-ink-muted">{formatDateTime(entry.changedAt)}</span>
                <span className="ml-auto rounded-xs bg-beige px-2 py-1 text-xs text-ink-soft">
                  {t("pages.properties.menbe")}: {entry.source}
                </span>
              </li>
            ))}
          </ol>
        )}
      </AdminCard>
    </>
  );
}
