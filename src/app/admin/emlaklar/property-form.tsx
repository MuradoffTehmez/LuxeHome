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
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUSES,
  RENOVATION_LABELS,
  RENOVATIONS,
  type FeatureGroup,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { PropertyFormOptions } from "@/lib/queries";
import type { PropertyFormValues } from "./form-values";

/**
 * Əmlak elanının forması.
 *
 * Yaratma və redaktə eyni komponentdir: fərq yalnız `action` və `initial` propundadır.
 * İki ayrı forma saxlanılsaydı, yeni sahə əlavə edəndə birini yeniləməyi unutmaq
 * qaçılmaz olardı.
 */

const optionsOf = <T extends Record<string, string>>(
  values: T,
  labels: Record<string, string>,
) => Object.values(values).map((value) => ({ value, label: labels[value] }));

export function PropertyForm({
  action,
  options,
  initial,
  submitLabel,
  extraActions,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  options: PropertyFormOptions;
  initial: PropertyFormValues;
  submitLabel: string;
  extraActions?: React.ReactNode;
}) {
  const [listingType, setListingType] = useState(initial.listingType);
  const [cityId, setCityId] = useState(initial.cityId || options.cities[0]?.id || "");

  // Rayon siyahısı seçilmiş şəhərdən asılıdır — kaskad ictimai axtarışdakı ilə eynidir
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
      submitLabel={submitLabel}
      cancelHref="/admin/emlaklar"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection title="Əsas məlumat" description="Elanın saytda görünən başlığı və təsviri.">
        <FullWidth>
          <AdminInput
            name="title"
            label="Başlıq"
            required
            defaultValue={initial.title}
            maxLength={160}
            hint="Məsələn: «Xətai rayonunda 3 otaqlı yeni tikili mənzil»"
          />
        </FullWidth>

        <AdminInput
          name="slug"
          label="Slug"
          defaultValue={initial.slug}
          maxLength={90}
          hint="Boş buraxsanız başlıqdan avtomatik yaradılır."
        />

        <AdminSelect
          name="status"
          label="Status"
          required
          defaultValue={initial.status}
          options={optionsOf(PROPERTY_STATUSES, PROPERTY_STATUS_LABELS)}
        />

        <FullWidth>
          <AdminTextarea
            name="description"
            label="Təsvir"
            required
            rows={8}
            defaultValue={initial.description}
            hint="Elanın tam mətni. Ən azı 20 simvol."
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
          defaultValue={initial.currency}
          options={optionsOf(CURRENCIES, CURRENCY_LABELS)}
        />

        <AdminInput
          name="price"
          label="Qiymət"
          required
          type="number"
          min={0}
          step="0.01"
          defaultValue={initial.price}
        />

        {listingType === LISTING_TYPES.RENT && (
          <AdminSelect
            name="pricePeriod"
            label="Qiymət dövrü"
            required
            defaultValue={initial.pricePeriod || PRICE_PERIODS.MONTH}
            options={optionsOf(PRICE_PERIODS, PRICE_PERIOD_LABELS)}
          />
        )}
      </FormSection>

      <FormSection title="Yerləşmə">
        <AdminSelect
          name="typeId"
          label="Əmlak növü"
          required
          defaultValue={initial.typeId}
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
          defaultValue={initial.districtId}
          placeholder="Seçilməyib"
          options={districts.map((district) => ({ value: district.id, label: district.name }))}
        />

        <AdminSelect
          name="projectId"
          label="Layihə"
          defaultValue={initial.projectId}
          placeholder="Layihəyə aid deyil"
          options={options.projects.map((project) => ({ value: project.id, label: project.name }))}
        />

        <FullWidth>
          <AdminInput
            name="address"
            label="Ünvan"
            defaultValue={initial.address}
            maxLength={240}
            hint="Küçə və bina — dəqiq mənzil nömrəsi yazılmır."
          />
        </FullWidth>

        <AdminInput
          name="latitude"
          label="Enlik (latitude)"
          type="number"
          step="any"
          defaultValue={initial.latitude}
        />
        <AdminInput
          name="longitude"
          label="Uzunluq (longitude)"
          type="number"
          step="any"
          defaultValue={initial.longitude}
        />
      </FormSection>

      <FormSection title="Ölçülər">
        <AdminInput name="rooms" label="Otaq sayı" type="number" min={0} defaultValue={initial.rooms} />
        <AdminInput
          name="bedrooms"
          label="Yataq otağı"
          type="number"
          min={0}
          defaultValue={initial.bedrooms}
        />
        <AdminInput
          name="bathrooms"
          label="Sanitar qovşaq"
          type="number"
          min={0}
          defaultValue={initial.bathrooms}
        />
        <AdminInput
          name="area"
          label="Sahə (m²)"
          type="number"
          min={0}
          step="0.01"
          defaultValue={initial.area}
        />
        <AdminInput
          name="landArea"
          label="Torpaq sahəsi (sot)"
          type="number"
          min={0}
          step="0.01"
          defaultValue={initial.landArea}
          hint="1 sot = 100 m². Torpaq və həyət evi elanlarında doldurulur."
        />
        <AdminInput name="floor" label="Mərtəbə" type="number" min={0} defaultValue={initial.floor} />
        <AdminInput
          name="totalFloors"
          label="Binanın mərtəbəsi"
          type="number"
          min={0}
          defaultValue={initial.totalFloors}
        />
      </FormSection>

      <FormSection title="Vəziyyət və şərtlər">
        <AdminSelect
          name="renovation"
          label="Təmir vəziyyəti"
          defaultValue={initial.renovation}
          placeholder="Seçilməyib"
          options={optionsOf(RENOVATIONS, RENOVATION_LABELS)}
        />
        <AdminSelect
          name="documentStatus"
          label="Sənəd"
          defaultValue={initial.documentStatus}
          placeholder="Seçilməyib"
          options={optionsOf(DOCUMENT_STATUSES, DOCUMENT_STATUS_LABELS)}
        />
        <AdminSelect
          name="buildingType"
          label="Tikili növü"
          defaultValue={initial.buildingType}
          placeholder="Seçilməyib"
          options={optionsOf(BUILDING_TYPES, BUILDING_TYPE_LABELS)}
        />
        <AdminInput
          name="videoUrl"
          label="Video ünvanı"
          type="url"
          defaultValue={initial.videoUrl}
          hint="YouTube və ya Vimeo linki — yalnız https://"
        />

        <FullWidth>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <AdminCheckbox
              name="mortgageAvailable"
              label="İpoteka mümkündür"
              defaultChecked={initial.mortgageAvailable}
            />
            <AdminCheckbox
              name="installmentAvailable"
              label="Taksit mümkündür"
              defaultChecked={initial.installmentAvailable}
            />
            <AdminCheckbox
              name="isFeatured"
              label="Ana səhifədə tövsiyə et"
              defaultChecked={initial.isFeatured}
            />
          </div>
        </FullWidth>
      </FormSection>

      {options.features.length > 0 && (
        <FormSection title="Xüsusiyyətlər" description="Axtarış filtrində istifadə olunur.">
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
                        defaultChecked={initial.featureIds.includes(feature.id)}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </FullWidth>
        </FormSection>
      )}

      <FormSection title="Şəkillər" description="Birinci şəkil siyahılarda üz qabığı kimi görünür.">
        <FullWidth>
          <ImageDropzone
            name="images"
            label="Qalereya"
            folder="emlaklar"
            initial={initial.images}
            hint="Yüklənən şəkillər avtomatik WebP formatına çevrilir və ölçüsü kiçildilir."
          />
        </FullWidth>
      </FormSection>

      <FormSection title="SEO" description="Boş buraxılsa, başlıq və təsvirdən qurulur.">
        <AdminInput
          name="metaTitle"
          label="Meta başlıq"
          defaultValue={initial.metaTitle}
          maxLength={70}
        />
        <AdminInput
          name="metaDescription"
          label="Meta təsvir"
          defaultValue={initial.metaDescription}
          maxLength={180}
        />
        <AdminInput
          name="canonicalUrl"
          label="Canonical URL"
          defaultValue={initial.canonicalUrl}
          placeholder="Boş buraxılsa öz ünvanına işarə edir"
        />
        <FullWidth>
          <AdminCheckbox
            name="noIndex"
            label="Axtarış motorlarında gizlət (noindex)"
            defaultChecked={initial.noIndex}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title="Open Graph"
        description="Sosial şəbəkədə paylaşılanda görünən başlıq/təsvir/şəkil. Boş buraxılsa meta sahələr istifadə olunur."
      >
        <AdminInput name="ogTitle" label="OG başlıq" defaultValue={initial.ogTitle} maxLength={70} />
        <AdminInput
          name="ogDescription"
          label="OG təsvir"
          defaultValue={initial.ogDescription}
          maxLength={200}
        />
        <AdminInput
          name="ogImage"
          label="OG şəkil URL"
          defaultValue={initial.ogImage}
          placeholder="Boş buraxılsa qalereyanın üz qabığı istifadə olunur"
        />
      </FormSection>
    </AdminForm>
  );
}
