"use client";

import { ContentEditor } from "@/components/admin/content-editor";
import { AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { KNOWLEDGE_STATUS_LABELS, KNOWLEDGE_STATUSES } from "@/lib/constants";
import { saveKnowledgeTerm } from "./actions";
import type { KnowledgeTermFormValues } from "./form-values";

export function KnowledgeTermForm({ initial, categories }: { initial: KnowledgeTermFormValues; categories: { id: string; name: string }[] }) {
  return (
    <AdminForm key={initial.id ?? "new"} action={saveKnowledgeTerm} submitLabel={initial.id ? "Termini yenilə" : "Termin əlavə et"} cancelHref={initial.id ? "/admin/bilik-merkezi/lugat" : undefined}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormSection title={initial.id ? "Termini redaktə et" : "Yeni termin"}>
        <AdminInput name="term" label="Termin" required maxLength={120} defaultValue={initial.term} />
        <AdminInput name="slug" label="Slug" maxLength={90} defaultValue={initial.slug} hint="Boş buraxsanız termindən yaradılır." />
        <AdminSelect name="categoryId" label="Mövzu" defaultValue={initial.categoryId} placeholder="Mövzusuz" options={categories.map(({ id, name }) => ({ value: id, label: name }))} />
        <AdminSelect name="status" label="Status" required defaultValue={initial.status} options={Object.values(KNOWLEDGE_STATUSES).map((value) => ({ value, label: KNOWLEDGE_STATUS_LABELS[value] }))} />
        <AdminInput name="order" label="Sıra" type="number" min={0} max={9999} defaultValue={String(initial.order)} />
        <FullWidth><AdminTextarea name="shortDefinition" label="Qısa tərif" required rows={3} maxLength={400} defaultValue={initial.shortDefinition} /></FullWidth>
        <FullWidth><ContentEditor name="definition" label="Ətraflı izah" defaultValue={initial.definition} /></FullWidth>
        <FullWidth><AdminTextarea name="relatedSlugs" label="Əlaqəli termin slug-ları" rows={4} defaultValue={initial.relatedSlugs} hint="Hər sətirdə bir slug; maksimum 10." /></FullWidth>
      </FormSection>
    </AdminForm>
  );
}
