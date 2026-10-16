"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { APPEAL_MESSAGE_MAX, APPEAL_MESSAGE_MIN } from "@/lib/constants";
import { submitPropertyAppeal } from "./actions";

/** «Etiraz et» (#206, PRD 20.4): rədd edilmiş/dayandırılmış elanın sahibi əsaslandırılmış etiraz göndərir. */
export function AppealButton({ propertyId, title }: { propertyId: string; title: string }) {
  const t = useTranslations("account.listings");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function submit() {
    const text = message.trim();
    if (text.length < APPEAL_MESSAGE_MIN || text.length > APPEAL_MESSAGE_MAX) {
      setError(t("appeal.length", { min: APPEAL_MESSAGE_MIN, max: APPEAL_MESSAGE_MAX }));
      return;
    }
    startTransition(async () => {
      const result = await submitPropertyAppeal(propertyId, text);
      if (result.status !== "success") {
        setError(result.message ?? t("appeal.failed"));
        return;
      }
      if (result.message) toast(result.message, "success");
      setOpen(false);
      setMessage("");
      setError(null);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={t("appeal.label", { title })} className="gap-1.5">
        <Scale className="size-4" aria-hidden="true" />
        {t("appeal.button")}
      </Button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={t("appeal.title")}
        description={t("appeal.description", { title })}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              {t("appeal.cancel")}
            </Button>
            <Button size="sm" onClick={submit} loading={pending}>
              {t("appeal.submit")}
            </Button>
          </>
        }
      >
        <Textarea
          name="appeal"
          label={t("appeal.messageLabel")}
          hint={t("appeal.messageHint", { min: APPEAL_MESSAGE_MIN })}
          rows={5}
          maxLength={APPEAL_MESSAGE_MAX}
          value={message}
          onChange={(event) => {
            setMessage(event.currentTarget.value);
            setError(null);
          }}
          error={error ?? undefined}
        />
      </Modal>
    </>
  );
}
