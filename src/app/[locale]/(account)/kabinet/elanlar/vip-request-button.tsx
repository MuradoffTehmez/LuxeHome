"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { VIP_DECISION_NOTE_MAX, VIP_DURATIONS_DAYS } from "@/lib/constants";
import { requestVipAction } from "./vip-actions";

/** «VIP et» (#248, PRD 14.3): tanıtım mərhələsində ödənişsiz sorğu — administrator təsdiqləyir. */
export function VipRequestButton({ propertyId, title }: { propertyId: string; title: string }) {
  const t = useTranslations("account.listings");
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState("30");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const result = await requestVipAction(propertyId, Number(days), message.trim());
      if (result.status !== "success") {
        setError(result.message ?? t("vip.errors.failed"));
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
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={t("vip.label", { title })} className="gap-1.5">
        <Crown className="size-4" aria-hidden="true" />
        {t("vip.button")}
      </Button>
      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title={t("vip.title")}
        description={t("vip.description", { title })}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>{t("vip.cancel")}</Button>
            <Button size="sm" onClick={submit} loading={pending}>{t("vip.submit")}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            name="days"
            label={t("vip.duration")}
            value={days}
            onChange={(event) => setDays(event.currentTarget.value)}
            options={VIP_DURATIONS_DAYS.map((value) => ({ value: String(value), label: t("vip.days", { count: value }) }))}
          />
          <Textarea
            name="message"
            label={t("vip.messageLabel")}
            rows={3}
            maxLength={VIP_DECISION_NOTE_MAX}
            value={message}
            onChange={(event) => {
              setMessage(event.currentTarget.value);
              setError(null);
            }}
            error={error ?? undefined}
          />
          <p className="text-xs text-ink-muted">{t("vip.free")}</p>
        </div>
      </Modal>
    </>
  );
}
