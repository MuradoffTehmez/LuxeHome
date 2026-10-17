"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { PROMOTION_DURATIONS_DAYS, VIP_DECISION_NOTE_MAX } from "@/lib/constants";
import { requestPromotionAction } from "./promotion-actions";

/** «İrəli çək» (#250, PRD 15.4): ödənişsiz sorğu, kart məlumatı istənmir — administrator idarə edir. */
export function PromotionRequestButton({ propertyId, title }: { propertyId: string; title: string }) {
  const t = useTranslations("account.listings");
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("7");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const result = await requestPromotionAction(propertyId, Number(days), message.trim());
      if (result.status !== "success") {
        setError(result.message ?? t("promotion.errors.failed"));
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
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={t("promotion.label", { title })} className="gap-1.5">
        <TrendingUp className="size-4" aria-hidden="true" />
        {t("promotion.button")}
      </Button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={t("promotion.title")}
        description={t("promotion.description", { title })}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>{t("promotion.cancel")}</Button>
            <Button size="sm" onClick={submit} loading={pending}>{t("promotion.submit")}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            name="days"
            label={t("promotion.duration")}
            value={days}
            onChange={(event) => setDays(event.currentTarget.value)}
            options={PROMOTION_DURATIONS_DAYS.map((value) => ({ value: String(value), label: t("promotion.days", { count: value }) }))}
          />
          <Textarea
            name="message"
            label={t("promotion.messageLabel")}
            rows={3}
            maxLength={VIP_DECISION_NOTE_MAX}
            value={message}
            onChange={(event) => {
              setMessage(event.currentTarget.value);
              setError(null);
            }}
            error={error ?? undefined}
          />
          <p className="text-xs text-ink-muted">{t("promotion.free")}</p>
        </div>
      </Modal>
    </>
  );
}
