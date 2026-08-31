"use client";

import { useTranslations } from "next-intl";
import { AdminCheckbox, AdminInput, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { saveKnowledgeCategory } from "./actions";
import type { KnowledgeCategoryFormValues } from "./form-values";

export function KnowledgeCategoryForm({ initial }: { initial: KnowledgeCategoryFormValues }) {
  const t = useTranslations("admin");
  return (
    <AdminForm
      key={initial.id ?? "new"}
      action={saveKnowledgeCategory}
      submitLabel={initial.id ? t("pages.misc.movzunuYenile") : t("pages.misc.movzuYarat")}
      cancelHref={initial.id ? "/admin/bilik-merkezi/kateqoriyalar" : undefined}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormSection title={initial.id ? t("pages.misc.movzunuRedakteEt") : t("pages.misc.yeniMovzu")}>
        <AdminInput name="name" label={t("pages.knowledge.ad")} required maxLength={80} defaultValue={initial.name} />
        <AdminInput name="slug" label={t("pages.knowledge.slug")} maxLength={90} defaultValue={initial.slug} hint={t("pages.knowledge.bosBuraxsanizAddanYaradilir")} />
        <AdminInput name="icon" label={t("pages.knowledge.ikonAdi")} maxLength={40} defaultValue={initial.icon} hint={t("pages.knowledge.meselenHomeKeyroundLandmark")} />
        <AdminInput name="order" label={t("pages.knowledge.sira")} type="number" min={0} max={9999} defaultValue={String(initial.order)} />
        <FullWidth>
          <AdminTextarea name="description" label={t("pages.knowledge.izah")} required rows={5} minLength={40} maxLength={1200} defaultValue={initial.description} />
        </FullWidth>
        <FullWidth>
          <AdminCheckbox name="isActive" label={t("pages.knowledge.ictimaiSaytdaAktivdir")} defaultChecked={initial.isActive} />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
