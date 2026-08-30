import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { requireLister } from "@/lib/auth/guard";
import { type Locale } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getPropertyFormOptions } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { localizeKnownContent, localizeLocation } from "@/i18n/dynamic-content";
import { updatePublicProperty } from "../actions";
import {
  PublicPropertyForm,
  type PublicPropertyFormInitial,
} from "../yeni/public-property-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "account.newProperty" });
  return buildMetadata({
    title: t("editMetaTitle"),
    description: t("editMetaDescription"),
    path: "/kabinet/elanlar",
    noIndex: true,
    locale: locale as Locale,
  });
}

export default async function EditPublicPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const locale = await getLocale() as Locale;
  const user = await requireLister(locale);
  const { id } = await params;
  const [property, sourceOptions, t] = await Promise.all([
    prisma.property.findFirst({
      where: { id, authorId: user.id, deletedAt: null },
      select: {
        title: true,
        description: true,
        listingType: true,
        currency: true,
        price: true,
        pricePeriod: true,
        typeId: true,
        cityId: true,
        districtId: true,
        address: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        landArea: true,
        floor: true,
        totalFloors: true,
        renovation: true,
        documentStatus: true,
        buildingType: true,
        videoUrl: true,
        features: { select: { featureId: true } },
        images: { select: { url: true, alt: true, isCover: true }, orderBy: { order: "asc" } },
      },
    }),
    getPropertyFormOptions(),
    getTranslations("account.newProperty"),
  ]);
  if (!property) notFound();

  const options = {
    ...sourceOptions,
    types: sourceOptions.types.map((item) => localizeKnownContent("propertyType", item, locale)),
    cities: sourceOptions.cities.map((item) => localizeLocation(item, locale)),
    districts: sourceOptions.districts.map((item) => localizeLocation(item, locale)),
    metros: sourceOptions.metros.map((item) => localizeLocation(item, locale)),
    features: sourceOptions.features.map((item) => localizeKnownContent("feature", item, locale)),
  };
  const initial: PublicPropertyFormInitial = {
    ...property,
    featureIds: property.features.map((item) => item.featureId),
    images: property.images,
  };
  const action = updatePublicProperty.bind(null, id);

  return (
    <div className="min-w-0">
      <PageHeader
        contained
        compact
        eyebrow={t("editEyebrow")}
        title={t("editTitle")}
        description={t("editDescription")}
      />
      <div className="mt-8">
        <PublicPropertyForm
          action={action}
          options={options}
          initial={initial}
          submitLabel={t("saveChanges")}
        />
      </div>
    </div>
  );
}
