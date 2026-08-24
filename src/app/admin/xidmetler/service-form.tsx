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
import { SERVICE_ICON_NAMES } from "@/components/site/service-icon";
import type { ActionState } from "@/lib/admin/action-state";
import type { ServiceFormValues } from "./form-values";

export function ServiceForm({
  action,
  initial,
  submitLabel,
  extraActions,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial: ServiceFormValues;
  submitLabel: string;
  extraActions?: React.ReactNode;
}) {
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/xidmetler"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection title="Xidmət">
        <FullWidth>
          <AdminInput
            name="title"
            label="Başlıq"
            required
            defaultValue={initial.title}
            maxLength={160}
          />
        </FullWidth>

        <AdminInput
          name="slug"
          label="Slug"
          defaultValue={initial.slug}
          maxLength={90}
          hint="Boş buraxsanız başlıqdan yaradılır."
        />

        <AdminInput name="order" label="Sıra" type="number" min={0} defaultValue={initial.order} />

        <AdminSelect
          name="icon"
          label="İkon"
          required
          defaultValue={initial.icon}
          options={SERVICE_ICON_NAMES.map((name) => ({ value: name, label: name }))}
          hint="Sayt üçün icazə verilən ikon dəsti."
        />

        <AdminCheckbox
          name="isActive"
          label="Saytda göstərilsin"
          defaultChecked={initial.isActive}
          className="sm:mt-8"
        />

        <FullWidth>
          <AdminTextarea
            name="shortDescription"
            label="Qısa təsvir"
            required
            rows={2}
            maxLength={300}
            defaultValue={initial.shortDescription}
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
          <AdminTextarea
            name="bullets"
            label="Maddələr"
            rows={5}
            defaultValue={initial.bullets}
            hint="Hər sətirdə bir maddə."
          />
        </FullWidth>
      </FormSection>

      <FormSection title="Şəkil">
        <FullWidth>
          <ImageDropzone
            name="image"
            label="Xidmət şəkli"
            folder="xidmetler"
            mode="single"
            initial={initial.image}
          />
        </FullWidth>
      </FormSection>

      <FormSection title="SEO">
        <SeoFields initialTitle={initial.metaTitle} initialDescription={initial.metaDescription} fallbackTitle={initial.title || "Daşınmaz əmlak xidməti"} fallbackDescription={initial.shortDescription || initial.description || "Xidmət haqqında məlumat"} pathname={`/xidmetler/${initial.slug || "yeni-xidmet"}`} />
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
          placeholder="Boş buraxılsa xidmət şəkli istifadə olunur"
        />
      </FormSection>
    </AdminForm>
  );
}
