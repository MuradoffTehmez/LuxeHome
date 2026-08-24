"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { SeoFields } from "@/components/admin/seo-fields";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPES,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { ProjectFormValues } from "./form-values";

export function ProjectForm({
  action,
  initial,
  cities,
  submitLabel,
  extraActions,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial: ProjectFormValues;
  cities: { id: string; name: string }[];
  submitLabel: string;
  extraActions?: React.ReactNode;
}) {
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/layiheler"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection title="Əsas məlumat">
        <FullWidth>
          <AdminInput name="name" label="Ad" required defaultValue={initial.name} maxLength={160} />
        </FullWidth>

        <AdminInput
          name="slug"
          label="Slug"
          defaultValue={initial.slug}
          maxLength={90}
          hint="Boş buraxsanız addan yaradılır."
        />

        <AdminInput name="order" label="Sıra" type="number" min={0} defaultValue={initial.order} />

        <AdminSelect
          name="projectType"
          label="Layihə növü"
          required
          defaultValue={initial.projectType}
          options={Object.values(PROJECT_TYPES).map((value) => ({
            value,
            label: PROJECT_TYPE_LABELS[value],
          }))}
        />

        <AdminSelect
          name="status"
          label="Status"
          required
          defaultValue={initial.status}
          options={Object.values(PROJECT_STATUSES).map((value) => ({
            value,
            label: PROJECT_STATUS_LABELS[value],
          }))}
        />

        <FullWidth>
          <AdminTextarea
            name="summary"
            label="Qısa təsvir"
            rows={2}
            maxLength={300}
            defaultValue={initial.summary}
            hint="Kartlarda görünən bir-iki cümlə."
          />
        </FullWidth>

        <FullWidth>
          <AdminTextarea
            name="description"
            label="Təsvir"
            required
            rows={8}
            defaultValue={initial.description}
          />
        </FullWidth>

        <FullWidth>
          <AdminCheckbox name="isActive" label="Saytda göstərilsin" defaultChecked={initial.isActive} />
        </FullWidth>
      </FormSection>

      <FormSection title="Yerləşmə">
        <AdminSelect
          name="cityId"
          label="Şəhər"
          defaultValue={initial.cityId}
          placeholder="Seçilməyib"
          options={cities.map((city) => ({ value: city.id, label: city.name }))}
        />
        <AdminInput name="address" label="Ünvan" defaultValue={initial.address} maxLength={240} />
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

      <FormSection title="Tikinti göstəriciləri">
        <AdminInput
          name="startDate"
          label="Başlanğıc tarixi"
          type="date"
          defaultValue={initial.startDate}
        />
        <AdminInput
          name="deliveryDate"
          label="Təhvil tarixi"
          type="date"
          defaultValue={initial.deliveryDate}
        />
        <AdminInput
          name="year"
          label="İl"
          type="number"
          min={1990}
          max={2100}
          defaultValue={initial.year}
        />
        <AdminInput
          name="totalArea"
          label="Ümumi sahə (m²)"
          type="number"
          min={0}
          step="0.01"
          defaultValue={initial.totalArea}
        />
        <AdminInput
          name="floors"
          label="Mərtəbə sayı"
          type="number"
          min={0}
          defaultValue={initial.floors}
        />
        <AdminInput
          name="unitCount"
          label="Mənzil sayı"
          type="number"
          min={0}
          defaultValue={initial.unitCount}
        />
      </FormSection>

      <FormSection title="Üstünlüklər və mərhələlər">
        <FullWidth>
          <AdminTextarea
            name="highlights"
            label="Üstünlüklər"
            rows={5}
            defaultValue={initial.highlights}
            hint="Hər sətirdə bir maddə."
          />
        </FullWidth>
        <FullWidth>
          <AdminTextarea
            name="timeline"
            label="Tikinti mərhələləri"
            rows={5}
            defaultValue={initial.timeline}
            hint="Hər sətirdə bir mərhələ. Tamamlanmış mərhələni «[x] » ilə başlayın."
          />
        </FullWidth>
      </FormSection>

      <FormSection title="Şəkillər">
        <FullWidth>
          <ImageDropzone
            name="images"
            label="Qalereya"
            folder="layiheler"
            initial={initial.images}
            hint="Üz qabığı seçilmiş şəkil kartlarda görünür."
          />
        </FullWidth>
      </FormSection>

      <FormSection title="SEO">
        <SeoFields initialTitle={initial.metaTitle} initialDescription={initial.metaDescription} fallbackTitle={initial.name || "Yaşayış layihəsi"} fallbackDescription={initial.summary || initial.description || "Layihə haqqında məlumat"} pathname={`/layiheler/${initial.slug || "yeni-layihe"}`} />
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
          placeholder="Boş buraxılsa üz qabığı şəkli istifadə olunur"
        />
      </FormSection>
    </AdminForm>
  );
}
