"use client";

import { AdminCheckbox, AdminInput, AdminTextarea, FullWidth } from "@/components/admin/form-fields";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { saveKnowledgeCategory } from "./actions";
import type { KnowledgeCategoryFormValues } from "./form-values";

export function KnowledgeCategoryForm({ initial }: { initial: KnowledgeCategoryFormValues }) {
  return (
    <AdminForm
      key={initial.id ?? "new"}
      action={saveKnowledgeCategory}
      submitLabel={initial.id ? "Mövzunu yenilə" : "Mövzu yarat"}
      cancelHref={initial.id ? "/admin/bilik-merkezi/kateqoriyalar" : undefined}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormSection title={initial.id ? "Mövzunu redaktə et" : "Yeni mövzu"}>
        <AdminInput name="name" label="Ad" required maxLength={80} defaultValue={initial.name} />
        <AdminInput name="slug" label="Slug" maxLength={90} defaultValue={initial.slug} hint="Boş buraxsanız addan yaradılır." />
        <AdminInput name="icon" label="İkon adı" maxLength={40} defaultValue={initial.icon} hint="Məsələn: Home, KeyRound, Landmark. İxtiyaridir." />
        <AdminInput name="order" label="Sıra" type="number" min={0} max={9999} defaultValue={String(initial.order)} />
        <FullWidth>
          <AdminTextarea name="description" label="İzah" required rows={5} minLength={40} maxLength={1200} defaultValue={initial.description} />
        </FullWidth>
        <FullWidth>
          <AdminCheckbox name="isActive" label="İctimai saytda aktivdir" defaultChecked={initial.isActive} />
        </FullWidth>
      </FormSection>
    </AdminForm>
  );
}
