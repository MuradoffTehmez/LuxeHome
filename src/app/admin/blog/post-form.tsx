"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import {
  AdminCheckbox,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  FullWidth,
} from "@/components/admin/form-fields";
import { ContentEditor } from "@/components/admin/content-editor";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import { SeoFields } from "@/components/admin/seo-fields";
import { POST_STATUSES } from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { PostFormValues } from "./form-values";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("admin");
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/blog"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection title={t("pages.blog.meqale")}>
        <FullWidth>
          <AdminInput
            name="title"
            label={t("pages.blog.basliq")}
            required
            defaultValue={initial.title}
            maxLength={160}
          />
        </FullWidth>

        <AdminInput
          name="slug"
          label={t("pages.blog.slug")}
          defaultValue={initial.slug}
          maxLength={90}
          hint={t("pages.blog.bosBuraxsanizBasliqdanAvtomatik")}
        />

        <AdminSelect
          name="status"
          label={t("pages.blog.status")}
          required
          defaultValue={initial.status}
          options={Object.values(POST_STATUSES).map((value) => ({
            value,
            label: t(`labels.postStatus.${value}`),
          }))}
        />

        <AdminSelect
          name="categoryId"
          label={t("pages.blog.kateqoriya")}
          defaultValue={initial.categoryId}
          placeholder={t("pages.blog.kateqoriyasiz")}
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
        />

        <FullWidth>
          <AdminTextarea
            name="excerpt"
            label={t("pages.blog.qisaTesvir")}
            required
            rows={3}
            maxLength={300}
            defaultValue={initial.excerpt}
            hint={t("pages.blog.siyahilardaVePaylasimKartlarinda")}
          />
        </FullWidth>

        <FullWidth>
          <ContentEditor name="content" label={t("pages.blog.metn")} defaultValue={initial.content} />
        </FullWidth>
      </FormSection>

      <FormSection title={t("pages.blog.uzQabigi")}>
        <FullWidth>
          <ImageDropzone
            name="cover"
            label={t("pages.blog.uzQabigiSekli")}
            folder="bloq"
            mode="single"
            initial={initial.cover}
            hint={t("pages.blog.sekilAvtomatikWebpFormatina")}
          />
        </FullWidth>
      </FormSection>

      <FormSection title="SEO" description={t("pages.blog.bosBuraxilsaBasliqVe")}>
        <SeoFields initialTitle={initial.metaTitle} initialDescription={initial.metaDescription} fallbackTitle={initial.title || t("pages.misc.bloqYazisi")} fallbackDescription={initial.excerpt || t("pages.misc.meqaleninQisaTesviri")} pathname={`/blog/${initial.slug || "yeni-yazi"}`} />
        <AdminInput
          name="canonicalUrl"
          label={t("pages.blog.canonicalUrl")}
          defaultValue={initial.canonicalUrl}
          placeholder={t("pages.blog.bosBuraxilsaOzUnvanina")}
        />
        <FullWidth>
          <AdminCheckbox
            name="noIndex"
            label={t("pages.blog.axtarisMotorlarindaGizletNoindex")}
            defaultChecked={initial.noIndex}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title={t("pages.blog.openGraph")}
        description={t("pages.blog.sosialSebekedePaylasilandaGorunen")}
      >
        <AdminInput name="ogTitle" label={t("pages.blog.ogBasliq")} defaultValue={initial.ogTitle} maxLength={70} />
        <AdminInput
          name="ogDescription"
          label={t("pages.blog.ogTesvir")}
          defaultValue={initial.ogDescription}
          maxLength={200}
        />
        <AdminInput
          name="ogImage"
          label={t("pages.blog.ogSekilUrl")}
          defaultValue={initial.ogImage}
          placeholder={t("pages.blog.bosBuraxilsaUzQabigi")}
        />
      </FormSection>
    </AdminForm>
  );
}
