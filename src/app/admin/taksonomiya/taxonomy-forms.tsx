"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { FEATURE_GROUPS } from "@/lib/constants";
import {
  createFeature,
  createPropertyType,
  deleteFeature,
  deletePropertyType,
  togglePropertyTypeActive,
} from "./actions";

/** Qrup adları dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const featureGroupOptions = (t: ReturnType<typeof useTranslations<"admin">>) =>
  Object.values(FEATURE_GROUPS).map((value) => ({
    value,
    label: t(`labels.featureGroup.${value}`),
  }));

export function CreatePropertyTypeForm() {
  return (
    <AdminForm action={createPropertyType} submitLabel="Növ əlavə et">
      <FormSection title="Yeni əmlak növü" description="Sadə ad kifayətdir — slug avtomatik yaradılır.">
        <AdminInput name="name" label="Ad" required maxLength={80} placeholder="məs. Villa" />
      </FormSection>
    </AdminForm>
  );
}

export function CreateFeatureForm() {
  const t = useTranslations("admin");
  return (
    <AdminForm action={createFeature} submitLabel="Xüsusiyyət əlavə et">
      <FormSection title="Yeni xüsusiyyət" description="Qrup filtr panelində hansı bölmədə görünəcəyini müəyyən edir.">
        <AdminInput name="name" label="Ad" required maxLength={80} placeholder="məs. Lift" />
        <AdminSelect
          name="group"
          label="Qrup"
          required
          defaultValue={FEATURE_GROUPS.GENERAL}
          options={featureGroupOptions(t)}
        />
      </FormSection>
    </AdminForm>
  );
}

export function PropertyTypeRow({
  id,
  name,
  isActive,
  propertyCount,
}: {
  id: string;
  name: string;
  isActive: boolean;
  propertyCount: number;
}) {
  const { toast } = useToast();

  return (
    <li className="flex min-w-0 flex-col items-stretch gap-2 border-b border-line px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm text-ink [overflow-wrap:anywhere]">{name}</span>
        <span className="tabular text-xs text-ink-muted">({propertyCount})</span>
        {!isActive && <Badge tone="neutral">Deaktiv</Badge>}
      </div>
      <div className="flex items-center justify-end gap-1 sm:shrink-0">
        <form
          action={async () => {
            const result = await togglePropertyTypeActive(id);
            toast(result.message ?? "", result.status === "success" ? "success" : "error");
          }}
        >
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-xs px-3 text-xs font-medium text-ink-soft transition-colors hover:bg-beige hover:text-ink"
          >
            {isActive ? "Deaktiv et" : "Aktivləşdir"}
          </button>
        </form>
        <ConfirmAction
          action={deletePropertyType}
          id={id}
          label={`«${name}» növünü sil`}
          title="Əmlak növünü silmək"
          description="Bu növdə əmlak yoxdursa silinə bilər. Əməliyyat geri qaytarıla bilməz."
          confirmLabel="Sil"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      </div>
    </li>
  );
}

export function FeatureRow({
  id,
  name,
  propertyCount,
}: {
  id: string;
  name: string;
  propertyCount: number;
}) {
  return (
    <li className="flex min-w-0 items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm text-ink [overflow-wrap:anywhere]">{name}</span>
        <span className="tabular text-xs text-ink-muted">({propertyCount})</span>
      </div>
      <ConfirmAction
        action={deleteFeature}
        id={id}
        label={`«${name}» xüsusiyyətini sil`}
        title="Xüsusiyyəti silmək"
        description="Bu xüsusiyyət heç bir əmlaka bağlı deyilsə silinə bilər."
        confirmLabel="Sil"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </ConfirmAction>
    </li>
  );
}
