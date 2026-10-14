"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, CheckCircle2, Copy, Link2, Link2Off, RefreshCw, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { LISTING_HANDOVER, type ListingHandover } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IDLE_STATE, type ActionState } from "@/lib/admin/action-state";
import {
  approveAgencyRequest,
  disableInviteLink,
  inviteAgencyEmployee,
  regenerateInviteLink,
  rejectAgencyRequest,
  removeAgencyEmployee,
} from "./actions";

function StateMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return null;
  const error = state.status === "error";
  const Icon = error ? AlertCircle : CheckCircle2;
  return (
    <p
      role={error ? "alert" : "status"}
      className={
        error
          ? "mb-4 flex min-w-0 items-start gap-2.5 rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger [overflow-wrap:anywhere]"
          : "mb-4 flex min-w-0 items-start gap-2.5 rounded-xs border border-success/30 bg-success-bg px-4 py-3 text-sm text-success [overflow-wrap:anywhere]"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  );
}

export function InviteEmployeeForm({ disabled }: { disabled: boolean }) {
  const t = useTranslations("account.team");
  const [state, formAction, pending] = useActionState(inviteAgencyEmployee, IDLE_STATE);

  if (disabled) {
    return <p className="text-sm text-ink-muted">{t("limit")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end" noValidate>
      <div className="flex-1">
        <StateMessage state={state} />
        <Input
          name="email"
          type="email"
          label={t("email")}
          required
          placeholder="user@example.com"
          error={state.fieldErrors?.email}
        />
      </div>
      <Button type="submit" variant="primary" loading={pending} className="sm:mb-0.5">
        {t("invite")}
      </Button>
    </form>
  );
}

/**
 * Əməkdaşı çıxarmaq (#159): elanı varsa sahib onların taleyini seçir — agentdə qalır,
 * agentliyə və ya başqa agentə keçir. Elanı yoxdursa adi təsdiq dialoqu.
 */
export function RemoveEmployeeButton({
  id,
  name,
  listingCount = 0,
  teammates = [],
}: {
  id: string;
  name: string;
  listingCount?: number;
  teammates?: { userId: string; name: string }[];
}) {
  const t = useTranslations("account.team");
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [handover, setHandover] = useState<ListingHandover>(LISTING_HANDOVER.AGENCY);
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (listingCount === 0) {
    return (
      <ConfirmAction
        action={(employeeId) => removeAgencyEmployee(employeeId)}
        id={id}
        label={t("removeLabel", { name })}
        title={t("removeTitle")}
        description={t("removeDescription", { name })}
        confirmLabel={t("remove")}
        tone="danger"
      >
        <UserX className="size-4" aria-hidden="true" />
      </ConfirmAction>
    );
  }

  const options: { value: ListingHandover; label: string; hint: string }[] = [
    { value: LISTING_HANDOVER.AGENCY, label: t("handover.agency"), hint: t("handover.agencyHint") },
    ...(teammates.length > 0 ? [{ value: LISTING_HANDOVER.AGENT, label: t("handover.agent"), hint: t("handover.agentHint") }] : []),
    { value: LISTING_HANDOVER.KEEP, label: t("handover.keep"), hint: t("handover.keepHint", { name }) },
  ];

  function submit() {
    if (handover === LISTING_HANDOVER.AGENT && !target) {
      setError(t("handover.chooseAgent"));
      return;
    }
    startTransition(async () => {
      const result = await removeAgencyEmployee(id, handover, handover === LISTING_HANDOVER.AGENT ? target : null);
      if (result.status !== "success") {
        setError(result.message ?? t("handover.failed"));
        return;
      }
      if (result.message) toast(result.message, "success");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("removeLabel", { name })}
        title={t("removeLabel", { name })}
        className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger"
      >
        <UserX className="size-4" aria-hidden="true" />
      </button>
      <Modal
        open={open}
        onClose={() => (pending ? undefined : setOpen(false))}
        title={t("removeTitle")}
        description={t("handover.description", { name, count: listingCount })}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              {t("handover.cancel")}
            </Button>
            <Button variant="danger" size="sm" onClick={submit} loading={pending}>
              {t("remove")}
            </Button>
          </>
        }
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-ink">{t("handover.question", { count: listingCount })}</legend>
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-sm border p-3 transition-colors",
                handover === option.value ? "border-gold bg-gold/10" : "border-line hover:border-gold",
              )}
            >
              <input
                type="radio"
                name={`handover-${id}`}
                value={option.value}
                checked={handover === option.value}
                onChange={() => {
                  setHandover(option.value);
                  setError(null);
                }}
                className="mt-0.5 size-4 accent-gold"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="block text-xs text-ink-muted">{option.hint}</span>
              </span>
            </label>
          ))}
          {handover === LISTING_HANDOVER.AGENT && (
            <Select
              label={t("handover.agentSelect")}
              placeholder={t("handover.chooseAgent")}
              options={teammates.map((teammate) => ({ value: teammate.userId, label: teammate.name }))}
              value={target}
              onChange={(event) => {
                setTarget(event.target.value);
                setError(null);
              }}
            />
          )}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </fieldset>
      </Modal>
    </>
  );
}

