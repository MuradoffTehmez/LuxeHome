"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Building2, CheckCircle2, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { LISTING_HANDOVER } from "@/lib/constants";
import { cn } from "@/lib/utils";
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
  listingCount = 0,
}: {
  membership: AgentMembership | null;
  agencies: { name: string; slug: string }[];
  /** Agentin öz elanları — çıxanda agentliyə təhvil verilə bilər (#159). */
  listingCount?: number;
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
          {active && active.status === "APPROVED" && listingCount > 0 ? (
            <LeaveWithListings id={active.id} agencyName={active.agencyName} listingCount={listingCount} />
          ) : active && (
            <ConfirmAction
              action={(id) => leaveAgency(id)}
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

/**
 * Elanı olan agentin agentlikdən çıxması (#159): elanlar agentdə qalır və ya agentliyə
 * təhvil verilir. Müraciətlər elana bağlıdır — elanla birlikdə keçir.
 */
function LeaveWithListings({ id, agencyName, listingCount }: { id: string; agencyName: string; listingCount: number }) {
  const t = useTranslations("account.profile");
  const team = useTranslations("account.team.handover");
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [handOver, setHandOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await leaveAgency(id, handOver ? LISTING_HANDOVER.AGENCY : LISTING_HANDOVER.KEEP);
      if (result.status !== "success") {
        setError(result.message ?? team("failed"));
        return;
      }
      if (result.message) toast(result.message, "success");
      setOpen(false);
      router.refresh();
    });
  }

  const options = [
    { value: false, label: team("keepOwn"), hint: team("keepOwnHint") },
    { value: true, label: team("giveAgency", { name: agencyName }), hint: team("giveAgencyHint") },
  ];

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)} className="min-h-11 px-3 text-sm text-danger hover:bg-danger-bg">
        <LogOut className="size-4" aria-hidden="true" />
        {t("agencyLeave")}
      </Button>
      <Modal
        open={open}
        onClose={() => (pending ? undefined : setOpen(false))}
        title={t("agencyLeave")}
        description={t("agencyLeaveDescription", { name: agencyName })}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              {team("cancel")}
            </Button>
            <Button variant="danger" size="sm" onClick={submit} loading={pending}>
              {t("agencyLeave")}
            </Button>
          </>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-ink">{team("question", { count: listingCount })}</legend>
          {options.map((option) => (
            <label
              key={String(option.value)}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors",
                handOver === option.value ? "border-gold bg-gold/10" : "border-line hover:border-gold",
              )}
            >
              <input
                type="radio"
                name={`leave-${id}`}
                checked={handOver === option.value}
                onChange={() => setHandOver(option.value)}
                className="mt-0.5 size-4 accent-gold"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="block text-xs text-ink-muted">{option.hint}</span>
              </span>
            </label>
          ))}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </fieldset>
      </Modal>
    </>
  );
}
