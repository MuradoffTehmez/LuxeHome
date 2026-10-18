"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { sendTelegramTest, startTelegramLink, toggleTelegramNotifications, unlinkTelegramAccount } from "./telegram-actions";

export type TelegramCardStatus = {
  linked: boolean;
  username: string | null;
  firstName: string | null;
  notificationsEnabled: boolean;
  botAccess: boolean;
  blocked: boolean;
  linkedAt: string | null;
  lastDelivery: { status: string; at: string } | null;
};

/**
 * Kabinetin Telegram bölməsi: bağlantı statusu, bağla/ayır, bildiriş razılığı, test bildirişi və son çatdırılma.
 * Bağlama deep-link ilədir: server birdəfəlik link qaytarır, istifadəçi botda «Start» seçir. Pəncərəyə qayıdanda
 * səhifə yenilənir ki, status görünsün.
 */
export function TelegramCard({ configured, status, botUrl }: { configured: boolean; status: TelegramCardStatus; botUrl: string }) {
  const t = useTranslations("account.notifications.telegram");
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  useEffect(() => {
    if (!linkUrl) return;
    const refresh = () => router.refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [linkUrl, router]);

  const report = (result: { status: string; message?: string }) => {
    if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
  };

  const link = () =>
    startTransition(async () => {
      const result = await startTelegramLink();
      if (result.status === "success" && result.url) {
        setLinkUrl(result.url);
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else report(result);
    });

  if (!configured) {
    return (
      <section className="mb-6 rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5" aria-labelledby="telegram-card-title">
        <h2 id="telegram-card-title" className="font-sans text-base font-semibold text-ink">{t("title")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("unavailable")}</p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-xl border border-line bg-paper p-4 shadow-xs sm:p-5" aria-labelledby="telegram-card-title" data-testid="telegram-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-info/15 text-info">
            <Send className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="telegram-card-title" className="font-sans text-base font-semibold text-ink">{t("title")}</h2>
            <p className="mt-0.5 text-sm text-ink-muted">{status.linked ? t("linkedDescription") : t("description")}</p>
          </div>
        </div>
        {status.linked ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmUnlink(true)} disabled={pending}>{t("unlink")}</Button>
        ) : (
          <Button type="button" size="sm" onClick={link} loading={pending}>{t("link")}</Button>
        )}
      </div>

      {!status.linked && linkUrl ? (
        <div className="mt-4 rounded-sm border border-line bg-ivory px-4 py-3 text-sm text-ink-soft" role="status">
          <p>{t("linkPending")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 font-medium text-ink hover:border-ink-muted">{t("openBot")}</a>
            <Button type="button" variant="outline" size="sm" onClick={() => router.refresh()}>{t("refresh")}</Button>
          </div>
        </div>
      ) : null}

      {status.linked ? (
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-sm border border-line px-3 py-2">
            <dt className="text-xs text-ink-muted">{t("account")}</dt>
            <dd className="mt-0.5 font-medium text-ink">{status.username ? `@${status.username}` : status.firstName ?? t("unnamed")}</dd>
            {status.linkedAt ? <dd className="text-xs text-ink-muted">{t("linkedAt", { date: status.linkedAt })}</dd> : null}
          </div>
          <div className="rounded-sm border border-line px-3 py-2">
            <dt className="text-xs text-ink-muted">{t("lastDelivery")}</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {status.lastDelivery ? t(`deliveryStatus.${status.lastDelivery.status === "SENT" ? "SENT" : status.lastDelivery.status === "BLOCKED" ? "BLOCKED" : "FAILED"}`) : t("never")}
            </dd>
            {status.lastDelivery ? <dd className="text-xs text-ink-muted">{status.lastDelivery.at}</dd> : null}
          </div>
        </dl>
      ) : null}

      {status.linked && (status.blocked || !status.botAccess) ? (
        <p className="mt-4 flex items-start gap-2 rounded-sm border border-warning/30 bg-warning-bg px-4 py-3 text-sm text-warning" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {t("blockedHint")}{" "}
            <a href={botUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">{t("openBot")}</a>
          </span>
        </p>
      ) : null}

      {status.linked ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="size-5 accent-gold"
              defaultChecked={status.notificationsEnabled}
              disabled={pending}
              onChange={(event) => {
                const enabled = event.currentTarget.checked;
                startTransition(async () => {
                  report(await toggleTelegramNotifications(enabled));
                  router.refresh();
                });
              }}
            />
            <span>
              <span className="font-medium">{t("consent")}</span>
              <span className="block text-xs text-ink-muted">{t("consentHint")}</span>
            </span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !status.notificationsEnabled || status.blocked}
            onClick={() => startTransition(async () => { report(await sendTelegramTest()); router.refresh(); })}
          >
            {t("test")}
          </Button>
        </div>
      ) : null}

      {status.linked && status.notificationsEnabled && !status.blocked ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-success"><CheckCircle2 className="size-4" aria-hidden="true" />{t("activeHint")}</p>
      ) : null}

      <Modal
        open={confirmUnlink}
        onClose={() => setConfirmUnlink(false)}
        title={t("unlinkTitle")}
        description={t("unlinkDescription")}
        size="sm"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmUnlink(false)}>{t("cancel")}</Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={pending}
              onClick={() => startTransition(async () => {
                report(await unlinkTelegramAccount());
                setConfirmUnlink(false);
                router.refresh();
              })}
            >
              {t("unlinkConfirm")}
            </Button>
          </div>
        }
      />
    </section>
  );
}
