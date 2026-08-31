"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { AdminForm, FormSection } from "@/components/admin/form-shell";
import { AdminInput, AdminSelect } from "@/components/admin/form-fields";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Badge } from "@/components/ui/badge";
import { createRedirect, deleteRedirect, dismissNotFoundHit, toggleRedirectActive } from "./actions";

/** Status adları dilə bağlıdır, ona görə modul sabiti kimi saxlanmır. */
const statusOptions = (t: ReturnType<typeof useTranslations<"admin">>) => [
  { value: "301", label: t("pages.serp.301Daimi") },
  { value: "302", label: t("pages.serp.302Muveqqeti") },
];

export function CreateRedirectForm() {
  const t = useTranslations("admin");
  return (
    <AdminForm action={createRedirect} submitLabel={t("pages.serp.yonlendirmeElaveEt")}>
      <FormSection
        title={t("pages.serp.yeniYonlendirme")}
        description={t("pages.serp.kohneUrlBuSaytdan")}
      >
        <AdminInput name="fromPath" label={t("pages.serp.kohneUnvan")} required placeholder="/kohne-yol" />
        <AdminInput name="toPath" label={t("pages.serp.yeniUnvan")} required placeholder="/emlaklar/yeni-slug" />
        <AdminSelect name="statusCode" label={t("pages.serp.nov")} required defaultValue="301" options={statusOptions(t)} />
      </FormSection>
    </AdminForm>
  );
}

export function RedirectRow({
  id,
  fromPath,
  toPath,
  statusCode,
  isActive,
  hitCount,
}: {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  hitCount: number;
}) {
  const t = useTranslations("admin");
  return (
    <li className="flex flex-col gap-2 border-b border-line px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-ink [overflow-wrap:anywhere]">{fromPath}</span>
          <span className="text-ink-muted">→</span>
          <span className="text-ink-soft [overflow-wrap:anywhere]">{toPath}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Badge tone="neutral">{statusCode}</Badge>
          <span className="tabular">{hitCount} baxış</span>
          {!isActive && <Badge tone="neutral">{t("pages.serp.deaktiv")}</Badge>}
        </div>
      </div>
      <div className="flex items-center gap-1 self-end sm:self-auto">
        <form
          action={async () => {
            await toggleRedirectActive(id);
          }}
        >
          <button
            type="submit"
            className="rounded-xs px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-beige hover:text-ink"
          >
            {isActive ? "Deaktiv et" : t("pages.misc.aktivlesdir")}
          </button>
        </form>
        <ConfirmAction
          action={deleteRedirect}
          id={id}
          label={t("pages.common.yonlendirmesiniSil", { p0: fromPath })}
          title={t("pages.serp.yonlendirmeniSilmek")}
          description={t("pages.serp.buYonlendirmeSilinecekZiyaretciler")}
          confirmLabel={t("pages.serp.sil")}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      </div>
    </li>
  );
}

export function NotFoundHitRow({
  id,
  path,
  count,
  lastSeenAt,
  firstSeenAt,
}: {
  id: string;
  path: string;
  count: number;
  lastSeenAt: string;
  /** İlk qeyd tarixi — yolun köhnə sınıq link, yoxsa yeni skaner olduğunu ayırır. */
  firstSeenAt: string;
}) {
  const t = useTranslations("admin");
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 last:border-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm text-ink [overflow-wrap:anywhere]">{path}</span>
        <span className="text-xs text-ink-muted">İlk: {firstSeenAt} · Son: {lastSeenAt}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="tabular text-xs font-medium text-ink-muted">{count}×</span>
        <ConfirmAction
          action={dismissNotFoundHit}
          id={id}
          label={`«${path}» 404 qeydini sil`}
          title={t("pages.serp.404QeydiniSilmek")}
          description={t("pages.serp.buYolSiyahidanCixarilacaq")}
          confirmLabel={t("pages.serp.sil")}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </ConfirmAction>
      </div>
    </li>
  );
}
