"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { approveModerationProperty, rejectModerationProperty } from "./actions";
import { useTranslations } from "next-intl";

export function ApprovePropertyButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("admin");
  return (
    <ConfirmAction
      action={approveModerationProperty}
      id={id}
      label={`${title} təsdiqlə`}
      title={t("pages.moderation.elaniTesdiqlemek")}
      description={`"${title}" dərc olunacaq və saytda ictimai görünəcək.`}
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
  const [state, formAction, pending] = useActionState(rejectModerationProperty, IDLE_STATE);
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
        aria-label={`${title} rədd et`}
        title={`${title} rədd et`}
        className="grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("pages.moderation.elaniReddEtmek")}
        description={`"${title}" qaralamaya qaytarılacaq. Sahib "Elanlarım"da səbəbi görəcək.`}
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
