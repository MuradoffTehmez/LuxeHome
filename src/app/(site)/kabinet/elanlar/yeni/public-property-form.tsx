"use client";

import { useState } from "react";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import type { ActionState } from "@/lib/admin/action-state";
import {
  BUILDING_TYPE_LABELS,
  BUILDING_TYPES,
  CURRENCIES,
  CURRENCY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUSES,
  FEATURE_GROUP_LABELS,
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
  PRICE_PERIOD_LABELS,
  PRICE_PERIODS,
  RENOVATION_LABELS,
  RENOVATIONS,
  type FeatureGroup,
} from "@/lib/constants";
import type { PropertyFormOptions } from "@/lib/queries";

const optionsOf = <T extends Record<string, string>>(
  values: T,
  labels: Record<string, string>,
) => Object.values(values).map((value) => ({ value, label: labels[value] }));

/** İstifadəçi üçün məhdud elan forması; status və SEO yalnız paneldə idarə olunur. */
export function PublicPropertyForm({
  action,
  options,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  options: PropertyFormOptions;
}) {
  const [listingType, setListingType] = useState<string>(LISTING_TYPES.SALE);
  const [cityId, setCityId] = useState(options.cities[0]?.id ?? "");
  const districts = options.districts.filter((district) => district.parentId === cityId);
  const featureGroups = options.features.reduce<Record<string, typeof options.features>>(
    (groups, feature) => {
      (groups[feature.group] ??= []).push(feature);
      return groups;
    },
    {},
  );

  return (
    <AdminForm action={action} submitLabel="Elanı göndər" cancelHref="/kabinet/elanlar">
      <FormSection
        title="Elan məlumatları"
        description="Elan yoxlanıldıqdan sonra saytda görünəcək."
      >
        <FullWidth>
          <AdminInput
            name="title"
            label="Başlıq"
            required
            maxLength={160}
            hint="Məsələn: «Xətai rayonunda 3 otaqlı yeni tikili mənzil»"
          />
        </FullWidth>
        <FullWidth>
          <AdminTextarea
            name="description"
            label="Təsvir"
            required
            rows={8}
            maxLength={8000}
            hint="Əmlakın vəziyyəti, şəraiti və üstünlüklərini yazın."
          />
        </FullWidth>
      </FormSection>

      <FormSection title="Elan növü və qiymət">
        <AdminSelect
          name="listingType"
          label="Elan növü"
          required
          value={listingType}
          onChange={(event) => setListingType(event.target.value)}
          options={optionsOf(LISTING_TYPES, LISTING_TYPE_LABELS)}
        />
        <AdminSelect
          name="currency"
          label="Valyuta"
          required
          defaultValue={CURRENCIES.AZN}
          options={optionsOf(CURRENCIES, CURRENCY_LABELS)}
        />
        <AdminInput name="price" label="Qiymət" required type="number" min={0} step="0.01" />
        {listingType === LISTING_TYPES.RENT && (
          <AdminSelect
            name="pricePeriod"
            label="Qiymət dövrü"
            required
            defaultValue={PRICE_PERIODS.MONTH}
            options={optionsOf(PRICE_PERIODS, PRICE_PERIOD_LABELS)}
          />
        )}
      </FormSection>

      <FormSection title="Yerləşmə">
        <AdminSelect
          name="typeId"
          label="Əmlak növü"
          required
          placeholder="Seçin"
          options={options.types.map((type) => ({ value: type.id, label: type.name }))}
        />
        <AdminSelect
          name="cityId"
          label="Şəhər"
          required
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
          options={options.cities.map((city) => ({ value: city.id, label: city.name }))}
        />
        <AdminSelect
          name="districtId"
          label="Rayon / qəsəbə"
          placeholder="Seçilməyib"
          options={districts.map((district) => ({ value: district.id, label: district.name }))}
        />
        <FullWidth>
          <AdminInput
            name="address"
            label="Ünvan"
            maxLength={240}
            hint="Küçə və bina yazın; mənzil nömrəsini daxil etməyin."
          />
        </FullWidth>
      </FormSection>

      <FormSection title="Ölçülər">
        <AdminInput name="rooms" label="Otaq sayı" type="number" min={0} />
        <AdminInput name="bedrooms" label="Yataq otağı" type="number" min={0} />
        <AdminInput name="bathrooms" label="Sanitar qovşaq" type="number" min={0} />
        <AdminInput name="area" label="Sahə (m²)" type="number" min={0} step="0.01" />
        <AdminInput name="landArea" label="Torpaq sahəsi (sot)" type="number" min={0} step="0.01" />
        <AdminInput name="floor" label="Mərtəbə" type="number" min={0} />
        <AdminInput name="totalFloors" label="Binanın mərtəbəsi" type="number" min={0} />
      </FormSection>

      <FormSection title="Vəziyyət və şərtlər">
        <AdminSelect
          name="renovation"
          label="Təmir vəziyyəti"
          placeholder="Seçilməyib"
          options={optionsOf(RENOVATIONS, RENOVATION_LABELS)}
        />
        <AdminSelect
          name="documentStatus"
          label="Sənəd"
          placeholder="Seçilməyib"
          options={optionsOf(DOCUMENT_STATUSES, DOCUMENT_STATUS_LABELS)}
        />
        <AdminSelect
          name="buildingType"
          label="Tikili növü"
          placeholder="Seçilməyib"
          options={optionsOf(BUILDING_TYPES, BUILDING_TYPE_LABELS)}
        />
        <AdminInput name="videoUrl" label="Video ünvanı" type="url" hint="Yalnız https://" />
        <FullWidth>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <AdminCheckbox name="mortgageAvailable" label="İpoteka mümkündür" />
            <AdminCheckbox name="installmentAvailable" label="Taksit mümkündür" />
          </div>
        </FullWidth>
      </FormSection>

      {options.features.length > 0 && (
        <FormSection title="Xüsusiyyətlər" description="Uyğun alıcılara daha asan çatın.">
          <FullWidth>
            <div className="flex flex-col gap-4">
              {Object.entries(featureGroups).map(([group, features]) => (
                <fieldset key={group} className="flex flex-col gap-1">
                  <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {FEATURE_GROUP_LABELS[group as FeatureGroup] ?? group}
                  </legend>
                  <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                      <AdminCheckbox
                        key={feature.id}
                        name="featureIds"
                        value={feature.id}
                        label={feature.name}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </FullWidth>
        </FormSection>
      )}

      <FormSection title="Şəkillər" description="Birinci şəkil elanınızın üz qabığı olacaq.">
        <FullWidth>
          <ImageDropzone
            name="images"
            label="Qalereya"
            folder="emlaklar"
            uploadUrl="/api/hesab/media"
            hint="Şəkillər elan göndərilənədək hesabınıza bağlı saxlanılır."
          />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
