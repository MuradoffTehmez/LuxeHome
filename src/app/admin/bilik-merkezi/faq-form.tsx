"use client";

import { ContentEditor } from "@/components/admin/content-editor";
import { AdminInput, AdminSelect, FullWidth } from "@/components/admin/form-fields";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { FAQ_CATEGORIES, KNOWLEDGE_STATUSES } from "@/lib/constants";
import { saveFaqEntry } from "./actions";
import type { FaqFormValues } from "./form-values";
import { useTranslations } from "next-intl";

export function FaqForm({ initial }: { initial: FaqFormValues }) {
  const t = useTranslations("admin");
  return (
    <AdminForm key={initial.id ?? "new"} action={saveFaqEntry} submitLabel={initial.id ? "Sualı yenilə" : "Sual əlavə et"} cancelHref={initial.id ? "/admin/bilik-merkezi/suallar" : undefined}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormSection title={initial.id ? "Sualı redaktə et" : "Yeni sual"}>
        <FullWidth><AdminInput name="question" label={t("pages.knowledge.sual")} required maxLength={300} defaultValue={initial.question} /></FullWidth>
        <AdminSelect name="category" label={t("pages.knowledge.kateqoriya")} required defaultValue={initial.category} options={Object.values(FAQ_CATEGORIES).map((value) => ({ value, label: t(`labels.faqCategory.${value}`) }))} />
        <AdminSelect name="status" label={t("pages.knowledge.status")} required defaultValue={initial.status} options={Object.values(KNOWLEDGE_STATUSES).map((value) => ({ value, label: t(`labels.knowledgeStatus.${value}`) }))} />
        <AdminInput name="order" label={t("pages.knowledge.sira")} type="number" min={0} max={9999} defaultValue={String(initial.order)} />
        <FullWidth><ContentEditor name="answer" label={t("pages.knowledge.cavab")} defaultValue={initial.answer} /></FullWidth>
      </FormSection>
    </AdminForm>
  );
}
