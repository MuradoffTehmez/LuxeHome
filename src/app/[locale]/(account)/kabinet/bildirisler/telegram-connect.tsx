"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { TelegramChannelState } from "./category-preferences";
import { disconnectTelegram, startTelegramLink } from "./telegram-actions";

/**
 * Telegram bildirişləri: hesabı bota bağlamaq. Link birdəfəlikdir və 15 dəqiqə yaşayır — istifadəçi
 * Telegram-da «Start» basandan sonra «Yoxla» səhifəni yeniləyir və kanal aktivləşir.
 */
export function TelegramConnect({ state }: { state: TelegramChannelState }) {
  const t = useTranslations("account.notifications.telegram");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  function connect() {
    startTransition(async () => {
      const result = await startTelegramLink();
      if (result.status === "success" && result.link) {
        setLink(result.link);
        window.open(result.link, "_blank", "noopener,noreferrer");
      } else if (result.message) {
        toast(result.message, "error");
      }
    });
  }

  function disconnect() {
    startTransition(async () => {
      const result = await disconnectTelegram();
      if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-deep">
          {state === "linked" ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
        </span>
        <div className="min-w-0">
          <h2 className="font-medium text-ink">{t("title")}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{t(state === "linked" ? "linkedDescription" : state === "unlinked" ? "description" : "unavailableDescription")}</p>
          {link && state !== "linked" && (
            <p className="mt-2 text-sm text-ink-soft">
              {t("openHint")}{" "}
              <a href={link} target="_blank" rel="noopener noreferrer" className="font-medium text-gold-deep underline-offset-4 hover:underline">
                {t("openLink")}
              </a>
            </p>
          )}
        </div>
      </div>
      {state === "linked" ? (
        <Button type="button" variant="outline" size="sm" onClick={disconnect} loading={pending}>{t("disconnect")}</Button>
      ) : state === "unlinked" ? (
        <div className="flex flex-wrap gap-2">
          {link && <Button type="button" variant="ghost" size="sm" onClick={() => router.refresh()}>{t("check")}</Button>}
          <Button type="button" size="sm" onClick={connect} loading={pending}>{t("connect")}</Button>
        </div>
      ) : (
        <Button type="button" size="sm" disabled>{t("soon")}</Button>
      )}
    </section>
  );
}
