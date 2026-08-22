"use client";

import { GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompareItem } from "@/lib/compare";
import { useToast } from "@/components/ui/toast";
import { MAX_COMPARE } from "@/lib/compare";

type CompareButtonProps = {
  propertyId: string;
  /** `overlay` — şəkil üzərində, `inline` — mətn sırasında. */
  variant?: "overlay" | "inline";
  className?: string;
};

export function CompareButton({
  propertyId,
  variant = "overlay",
  className,
}: CompareButtonProps) {
  const { isComparing, ready, atLimit, toggle } = useCompareItem(propertyId);
  const { toast } = useToast();

  const label = isComparing ? "Müqayisədən çıxar" : "Müqayisəyə əlavə et";

  function handleToggle() {
    if (atLimit) {
      toast(`Ən çox ${MAX_COMPARE} əmlakı müqayisə edə bilərsiniz.`, "error");
      return;
    }
    toggle();
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={ready ? isComparing : undefined}
        className={cn(
          "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xs border px-4 text-sm font-medium",
          "transition-colors duration-200",
          isComparing
            ? "border-gold bg-gold/10 text-gold-deep"
            : "border-line-strong text-ink hover:border-gold hover:text-gold-deep",
          className,
        )}
      >
        <GitCompareArrows className="size-4" aria-hidden="true" />
        {isComparing ? "Müqayisədədir" : "Müqayisə et"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        // Kart tam link olduğu üçün naviqasiyanın qarşısı alınır
        event.preventDefault();
        event.stopPropagation();
        handleToggle();
      }}
      aria-label={label}
      title={label}
      aria-pressed={ready ? isComparing : undefined}
      className={cn(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-full",
        "bg-charcoal/45 text-white backdrop-blur-sm transition-colors duration-200",
        "hover:bg-charcoal/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        isComparing && "text-gold-soft",
        className,
      )}
    >
      <GitCompareArrows className="size-4.5" aria-hidden="true" />
    </button>
  );
}
