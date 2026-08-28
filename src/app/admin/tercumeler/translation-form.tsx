"use client";

import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { TRANSLATION_STATUS_LABELS, TRANSLATION_STATUSES } from "@/lib/constants";
import { saveTranslation } from "./actions";

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
  return (
    <AdminForm action={saveTranslation} submitLabel="Tərcüməni saxla">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <FormSection title="Məzmun və dil" description="Azərbaycan dilindəki mənbə kontenti seçin; EN/RU versiyası ayrıca statusla idarə olunur.">
        <AdminSelect name="entity" label="Mənbə məzmun" options={entities} placeholder="Məzmun seçin" defaultValue={initial ? `${initial.entityType}:${initial.entityId}` : ""} required />
        <AdminSelect name="locale" label="Tərcümə dili" options={[{ value: "en", label: "English" }, { value: "ru", label: "Русский" }]} defaultValue={initial?.locale ?? "en"} required />
        <AdminSelect name="status" label="İş axını statusu" options={Object.values(TRANSLATION_STATUSES).map((value) => ({ value, label: TRANSLATION_STATUS_LABELS[value] }))} defaultValue={initial?.status ?? TRANSLATION_STATUSES.DRAFT} required />
      </FormSection>
      <FormSection title="Tərcümə" description="Boş saxlanılan sahələr saytda Azərbaycan dilindəki mənbə dəyərinə geri düşür.">
        <FullWidth><AdminInput name="title" label="Başlıq" defaultValue={initial?.title ?? ""} required maxLength={240} /></FullWidth>
        <FullWidth><AdminTextarea name="summary" label="Qısa təsvir / xülasə" defaultValue={initial?.summary ?? ""} rows={4} maxLength={1000} /></FullWidth>
        <FullWidth><AdminTextarea name="content" label="Əsas məzmun" defaultValue={initial?.content ?? ""} rows={12} /></FullWidth>
      </FormSection>
      <FormSection title="SEO" description="Dərc olunan dil versiyasının axtarış nəticəsi üçün ayrıca metadata.">
        <AdminInput name="metaTitle" label="Meta başlıq" defaultValue={initial?.metaTitle ?? ""} maxLength={70} />
        <AdminTextarea name="metaDescription" label="Meta təsvir" defaultValue={initial?.metaDescription ?? ""} rows={3} maxLength={170} />
      </FormSection>
    </AdminForm>
  );
}
