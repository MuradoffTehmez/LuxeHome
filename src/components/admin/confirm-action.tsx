"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/admin/action-state";

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
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function run() {
    startTransition(async () => {
      const result = await action(id);
      if (result.message) toast(result.message, result.status === "success" ? "success" : "error");
      if (result.status !== "success") return;
      setOpen(false);
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
          "grid size-9 cursor-pointer place-items-center rounded-xs transition-colors",
          tone === "danger"
            ? "text-ink-muted hover:bg-danger-bg hover:text-danger"
            : "text-ink-muted hover:bg-beige hover:text-ink",
          className,
        )}
      >
        {children}
      </button>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={run}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        loading={pending}
        destructive={tone === "danger"}
      />
    </>
  );
}
