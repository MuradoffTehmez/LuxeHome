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
  const t = useTranslations("admin");
  return (
    <AdminForm action={createPropertyType} submitLabel={t("pages.taxonomy.novElaveEt")}>
      <FormSection title={t("pages.taxonomy.yeniEmlakNovu")} description={t("pages.taxonomy.sadeAdKifayetdirSlug")}>
        <AdminInput name="name" label={t("pages.taxonomy.ad")} required maxLength={80} placeholder={t("pages.taxonomy.mesVilla")} />
      </FormSection>
    </AdminForm>
  );
}

export function CreateFeatureForm() {
  const t = useTranslations("admin");
  return (
    <AdminForm action={createFeature} submitLabel={t("pages.taxonomy.xususiyyetElaveEt")}>
      <FormSection title={t("pages.taxonomy.yeniXususiyyet")} description={t("pages.taxonomy.qrupFiltrPanelindeHansi")}>
        <AdminInput name="name" label={t("pages.taxonomy.ad")} required maxLength={80} placeholder={t("pages.taxonomy.mesLift")} />
        <AdminSelect
          name="group"
          label={t("pages.taxonomy.qrup")}
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
  const t = useTranslations("admin");
  const { toast } = useToast();

  return (
    <li className="flex min-w-0 flex-col items-stretch gap-2 border-b border-line px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm text-ink [overflow-wrap:anywhere]">{name}</span>
        <span className="tabular text-xs text-ink-muted">({propertyCount})</span>
        {!isActive && <Badge tone="neutral">{t("pages.taxonomy.deaktiv")}</Badge>}
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
            {isActive ? "Deaktiv et" : t("pages.misc.aktivlesdir")}
          </button>
        </form>
        <ConfirmAction
          action={deletePropertyType}
          id={id}
          label={t("pages.common.novunuSil", { p0: name })}
          title={t("pages.taxonomy.emlakNovunuSilmek")}
          description={t("pages.taxonomy.buNovdeEmlakYoxdursa")}
          confirmLabel={t("pages.taxonomy.sil")}
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
  const t = useTranslations("admin");
  return (
    <li className="flex min-w-0 items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm text-ink [overflow-wrap:anywhere]">{name}</span>
        <span className="tabular text-xs text-ink-muted">({propertyCount})</span>
      </div>
      <ConfirmAction
        action={deleteFeature}
        id={id}
        label={t("pages.common.xususiyyetiniSil", { p0: name })}
        title={t("pages.taxonomy.xususiyyetiSilmek")}
        description={t("pages.taxonomy.buXususiyyetHecBir")}
        confirmLabel={t("pages.taxonomy.sil")}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </ConfirmAction>
    </li>
  );
}
