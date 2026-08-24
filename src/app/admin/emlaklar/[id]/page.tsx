import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PERMISSIONS } from "@/lib/constants";
import { requireAdminRead } from "@/lib/admin/guard";
import { formatDateTime } from "@/lib/utils";
import { getAdminPropertyById, getPropertyFormOptions } from "@/lib/queries";
import { deleteProperty, updateProperty } from "../actions";
import type { PropertyFormValues } from "../form-values";
import { PropertyForm } from "../property-form";

export const metadata: Metadata = { title: "Elanın redaktəsi" };
export const dynamic = "force-dynamic";

/** Rəqəm sahələri formada sətir kimi yaşayır — `null` boş input deməkdir. */
const num = (value: number | null): string => (value === null ? "" : String(value));

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    mortgageAvailable: property.mortgageAvailable,
    installmentAvailable: property.installmentAvailable,
    isFeatured: property.isFeatured,
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
            ? `Bu elan ${formatDateTime(property.deletedAt)} tarixində silinib.`
            : `Son yenilənmə: ${formatDateTime(property.updatedAt)} · ${property.viewCount} baxış`
        }
        breadcrumbs={[
          { label: "İdarə paneli", href: "/admin" },
          { label: "Əmlaklar", href: "/admin/emlaklar" },
          { label: "Redaktə" },
        ]}
        actions={
          <Link
            href={`/emlaklar/${property.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xs border border-line-strong px-4 text-sm text-ink transition-colors hover:border-gold hover:text-gold-deep"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Saytda bax
          </Link>
        }
      />

      <PropertyForm
        action={updateProperty}
        options={options}
        initial={initial}
        submitLabel="Dəyişiklikləri saxla"
        extraActions={
          property.deletedAt ? null : (
            <ConfirmAction
              action={deleteProperty}
              id={property.id}
              label="Elanı sil"
              title="Elanı silmək"
              description="Elan saytdan çıxarılacaq, amma zibil qutusunda qalacaq və bərpa edilə bilər."
              redirectTo="/admin/emlaklar"
              className="mr-auto"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </ConfirmAction>
          )
        }
      />
    </>
  );
}
