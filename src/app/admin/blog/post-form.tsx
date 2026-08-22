"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ContentEditor } from "@/components/admin/content-editor";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { POST_STATUS_LABELS, POST_STATUSES } from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { PostFormValues } from "./form-values";

export function PostForm({
  action,
  initial,
  categories,
  submitLabel,
  extraActions,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial: PostFormValues;
  categories: { id: string; name: string }[];
  submitLabel: string;
  extraActions?: React.ReactNode;
}) {
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/blog"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection title="Məqalə">
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
          hint="Boş buraxsanız başlıqdan avtomatik yaradılır."
        />

        <AdminSelect
          name="status"
          label="Status"
          required
          defaultValue={initial.status}
          options={Object.values(POST_STATUSES).map((value) => ({
            value,
            label: POST_STATUS_LABELS[value],
          }))}
        />

        <AdminSelect
          name="categoryId"
          label="Kateqoriya"
          defaultValue={initial.categoryId}
          placeholder="Kateqoriyasız"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
        />

        <FullWidth>
          <AdminTextarea
            name="excerpt"
            label="Qısa təsvir"
            required
            rows={3}
            maxLength={300}
            defaultValue={initial.excerpt}
            hint="Siyahılarda və paylaşım kartlarında görünür."
          />
        </FullWidth>

        <FullWidth>
          <ContentEditor name="content" label="Mətn" defaultValue={initial.content} />
        </FullWidth>
      </FormSection>

      <FormSection title="Üz qabığı">
        <FullWidth>
          <ImageDropzone
            name="cover"
            label="Üz qabığı şəkli"
            folder="bloq"
            mode="single"
            initial={initial.cover}
            hint="Şəkil avtomatik WebP formatına çevrilir. Alt mətni doldurun — SEO və ekran oxuyucular üçün vacibdir."
          />
        </FullWidth>
      </FormSection>

      <FormSection title="SEO" description="Boş buraxılsa, başlıq və qısa təsvirdən qurulur.">
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
