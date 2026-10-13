"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Building2, CheckCircle2, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { leaveAgency, requestAgencyJoin } from "./agency-actions";

export type AgentMembership = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  agencyName: string;
};

/**
 * Agent kabinetində «Agentliyim»: cari üzvlük/sorğu statusu, ləğv/çıxış və —
 * aktiv üzvlük yoxdursa — agentliyi adla tapıb sorğu göndərmək.
 */
export function AgencyMembershipCard({
  membership,
  agencies,
}: {
  membership: AgentMembership | null;
  agencies: { name: string; slug: string }[];
}) {
  const t = useTranslations("account.profile");
  const authT = useTranslations("auth.fields");
  const [state, formAction, pending] = useActionState(requestAgencyJoin, IDLE_STATE);
  const active = membership && membership.status !== "REJECTED" ? membership : null;

  return (
    <div className="flex flex-col gap-4">
      {membership && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-ivory p-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Building2 className="size-5 shrink-0 text-gold-deep" aria-hidden="true" />
            <span className="truncate font-medium text-ink">{membership.agencyName}</span>
            <Badge tone={membership.status === "APPROVED" ? "success" : membership.status === "PENDING" ? "warning" : "danger"}>
              {membership.status === "APPROVED" ? t("agencyApproved") : membership.status === "PENDING" ? t("agencyPending") : t("agencyRejected")}
            </Badge>
          </div>
          {active && (
            <ConfirmAction
              action={leaveAgency}
              id={active.id}
              label={active.status === "APPROVED" ? t("agencyLeave") : t("agencyCancel")}
              title={active.status === "APPROVED" ? t("agencyLeave") : t("agencyCancel")}
              description={t("agencyLeaveDescription", { name: active.agencyName })}
              confirmLabel={active.status === "APPROVED" ? t("agencyLeave") : t("agencyCancel")}
              tone="danger"
              className="min-h-11 px-3 text-sm"
            >
              <LogOut className="size-4" aria-hidden="true" />
              {active.status === "APPROVED" ? t("agencyLeave") : t("agencyCancel")}
            </ConfirmAction>
          )}
        </div>
      )}

      {!active && (
        agencies.length === 0 ? (
          <p className="text-sm text-ink-muted">{authT("joinAgencyEmpty")}</p>
        ) : (
          <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
            <div className="min-w-0 flex-1">
              <Combobox
                name="agencySlug"
                label={authT("joinAgency")}
                placeholder={authT("joinAgencyPlaceholder")}
                hint={authT("joinAgencyHint")}
                options={agencies.map((agency) => ({ value: agency.slug, label: agency.name }))}
                required
                error={state.fieldErrors?.agencySlug}
                messages={{ noResults: authT("joinAgencyEmpty") }}
              />
            </div>
            <Button type="submit" loading={pending} className="min-h-11 sm:mb-6">
              {t("agencyRequest")}
            </Button>
          </form>
        )
      )}

      {state.status !== "idle" && state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "flex items-start gap-2 text-sm text-danger"
              : "flex items-start gap-2 text-sm text-success"
          }
        >
          {state.status === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {state.message}
        </p>
      )}
    </div>
  );
}
