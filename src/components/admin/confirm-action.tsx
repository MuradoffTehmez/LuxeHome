"use client";

import { useTranslations } from "next-intl";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/admin/action-state";
import { SecretPanel } from "./secret-panel";

type ConfirmActionProps = {
  /** Təsdiqdən sonra çağırılan server action. */
  action: (id: string) => Promise<ActionState>;
  id: string;
  title: string;
  description: string;
  confirmLabel?: string;
  /** Düymənin görünüşü — ikon və ya mətn. */
  children: React.ReactNode;
  label: string;
  className?: string;
  tone?: "danger" | "neutral";
  /** Uğurdan sonra keçilən ünvan; verilməzsə cari səhifə yenilənir. */
  redirectTo?: string;
};

/**
 * Geri qaytarıla bilməyən əməliyyatlar üçün təsdiq dialoqu ilə işləyən düymə.
 *
 * Brauzerin `confirm()` dialoqu qəsdən istifadə olunmur: fokus idarəsi yoxdur və
 * dizayn sisteminə uyğun gəlmir.
 *
 * Action bir dəfəlik dəyər qaytararsa (müvəqqəti parol), dialoq **bağlanmır** —
 * dəyər panelə çıxarılır və istifadəçi onu köçürəndən sonra özü bağlayır. Əvvəllər
 * belə nəticə yalnız toast ilə gəlirdi və 4 saniyəyə itirdi.
 */
export function ConfirmAction({
  action,
  id,
  title,
  description,
  confirmLabel = "Sil",
  children,
  label,
  className,
  tone = "danger",
  redirectTo,
}: ConfirmActionProps) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function close() {
    setOpen(false);
    setSecret(null);
  }

  function run() {
    startTransition(async () => {
      const result = await action(id);
      if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
      if (result.status !== "success") return;

      if (result.secret) {
        // Nəticə ekranda qalır; siyahı fonda yenilənir
        setSecret(result.secret);
        router.refresh();
        return;
      }

      close();
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
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
          "grid size-11 cursor-pointer place-items-center rounded-xs transition-colors",
          tone === "danger"
            ? "text-ink-muted hover:bg-danger-bg hover:text-danger"
            : "text-ink-muted hover:bg-beige hover:text-ink",
          className,
        )}
      >
        {children}
      </button>

      <Modal
        open={open}
        onClose={close}
        title={secret ? t("components.confirm.done") : title}
        description={secret ? undefined : description}
        size="sm"
        footer={
          secret ? (
            <Button variant="primary" size="sm" onClick={close}>
              {t("actions.close")}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={close} disabled={pending}>
                {t("actions.cancel")}
              </Button>
              <Button
                variant={tone === "danger" ? "danger" : "primary"}
                size="sm"
                onClick={run}
                loading={pending}
              >
                {confirmLabel}
              </Button>
            </>
          )
        }
      >
        {secret ? <SecretPanel secret={secret} /> : <p className="text-sm text-ink-soft">{description}</p>}
      </Modal>
    </>
  );
}