/** Agentin qoşulma sorğusu: sahib təsdiqləyir və ya rədd edir. */
export function ReviewRequestButtons({ id, name }: { id: string; name: string }) {
  const t = useTranslations("account.team");
  return (
    <div className="flex shrink-0 items-center gap-1">
      <ConfirmAction
        action={approveAgencyRequest}
        id={id}
        label={t("approveLabel", { name })}
        title={t("approve")}
        description={t("approveLabel", { name })}
        confirmLabel={t("approve")}
        tone="neutral"
      >
        <Check className="size-4" aria-hidden="true" />
      </ConfirmAction>
      <ConfirmAction
        action={rejectAgencyRequest}
        id={id}
        label={t("rejectLabel", { name })}
        title={t("reject")}
        description={t("rejectLabel", { name })}
        confirmLabel={t("reject")}
        tone="danger"
      >
        <X className="size-4" aria-hidden="true" />
      </ConfirmAction>
    </div>
  );
}

/**
 * Dəvət linki (#157): sahib linki kopyalayıb agentlərinə göndərir, linklə gələn agent
 * komandaya birbaşa qoşulur. «Yenilə» köhnə linki öldürür, «Söndür» linki bağlayır.
 */
export function InviteLinkCard({
  url,
  createdLabel,
  agencyVerified,
  disabled,
}: {
  url: string | null;
  createdLabel: string | null;
  agencyVerified: boolean;
  disabled: boolean;
}) {
  const t = useTranslations("account.team.inviteLink");
  const [state, setState] = useState<ActionState>(IDLE_STATE);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: () => Promise<ActionState>) {
    startTransition(async () => {
      const result = await action();
      setState(result);
      setCopied(false);
      if (result.status === "success") router.refresh();
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <StateMessage state={state} />
      {!agencyVerified && <p className="rounded-xs bg-warning-bg px-4 py-3 text-sm text-ink-soft">{t("notVerified")}</p>}
      {url ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="invite-link-url">{t("label")}</label>
            <input
              id="invite-link-url"
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              className="min-h-11 min-w-0 flex-1 rounded-sm border border-line bg-ivory px-3 font-mono text-sm text-ink"
            />
            <Button type="button" variant="primary" onClick={copy} className="shrink-0">
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
          <p className="text-xs text-ink-muted" aria-live="polite">
            {createdLabel ? t("createdAt", { date: createdLabel }) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" loading={pending} onClick={() => run(regenerateInviteLink)} disabled={disabled}>
              <RefreshCw className="size-4" aria-hidden="true" />
              {t("regenerate")}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => run(disableInviteLink)}>
              <Link2Off className="size-4" aria-hidden="true" />
              {t("disable")}
            </Button>
          </div>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          loading={pending}
          onClick={() => run(regenerateInviteLink)}
          disabled={disabled}
          className="w-full sm:w-fit"
        >
          <Link2 className="size-4" aria-hidden="true" />
          {t("create")}
        </Button>
      )}
    </div>
  );
}
