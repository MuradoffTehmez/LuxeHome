"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ImageDropzone, type DropzoneImage } from "@/components/admin/image-dropzone";
import type { ActionState } from "@/lib/admin/action-state";
import {
  BUILDING_TYPES,
  CURRENCIES,
  CURRENCY_LABELS,
  DOCUMENT_STATUSES,
  LISTING_TYPES,
  MAX_PROPERTY_IMAGES,
  PRICE_PERIODS,
  RENOVATIONS,
  type Locale,
} from "@/lib/constants";
import type { PropertyFormOptions } from "@/lib/queries";
import { localizePath } from "@/i18n/path-locale";

const optionsOf = <T extends Record<string, string>>(
  values: T,
  labels: Record<string, string>,
) => Object.values(values).map((value) => ({ value, label: labels[value] }));

export type PublicPropertyFormInitial = {
  title: string;
  description: string;
  listingType: string;
  currency: string;
  price: number;
  pricePeriod: string | null;
  typeId: string;
  cityId: string;
  districtId: string | null;
  address: string | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  landArea: number | null;
  floor: number | null;
  totalFloors: number | null;
  renovation: string | null;
  documentStatus: string | null;
  buildingType: string | null;
  videoUrl: string | null;
  featureIds: string[];
  images: DropzoneImage[];
};

