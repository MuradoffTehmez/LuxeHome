"use client";

import { cn } from "@/lib/utils";
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
