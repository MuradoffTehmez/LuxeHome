"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ImageDropzone, type DropzoneImage } from "@/components/admin/image-dropzone";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPES,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";

export type ProjectFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  summary: string;
  projectType: string;
  status: string;
  cityId: string;
  address: string;
  latitude: string;
  longitude: string;
  startDate: string;
  deliveryDate: string;
  year: string;
  totalArea: string;
  floors: string;
  unitCount: string;
  highlights: string;
  timeline: string;
  isActive: boolean;
  order: string;
  metaTitle: string;
  metaDescription: string;
  images: DropzoneImage[];
};

export const EMPTY_PROJECT: ProjectFormValues = {
  name: "",
  slug: "",
  description: "",
  summary: "",
  projectType: PROJECT_TYPES.RESIDENTIAL,
  status: PROJECT_STATUSES.ONGOING,
  cityId: "",
  address: "",
  latitude: "",
  longitude: "",
  startDate: "",
  deliveryDate: "",
  year: "",
  totalArea: "",
  floors: "",
  unitCount: "",
  highlights: "",
  timeline: "",
  isActive: true,
  order: "0",
  metaTitle: "",
  metaDescription: "",
  images: [],
};

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
      </FormSection>
    </AdminForm>
  );
}
