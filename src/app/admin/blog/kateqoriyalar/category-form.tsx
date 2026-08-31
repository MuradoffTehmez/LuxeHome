"use client";

import { useTranslations } from "next-intl";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { saveBlogCategory } from "../actions";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  order: number;
};

export function CategoryForm({ initial }: { initial: CategoryFormValues }) {
  const t = useTranslations("admin");
  return (
    <AdminForm
      // `key` olmadan React eyni formanı təkrar istifadə edir və redaktəyə keçəndə
      // sahələr köhnə dəyərlərlə qalır
      key={initial.id ?? "new"}
      action={saveBlogCategory}
      submitLabel={initial.id ? "Yenilə" : "Kateqoriya yarat"}
      cancelHref={initial.id ? "/admin/blog/kateqoriyalar" : undefined}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection title={initial.id ? "Kateqoriyanı redaktə et" : "Yeni kateqoriya"}>
        <AdminInput name="name" label={t("pages.blog.ad")} required defaultValue={initial.name} maxLength={80} />
        <AdminInput
          name="slug"
          label={t("pages.blog.slug")}
          defaultValue={initial.slug}
          maxLength={90}
          hint={t("pages.blog.bosBuraxsanizAddanYaradilir")}
        />
        <AdminInput
          name="order"
          label={t("pages.blog.sira")}
          type="number"
          min={0}
          defaultValue={String(initial.order)}
        />
        <FullWidth>
          <AdminTextarea
            name="description"
            label={t("pages.blog.tesvir")}
            rows={3}
            maxLength={300}
            defaultValue={initial.description}
          />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
