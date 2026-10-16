"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquareWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { ReasonAction } from "@/components/admin/reason-action";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { approveModerationProperty, rejectModerationProperty, requestModerationChanges } from "./actions";
import { useTranslations } from "next-intl";
import { useLocalizedActionState } from "@/components/admin/use-server-message";

export function ApprovePropertyButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("admin");
  return (
    <ConfirmAction
      action={approveModerationProperty}
      id={id}
      label={t("pages.common.tesdiqle", { p0: title })}
      title={t("pages.moderation.elaniTesdiqlemek")}
      description={t("pages.common.dercOlunacaqVeSaytda", { p0: title })}
      confirmLabel={t("pages.moderation.tesdiqle")}
      tone="neutral"
      className="size-11"
    >
      <Check className="size-4" aria-hidden="true" />
    </ConfirmAction>
  );
}

export function RejectPropertyButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [rawState, formAction, pending] = useActionState(rejectModerationProperty, IDLE_STATE);
  const state = useLocalizedActionState(rawState);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "idle" || !state.message) return;
    toast(state.message, state.status === "success" ? "success" : "error");
    if (state.status === "success") {
      setOpen(false);
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("pages.common.reddEt", { p0: title })}
        title={t("pages.common.reddEt", { p0: title })}
        className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("pages.moderation.elaniReddEtmek")}
        description={t("pages.moderation.rejectDescription", { title })}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              {t("pages.moderation.legvEt")}
            </Button>
            <Button type="submit" form={`reject-form-${id}`} variant="danger" size="sm" loading={pending}>
              {t("pages.moderation.reddEt")}
            </Button>
          </>
        }
      >
        <form id={`reject-form-${id}`} action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <Textarea
            name="reason"
            label={t("pages.moderation.sebebIsteyeGore")}
            placeholder={t("pages.moderation.sekillerAydinDeyilQiymet")}
            maxLength={500}
          />
        </form>
      </Modal>
    </>
  );
}

/** «Düzəliş tələb et» (#202): sahibə konkret düzəliş istəyi gedir, elan `NEEDS_INFO` olur. */
export function RequestChangesButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("admin");
  return (
    <ReasonAction
      action={requestModerationChanges}
      id={id}
      label={t("pages.moderation.requestChangesLabel", { title })}
      title={t("pages.moderation.requestChanges")}
      description={t("pages.moderation.requestChangesDescription", { title })}
      confirmLabel={t("pages.moderation.requestChanges")}
      presets={[
        t("pages.moderation.changePresets.photos"),
        t("pages.moderation.changePresets.price"),
        t("pages.moderation.changePresets.address"),
        t("pages.moderation.changePresets.description"),
      ]}
    >
      <MessageSquareWarning className="size-4" aria-hidden="true" />
    </ReasonAction>
  );
}