/** İstifadəçi üçün məhdud elan forması; status və SEO yalnız paneldə idarə olunur. */
export function PublicPropertyForm({
  action,
  options,
  initial,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  options: PropertyFormOptions;
  initial?: PublicPropertyFormInitial;
  submitLabel?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("account.newProperty");
  const searchT = useTranslations("listings.search");
  const propertyT = useTranslations("property");
  const [listingType, setListingType] = useState<string>(initial?.listingType ?? LISTING_TYPES.SALE);
  const [cityId, setCityId] = useState(initial?.cityId ?? options.cities[0]?.id ?? "");
  const districts = options.districts.filter((district) => district.parentId === cityId);
  const featureGroups = options.features.reduce<Record<string, typeof options.features>>(
    (groups, feature) => {
      (groups[feature.group] ??= []).push(feature);
      return groups;
    },
    {},
  );

  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel ?? t("submit")}
      cancelHref={localizePath("/kabinet/elanlar", locale)}
    >
      <FormSection
        asFieldset
        title={t("main")}
        description={t("mainDescription")}
      >
        <FullWidth>
          <AdminInput
            name="title"
            label={t("titleField")}
            required
            maxLength={160}
            hint={t("titleHint")}
            defaultValue={initial?.title}
          />
        </FullWidth>
        <FullWidth>
          <AdminTextarea
            name="description"
            label={t("descriptionField")}
            required
            rows={8}
            maxLength={8000}
            hint={t("descriptionHint")}
            defaultValue={initial?.description}
          />
        </FullWidth>
      </FormSection>

      <FormSection asFieldset title={t("priceSection")}>
        <AdminSelect
          name="listingType"
          label={t("listingType")}
          required
          value={listingType}
          onChange={(event) => setListingType(event.target.value)}
          options={[{ value: LISTING_TYPES.SALE, label: searchT("sale") }, { value: LISTING_TYPES.RENT, label: searchT("rent") }]}
        />
        <AdminSelect
          name="currency"
          label={t("currency")}
          required
          defaultValue={initial?.currency ?? CURRENCIES.AZN}
          options={optionsOf(CURRENCIES, CURRENCY_LABELS)}
        />
        <AdminInput name="price" label={t("price")} required type="number" min={0} step="0.01" defaultValue={initial?.price} />
        {listingType === LISTING_TYPES.RENT && (
          <AdminSelect
            name="pricePeriod"
            label={t("pricePeriod")}
            required
            defaultValue={initial?.pricePeriod ?? PRICE_PERIODS.MONTH}
            options={[{ value: PRICE_PERIODS.MONTH, label: searchT("monthly") }, { value: PRICE_PERIODS.DAY, label: searchT("daily") }]}
          />
        )}
      </FormSection>

      <FormSection asFieldset title={t("addressSection")}>
        <AdminSelect
          name="typeId"
          label={t("propertyType")}
          required
          placeholder={t("select")}
          defaultValue={initial?.typeId}
          options={options.types.map((type) => ({ value: type.id, label: type.name }))}
        />
        <AdminSelect
          name="cityId"
          label={t("city")}
          required
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
          options={options.cities.map((city) => ({ value: city.id, label: city.name }))}
        />
        <AdminSelect
          name="districtId"
          label={t("district")}
          placeholder={t("notSelected")}
          defaultValue={initial?.districtId ?? ""}
          options={districts.map((district) => ({ value: district.id, label: district.name }))}
        />
        <FullWidth>
          <AdminInput
            name="address"
            label={t("address")}
            maxLength={240}
            hint={t("addressHint")}
            defaultValue={initial?.address ?? ""}
          />
        </FullWidth>
      </FormSection>

      <FormSection asFieldset title={t("planning")}>
        <AdminInput name="rooms" label={t("rooms")} type="number" min={0} defaultValue={initial?.rooms ?? ""} />
        <AdminInput name="bedrooms" label={t("bedrooms")} type="number" min={0} defaultValue={initial?.bedrooms ?? ""} />
        <AdminInput name="bathrooms" label={t("bathrooms")} type="number" min={0} defaultValue={initial?.bathrooms ?? ""} />
        <AdminInput name="area" label={t("area")} type="number" min={0} step="0.01" defaultValue={initial?.area ?? ""} />
        <AdminInput name="landArea" label={t("landArea")} type="number" min={0} step="0.01" defaultValue={initial?.landArea ?? ""} />
        <AdminInput name="floor" label={t("floor")} type="number" min={0} defaultValue={initial?.floor ?? ""} />
        <AdminInput name="totalFloors" label={t("totalFloors")} type="number" min={0} defaultValue={initial?.totalFloors ?? ""} />
      </FormSection>

      <FormSection asFieldset title={t("condition")}>
        <AdminSelect
          name="renovation"
          label={t("renovation")}
          placeholder={t("notSelected")}
          defaultValue={initial?.renovation ?? ""}
          options={Object.values(RENOVATIONS).map((value) => ({ value, label: propertyT(`renovation.${value === "COSMETIC" ? "cosmetic" : value === "RENOVATED" ? "renovated" : value === "DESIGNER" ? "designer" : value === "UNRENOVATED" ? "unrenovated" : "newBuilding"}`) }))}
        />
        <AdminSelect
          name="documentStatus"
          label={t("document")}
          placeholder={t("notSelected")}
          defaultValue={initial?.documentStatus ?? ""}
          options={Object.values(DOCUMENT_STATUSES).map((value) => ({ value, label: propertyT(`document.${value === "TITLE_DEED" ? "titleDeed" : value === "CONTRACT" ? "contract" : value === "MUNICIPAL" ? "municipal" : value === "DECREE" ? "decree" : value === "POWER_OF_ATTORNEY" ? "powerOfAttorney" : value === "EXTRACT_COMMERCIAL" ? "commercialExtract" : "none"}`) }))}
        />
        <AdminSelect
          name="buildingType"
          label={t("building")}
          placeholder={t("notSelected")}
          defaultValue={initial?.buildingType ?? ""}
          options={Object.values(BUILDING_TYPES).map((value) => ({ value, label: propertyT(`building.${value === "NEW" ? "new" : "old"}`) }))}
        />
        <AdminInput name="videoUrl" label={t("video")} type="url" hint={t("videoHint")} defaultValue={initial?.videoUrl ?? ""} />
        {/* İpoteka / taksit «Ödəniş şərtləri» xüsusiyyət qrupundan seçilir. */}
      </FormSection>

      {options.features.length > 0 && (
        <FormSection asFieldset title={t("features")} description={t("featuresDescription")}>
          <FullWidth>
            <div className="flex flex-col gap-4">
              {Object.entries(featureGroups).map(([group, features]) => (
                <fieldset key={group} className="flex flex-col gap-1">
                  <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {propertyT(`featureGroup.${group === "UTILITY" ? "utility" : group === "INDOOR" ? "indoor" : group === "OUTDOOR" ? "outdoor" : group === "SECURITY" ? "security" : group === "PAYMENT" ? "payment" : "general"}`)}
                  </legend>
                  <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                      <AdminCheckbox
                        key={feature.id}
                        name="featureIds"
                        value={feature.id}
                        label={feature.name}
                        defaultChecked={initial?.featureIds.includes(feature.id)}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </FullWidth>
        </FormSection>
      )}

      <FormSection asFieldset title={t("images")} description={t("imagesDescription")}>
        <FullWidth>
          <ImageDropzone
            name="images"
            label={t("gallery")}
            folder="emlaklar"
            uploadUrl="/api/hesab/media"
            maxFiles={MAX_PROPERTY_IMAGES}
            initial={initial?.images}
            hint={t("imageHint", { count: MAX_PROPERTY_IMAGES })}
          />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
