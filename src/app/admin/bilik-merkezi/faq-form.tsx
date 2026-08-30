"use client";

import { ContentEditor } from "@/components/admin/content-editor";
import { AdminInput, AdminSelect, FullWidth } from "@/components/admin/form-fields";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { FAQ_CATEGORIES, FAQ_CATEGORY_LABELS, KNOWLEDGE_STATUS_LABELS, KNOWLEDGE_STATUSES } from "@/lib/constants";
import { saveFaqEntry } from "./actions";
import type { FaqFormValues } from "./form-values";

export function FaqForm({ initial }: { initial: FaqFormValues }) {
  return (
    <AdminForm key={initial.id ?? "new"} action={saveFaqEntry} submitLabel={initial.id ? "Sualı yenilə" : "Sual əlavə et"} cancelHref={initial.id ? "/admin/bilik-merkezi/suallar" : undefined}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormSection title={initial.id ? "Sualı redaktə et" : "Yeni sual"}>
        <FullWidth><AdminInput name="question" label="Sual" required maxLength={300} defaultValue={initial.question} /></FullWidth>
        <AdminSelect name="category" label="Kateqoriya" required defaultValue={initial.category} options={Object.values(FAQ_CATEGORIES).map((value) => ({ value, label: FAQ_CATEGORY_LABELS[value] }))} />
        <AdminSelect name="status" label="Status" required defaultValue={initial.status} options={Object.values(KNOWLEDGE_STATUSES).map((value) => ({ value, label: KNOWLEDGE_STATUS_LABELS[value] }))} />
        <AdminInput name="order" label="Sıra" type="number" min={0} max={9999} defaultValue={String(initial.order)} />
        <FullWidth><ContentEditor name="answer" label="Cavab" defaultValue={initial.answer} /></FullWidth>
      </FormSection>
    </AdminForm>
  );
}
