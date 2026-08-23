"use client";

import { Trash2 } from "lucide-react";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { FEATURE_GROUPS, FEATURE_GROUP_LABELS } from "@/lib/constants";
import {
  createFeature,
  createPropertyType,
  deleteFeature,
  deletePropertyType,
  togglePropertyTypeActive,
} from "./actions";

const FEATURE_GROUP_OPTIONS = Object.values(FEATURE_GROUPS).map((value) => ({
  value,
  label: FEATURE_GROUP_LABELS[value],
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
  return (
    <AdminForm action={createFeature} submitLabel="Xüsusiyyət əlavə et">
      <FormSection title="Yeni xüsusiyyət" description="Qrup filtr panelində hansı bölmədə görünəcəyini müəyyən edir.">
        <AdminInput name="name" label="Ad" required maxLength={80} placeholder="məs. Lift" />
        <AdminSelect
          name="group"
          label="Qrup"
          required
          defaultValue={FEATURE_GROUPS.GENERAL}
          options={FEATURE_GROUP_OPTIONS}
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
    <li className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink">{name}</span>
        <span className="tabular text-xs text-ink-muted">({propertyCount})</span>
        {!isActive && <Badge tone="neutral">Deaktiv</Badge>}
      </div>
      <div className="flex items-center gap-1">
        <form
          action={async () => {
            const result = await togglePropertyTypeActive(id);
            toast(result.message ?? "", result.status === "success" ? "success" : "error");
          }}
        >
          <button
            type="submit"
            className="rounded-xs px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-beige hover:text-ink"
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
    <li className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink">{name}</span>
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
