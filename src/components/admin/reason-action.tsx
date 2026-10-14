"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/admin/action-state";
import { REJECTION_REASON_MAX, REJECTION_REASON_MIN } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useServerMessage } from "./use-server-message";

type ReasonActionProps = {
  /** Səbəblə çağırılan server action (`(id, reason)`). */
  action: (id: string, reason: string) => Promise<ActionState>;
  id: string;
  /** Düymənin `aria-label`/`title` mətni. */
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  /** Hazır səbəblər — klik mətn sahəsini doldurur, redaktor sonra dəyişə bilər. */
  presets?: string[];
  /** Səbəb məcburidir (agentlik/agent rəddi); komanda sorğusunda istəyə bağlıdır. */
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * Rədd dialoqu (#157): `ConfirmAction` kimi, amma səbəb yazdırır. Səbəb istifadəçiyə
 * kabinet bildirişi və e-poçt kimi gedir, ona görə mətn sahəsi hazır şablonlarla
 * doldurula bilər və uzunluğu serverdəki hədlə (`REJECTION_REASON_*`) eynidir.
 */
export function ReasonAction({
  action,
  id,
  label,
  title,
  description,
  confirmLabel,
  presets = [],
  required = true,
  children,
  className,
}: ReasonActionProps) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const translateMessage = useServerMessage();
  const router = useRouter();
  const presetsLabelId = useId();

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
  }

  function run() {
    const text = reason.trim();
    if ((required || text) && (text.length < REJECTION_REASON_MIN || text.length > REJECTION_REASON_MAX)) {
      setError(t("components.reason.length", { min: REJECTION_REASON_MIN, max: REJECTION_REASON_MAX }));
      return;
    }
    startTransition(async () => {
      const result = await action(id, text);
      const message = result.message ? translateMessage(result.message) ?? result.message : null;
      if (result.status !== "success") {
        setError(message ?? t("components.reason.failed"));
        return;
      }
      if (message) toast(message, "success");
      setOpen(false);
      setReason("");
      setError(null);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        className={cn(
          "grid size-11 cursor-pointer place-items-center rounded-xs text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger",
          className,
        )}
      >
        {children}
      </button>

      <Modal
        open={open}
        onClose={close}
        title={title}
        description={description}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={close} disabled={pending}>
              {t("actions.cancel")}
            </Button>
            <Button variant="danger" size="sm" onClick={run} loading={pending}>
              {confirmLabel}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {presets.length > 0 && (
            <div>
              <p id={presetsLabelId} className="mb-2 text-xs font-medium text-ink-muted">{t("components.reason.presets")}</p>
              <ul aria-labelledby={presetsLabelId} className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <li key={preset}>
                    <button
                      type="button"
                      onClick={() => {
                        setReason(preset);
                        setError(null);
                      }}
                      className={cn(
                        "min-h-9 rounded-full border px-3 text-left text-xs transition-colors",
                        reason === preset
                          ? "border-gold bg-gold/10 text-ink"
                          : "border-line text-ink-soft hover:border-gold hover:text-ink",
                      )}
                    >
                      {preset}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Textarea
            label={required ? t("components.reason.label") : t("components.reason.labelOptional")}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(null);
            }}
            rows={4}
            maxLength={REJECTION_REASON_MAX}
            required={required}
            hint={t("components.reason.hint", { count: reason.trim().length, max: REJECTION_REASON_MAX })}
            error={error ?? undefined}
          />
        </div>
      </Modal>
    </>
  );
}
