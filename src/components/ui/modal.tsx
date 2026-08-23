"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Overlay } from "./overlay";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
};

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  full: "max-w-[min(96rem,95vw)]",
} as const;

/** Modal public API-sini ortaq overlay lifecycle-ı üzərində saxlayan adapter. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  return (
    <Overlay
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      placement="bottom"
      footer={footer}
      className={cn(
        "sm:m-auto sm:max-h-[92dvh] sm:rounded-md sm:pb-0",
        SIZES[size],
        className,
      )}
    >
      {children}
    </Overlay>
  );
}

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
};

/** Geri qaytarıla bilməyən əməliyyatlar üçün təsdiq dialoqu. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Təsdiq et",
  cancelLabel = "Ləğv et",
  loading = false,
  destructive = true,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-soft">{description}</p>
    </Modal>
  );
}
