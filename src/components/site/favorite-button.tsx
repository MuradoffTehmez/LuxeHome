"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorite } from "@/lib/favorites";
import { trackEvent } from "@/lib/client-analytics";

type FavoriteButtonProps = {
  propertyId: string;
  /** `overlay` — şəkil üzərində, `inline` — mətn sırasında. */
  variant?: "overlay" | "inline";
  className?: string;
};

export function FavoriteButton({
  propertyId,
  variant = "overlay",
  className,
}: FavoriteButtonProps) {
  const { isFavorite, ready, toggle } = useFavorite(propertyId);

  const label = isFavorite ? "Favoritlərdən çıxar" : "Favoritlərə əlavə et";
  const handleToggle = () => {
    trackEvent(isFavorite ? "favorite_remove" : "favorite_add", { property_id: propertyId });
    toggle();
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={ready ? isFavorite : undefined}
        className={cn(
          "inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xs border px-4 text-sm font-medium",
          "transition-colors duration-200",
          isFavorite
            ? "border-gold bg-gold/10 text-gold-deep"
            : "border-line-strong text-ink hover:border-gold hover:text-gold-deep",
          className,
        )}
      >
        <Heart
          className={cn("size-4", isFavorite && "fill-current")}
          aria-hidden="true"
        />
        {isFavorite ? "Favoritlərdədir" : "Favoritlərə əlavə et"}
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
      aria-pressed={ready ? isFavorite : undefined}
      className={cn(
        // size-11 = 44px — minimum toxunma hədəfi (Apple HIG / WCAG 2.5.5)
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-full",
        "bg-charcoal/45 text-white backdrop-blur-sm transition-colors duration-200",
        "hover:bg-charcoal/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        isFavorite && "text-gold-soft",
        className,
      )}
    >
      <Heart
        className={cn("size-[18px]", isFavorite && "fill-current")}
        aria-hidden="true"
      />
    </button>
  );
}
