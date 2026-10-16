"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, CheckCircle2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import { REJECTION_REASON_MAX, TRANSFER_REASON_MAX, TRANSFER_REASON_MIN } from "@/lib/constants";
import { cancelListingTransfer, decideIncomingTransfer, requestListingTransfer } from "./actions";

function StateMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const error = state.status === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
          : "flex min-w-0 items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success [overflow-wrap:anywhere]"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  );
}

/**
 * Köçürmə sorğusu (#212, PRD 6.4): elanın linki, təhvil alan, səbəb və əmlak sahibinin razılığı.
 * Agent yalnız özünə istəyir — seçim siyahısı yalnız agentlik sahibinə göstərilir.
 */
export function TransferRequestForm({ targets }: { targets: { value: string; label: string }[] | null }) {
  const t = useTranslations("account.transfers");
  const [state, formAction, pending] = useActionState(requestListingTransfer, IDLE_STATE);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="flex flex-col gap-5" key={state.status === "success" ? state.message : "form"}>
      <Input
        name="listing"
        label={t("form.listing")}
        hint={t("form.listingHint")}
        placeholder="https://luxehomeestate.az/az/emlaklar/…"
        required
        maxLength={500}
        error={errors.listing}
      />
      {targets && targets.length > 1 && (
        <Select name="target" label={t("form.target")} options={targets} defaultValue={targets[0]?.value} error={errors.target} />
      )}
      <Textarea
        name="reason"
        label={t("form.reason")}
        hint={t("form.reasonHint", { min: TRANSFER_REASON_MIN, max: TRANSFER_REASON_MAX })}
        required
        minLength={TRANSFER_REASON_MIN}
        maxLength={TRANSFER_REASON_MAX}
        rows={4}
        error={errors.reason}
      />
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-ivory p-4">
        <Checkbox name="ownerConsent" label={t("form.consent")} required />
        {errors.ownerConsent && <p className="text-sm text-danger">{errors.ownerConsent}</p>}
        <Textarea name="ownerConsentNote" label={t("form.consentNote")} hint={t("form.consentNoteHint")} maxLength={TRANSFER_REASON_MAX} rows={2} />
      </div>
      <p className="text-xs leading-5 text-ink-muted">{t("form.privacy")}</p>
      <StateMessage state={state} />
      <div>
        <Button type="submit" loading={pending}>{t("form.submit")}</Button>
      </div>
    </form>
  );
}

/** A agentliyinin sahibi: gələn sorğunu təsdiqləyir və ya səbəblə rədd edir. */
export function IncomingTransferActions({ id, title }: { id: string; title: string }) {
  const t = useTranslations("account.transfers");
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function close() {
    if (pending) return;
    setMode(null);
    setNote("");
    setError(null);
  }

  function submit() {
    startTransition(async () => {
      const result = await decideIncomingTransfer(id, mode === "approve", note);
      if (result.status !== "success") {
        setError(result.message ?? t("errors.failed"));
        return;
      }
      if (result.message) toast(result.message, "success");
      close();
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setMode("approve")}>
          <Check className="size-4" aria-hidden="true" />
          {t("approve")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setMode("reject")} className="border border-line text-danger hover:bg-danger-bg">
          <X className="size-4" aria-hidden="true" />
          {t("reject")}
        </Button>
      </div>
      <Modal
        open={mode !== null}
        onClose={close}
        title={mode === "approve" ? t("approveTitle") : t("rejectTitle")}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={close} disabled={pending}>{t("cancelAction")}</Button>
            <Button variant={mode === "reject" ? "danger" : "primary"} size="sm" onClick={submit} loading={pending}>
              {mode === "approve" ? t("approve") : t("reject")}
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-ink-soft">
          {mode === "approve" ? t("approveDescription", { title }) : t("rejectDescription", { title })}
        </p>
        <Textarea
          label={mode === "approve" ? t("noteOptional") : t("noteRequired")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={REJECTION_REASON_MAX}
          rows={3}
          error={error ?? undefined}
        />
      </Modal>
    </>
  );
}

export function CancelTransferButton({ id }: { id: string }) {
  const t = useTranslations("account.transfers");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="ghost"
      loading={pending}
      className="border border-line"
      onClick={() =>
        startTransition(async () => {
          const result = await cancelListingTransfer(id);
          toast(result.message ?? t("errors.failed"), result.status === "success" ? "success" : "error");
          if (result.status === "success") router.refresh();
        })
      }
    >
      <Undo2 className="size-4" aria-hidden="true" />
      {t("withdraw")}
    </Button>
  );
}
