"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { TRANSLATION_STATUSES } from "@/lib/constants";
import { saveTranslation } from "./actions";
import { useTranslations } from "next-intl";

type Initial = {
  id: string;
  entityType: string;
  entityId: string;
  locale: string;
  status: string;
  title: string | null;
  summary: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
} | null;

export function TranslationForm({
  entities,
  initial,
}: {
  entities: { value: string; label: string }[];
  initial: Initial;
}) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={saveTranslation} submitLabel={t("pages.translations.tercumeniSaxla")}>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <FormSection title={t("pages.translations.mezmunVeDil")} description={t("pages.translations.azerbaycanDilindekiMenbeKontenti")}>
        <AdminSelect name="entity" label={t("pages.translations.menbeMezmun")} options={entities} placeholder={t("pages.translations.mezmunSecin")} defaultValue={initial ? `${initial.entityType}:${initial.entityId}` : ""} required />
        <AdminSelect name="locale" label={t("pages.translations.tercumeDili")} options={[{ value: "en", label: t("pages.translations.english") }, { value: "ru", label: t("pages.translations.item") }]} defaultValue={initial?.locale ?? "en"} required />
        <AdminSelect name="status" label={t("pages.translations.isAxiniStatusu")} options={Object.values(TRANSLATION_STATUSES).map((value) => ({ value, label: t(`labels.translationStatus.${value}`) }))} defaultValue={initial?.status ?? TRANSLATION_STATUSES.DRAFT} required />
      </FormSection>
      <FormSection title={t("pages.translations.tercume")} description={t("pages.translations.bosSaxlanilanSahelerSaytda")}>
        <FullWidth><AdminInput name="title" label={t("pages.translations.basliq")} defaultValue={initial?.title ?? ""} required maxLength={240} /></FullWidth>
        <FullWidth><AdminTextarea name="summary" label={t("pages.translations.qisaTesvirXulase")} defaultValue={initial?.summary ?? ""} rows={4} maxLength={1000} /></FullWidth>
        <FullWidth><AdminTextarea name="content" label={t("pages.translations.esasMezmun")} defaultValue={initial?.content ?? ""} rows={12} /></FullWidth>
      </FormSection>
      <FormSection title="SEO" description={t("pages.translations.dercOlunanDilVersiyasinin")}>
        <AdminInput name="metaTitle" label={t("pages.translations.metaBasliq")} defaultValue={initial?.metaTitle ?? ""} maxLength={70} />
        <AdminTextarea name="metaDescription" label={t("pages.translations.metaTesvir")} defaultValue={initial?.metaDescription ?? ""} rows={3} maxLength={170} />
      </FormSection>
    </AdminForm>
  );
}
