"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin");
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/xidmetler"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection title={t("pages.services.xidmet")}>
        <FullWidth>
          <AdminInput
            name="title"
            label={t("pages.services.basliq")}
            required
            defaultValue={initial.title}
            maxLength={160}
          />
        </FullWidth>

        <AdminInput
          name="slug"
          label={t("pages.services.slug")}
          defaultValue={initial.slug}
          maxLength={90}
          hint={t("pages.services.bosBuraxsanizBasliqdanYaradilir")}
        />

        <AdminInput name="order" label={t("pages.services.sira")} type="number" min={0} defaultValue={initial.order} />

        <AdminSelect
          name="icon"
          label={t("pages.services.ikon")}
          required
          defaultValue={initial.icon}
          options={SERVICE_ICON_NAMES.map((name) => ({ value: name, label: name }))}
          hint={t("pages.services.saytUcunIcazeVerilen")}
        />

        <AdminCheckbox
          name="isActive"
          label={t("pages.services.saytdaGosterilsin")}
          defaultChecked={initial.isActive}
          className="sm:mt-8"
        />

        <FullWidth>
          <AdminTextarea
            name="shortDescription"
            label={t("pages.services.qisaTesvir")}
            required
            rows={2}
            maxLength={300}
            defaultValue={initial.shortDescription}
          />
        </FullWidth>

        <FullWidth>
          <AdminTextarea
            name="description"
            label={t("pages.services.tesvir")}
            required
            rows={8}
            defaultValue={initial.description}
          />
        </FullWidth>

        <FullWidth>
          <AdminTextarea
            name="bullets"
            label={t("pages.services.maddeler")}
            rows={5}
            defaultValue={initial.bullets}
            hint={t("pages.services.herSetirdeBirMadde")}
          />
        </FullWidth>
      </FormSection>

      <FormSection title={t("pages.services.sekil")}>
        <FullWidth>
          <ImageDropzone
            name="image"
            label={t("pages.services.xidmetSekli")}
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
          label={t("pages.services.canonicalUrl")}
          defaultValue={initial.canonicalUrl}
          placeholder={t("pages.services.bosBuraxilsaOzUnvanina")}
        />
        <FullWidth>
          <AdminCheckbox
            name="noIndex"
            label={t("pages.services.axtarisMotorlarindaGizletNoindex")}
            defaultChecked={initial.noIndex}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title={t("pages.services.openGraph")}
        description={t("pages.services.sosialSebekedePaylasilandaGorunen")}
      >
        <AdminInput name="ogTitle" label={t("pages.services.ogBasliq")} defaultValue={initial.ogTitle} maxLength={70} />
        <AdminInput
          name="ogDescription"
          label={t("pages.services.ogTesvir")}
          defaultValue={initial.ogDescription}
          maxLength={200}
        />
        <AdminInput
          name="ogImage"
          label={t("pages.services.ogSekilUrl")}
          defaultValue={initial.ogImage}
          placeholder={t("pages.services.bosBuraxilsaXidmetSekli")}
        />
      </FormSection>
    </AdminForm>
  );
}
