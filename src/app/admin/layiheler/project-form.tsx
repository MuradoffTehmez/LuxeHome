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
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from "@/lib/constants";
import type { ActionState } from "@/lib/admin/action-state";
import type { ProjectFormValues } from "./form-values";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("admin");
  return (
    <AdminForm
      action={action}
      submitLabel={submitLabel}
      cancelHref="/admin/layiheler"
      extraActions={extraActions}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <FormSection title={t("pages.projects.esasMelumat")}>
        <FullWidth>
          <AdminInput name="name" label={t("pages.projects.ad")} required defaultValue={initial.name} maxLength={160} />
        </FullWidth>

        <AdminInput
          name="slug"
          label={t("pages.projects.slug")}
          defaultValue={initial.slug}
          maxLength={90}
          hint={t("pages.projects.bosBuraxsanizAddanYaradilir")}
        />

        <AdminInput name="order" label={t("pages.projects.sira")} type="number" min={0} defaultValue={initial.order} />

        <AdminSelect
          name="projectType"
          label={t("pages.projects.layiheNovu")}
          required
          defaultValue={initial.projectType}
          options={Object.values(PROJECT_TYPES).map((value) => ({
            value,
            label: t(`labels.projectType.${value}`),
          }))}
        />

        <AdminSelect
          name="status"
          label={t("pages.projects.status")}
          required
          defaultValue={initial.status}
          options={Object.values(PROJECT_STATUSES).map((value) => ({
            value,
            label: t(`labels.projectStatus.${value}`),
          }))}
        />

        <FullWidth>
          <AdminTextarea
            name="summary"
            label={t("pages.projects.qisaTesvir")}
            rows={2}
            maxLength={300}
            defaultValue={initial.summary}
            hint={t("pages.projects.kartlardaGorunenBirIki")}
          />
        </FullWidth>

        <FullWidth>
          <AdminTextarea
            name="description"
            label={t("pages.projects.tesvir")}
            required
            rows={8}
            defaultValue={initial.description}
          />
        </FullWidth>

        <FullWidth>
          <AdminCheckbox name="isActive" label={t("pages.projects.saytdaGosterilsin")} defaultChecked={initial.isActive} />
        </FullWidth>
      </FormSection>

      <FormSection title={t("pages.projects.yerlesme")}>
        <AdminSelect
          name="cityId"
          label={t("pages.projects.seher")}
          defaultValue={initial.cityId}
          placeholder={t("pages.projects.secilmeyib")}
          options={cities.map((city) => ({ value: city.id, label: city.name }))}
        />
        <AdminInput name="address" label={t("pages.projects.unvan")} defaultValue={initial.address} maxLength={240} />
        <AdminInput
          name="latitude"
          label={t("pages.projects.enlikLatitude")}
          type="number"
          step="any"
          defaultValue={initial.latitude}
        />
        <AdminInput
          name="longitude"
          label={t("pages.projects.uzunluqLongitude")}
          type="number"
          step="any"
          defaultValue={initial.longitude}
        />
      </FormSection>

      <FormSection title={t("pages.projects.tikintiGostericileri")}>
        <AdminInput
          name="startDate"
          label={t("pages.projects.baslangicTarixi")}
          type="date"
          defaultValue={initial.startDate}
        />
        <AdminInput
          name="deliveryDate"
          label={t("pages.projects.tehvilTarixi")}
          type="date"
          defaultValue={initial.deliveryDate}
        />
        <AdminInput
          name="year"
          label={t("pages.projects.il")}
          type="number"
          min={1990}
          max={2100}
          defaultValue={initial.year}
        />
        <AdminInput
          name="totalArea"
          label={t("pages.projects.umumiSaheM")}
          type="number"
          min={0}
          step="0.01"
          defaultValue={initial.totalArea}
        />
        <AdminInput
          name="floors"
          label={t("pages.projects.mertebeSayi")}
          type="number"
          min={0}
          defaultValue={initial.floors}
        />
        <AdminInput
          name="unitCount"
          label={t("pages.projects.menzilSayi")}
          type="number"
          min={0}
          defaultValue={initial.unitCount}
        />
      </FormSection>

      <FormSection title={t("pages.projects.ustunluklerVeMerheleler")}>
        <FullWidth>
          <AdminTextarea
            name="highlights"
            label={t("pages.projects.ustunlukler")}
            rows={5}
            defaultValue={initial.highlights}
            hint={t("pages.projects.herSetirdeBirMadde")}
          />
        </FullWidth>
        <FullWidth>
          <AdminTextarea
            name="timeline"
            label={t("pages.projects.tikintiMerheleleri")}
            rows={5}
            defaultValue={initial.timeline}
            hint={t("pages.projects.herSetirdeBirMerhele")}
          />
        </FullWidth>
      </FormSection>

      <FormSection title={t("pages.projects.sekiller")}>
        <FullWidth>
          <ImageDropzone
            name="images"
            label={t("pages.projects.qalereya")}
            folder="layiheler"
            initial={initial.images}
            hint={t("pages.projects.uzQabigiSecilmisSekil")}
          />
        </FullWidth>
      </FormSection>

      <FormSection title="SEO">
        <SeoFields initialTitle={initial.metaTitle} initialDescription={initial.metaDescription} fallbackTitle={initial.name || "Yaşayış layihəsi"} fallbackDescription={initial.summary || initial.description || "Layihə haqqında məlumat"} pathname={`/layiheler/${initial.slug || "yeni-layihe"}`} />
        <AdminInput
          name="canonicalUrl"
          label={t("pages.projects.canonicalUrl")}
          defaultValue={initial.canonicalUrl}
          placeholder={t("pages.projects.bosBuraxilsaOzUnvanina")}
        />
        <FullWidth>
          <AdminCheckbox
            name="noIndex"
            label={t("pages.projects.axtarisMotorlarindaGizletNoindex")}
            defaultChecked={initial.noIndex}
          />
        </FullWidth>
      </FormSection>

      <FormSection
        title={t("pages.projects.openGraph")}
        description={t("pages.projects.sosialSebekedePaylasilandaGorunen")}
      >
        <AdminInput name="ogTitle" label={t("pages.projects.ogBasliq")} defaultValue={initial.ogTitle} maxLength={70} />
        <AdminInput
          name="ogDescription"
          label={t("pages.projects.ogTesvir")}
          defaultValue={initial.ogDescription}
          maxLength={200}
        />
        <AdminInput
          name="ogImage"
          label={t("pages.projects.ogSekilUrl")}
          defaultValue={initial.ogImage}
          placeholder={t("pages.projects.bosBuraxilsaUzQabigi")}
        />
      </FormSection>
    </AdminForm>
  );
}
