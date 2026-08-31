"use client";

import { ContentEditor } from "@/components/admin/content-editor";
import { AdminInput, AdminSelect, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { KNOWLEDGE_STATUSES } from "@/lib/constants";
import { saveKnowledgeTerm } from "./actions";
import type { KnowledgeTermFormValues } from "./form-values";
import { useTranslations } from "next-intl";

export function KnowledgeTermForm({ initial, categories }: { initial: KnowledgeTermFormValues; categories: { id: string; name: string }[] }) {
  const t = useTranslations("admin");
  return (
    <AdminForm key={initial.id ?? "new"} action={saveKnowledgeTerm} submitLabel={initial.id ? "Termini yenilə" : "Termin əlavə et"} cancelHref={initial.id ? "/admin/bilik-merkezi/lugat" : undefined}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormSection title={initial.id ? "Termini redaktə et" : "Yeni termin"}>
        <AdminInput name="term" label={t("pages.knowledge.termin")} required maxLength={120} defaultValue={initial.term} />
        <AdminInput name="slug" label={t("pages.knowledge.slug")} maxLength={90} defaultValue={initial.slug} hint={t("pages.knowledge.bosBuraxsanizTermindenYaradilir")} />
        <AdminSelect name="categoryId" label={t("pages.knowledge.movzu")} defaultValue={initial.categoryId} placeholder={t("pages.knowledge.movzusuz")} options={categories.map(({ id, name }) => ({ value: id, label: name }))} />
        <AdminSelect name="status" label={t("pages.knowledge.status")} required defaultValue={initial.status} options={Object.values(KNOWLEDGE_STATUSES).map((value) => ({ value, label: t(`labels.knowledgeStatus.${value}`) }))} />
        <AdminInput name="order" label={t("pages.knowledge.sira")} type="number" min={0} max={9999} defaultValue={String(initial.order)} />
        <FullWidth><AdminTextarea name="shortDefinition" label={t("pages.knowledge.qisaTerif")} required rows={3} maxLength={400} defaultValue={initial.shortDefinition} /></FullWidth>
        <FullWidth><ContentEditor name="definition" label={t("pages.knowledge.etrafliIzah")} defaultValue={initial.definition} /></FullWidth>
        <FullWidth><AdminTextarea name="relatedSlugs" label={t("pages.knowledge.elaqeliTerminSlugLari")} rows={4} defaultValue={initial.relatedSlugs} hint={t("pages.knowledge.herSetirdeBirSlug")} /></FullWidth>
      </FormSection>
    </AdminForm>
  );
}
