import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

type LogoProps = {
  tone?: "light" | "dark";
  className?: string;
  /** Alt yazını gizlədir — dar yerlərdə istifadə olunur. */
  compact?: boolean;
  /** Gerb nişanını gizlədir — yalnız wordmark göstərilir. */
  markless?: boolean;
};

/**
 * LUXE HOME ESTATE kimliyi: şirkət gerbi + wordmark.
 *
 * Gerb `public/logo-mark.png` faylından gəlir — orijinal loqodan kəsilmiş,
 * fonu şəffaflaşdırılmış variant (bax: scripts/prepare-logo.mjs). Şəffaf olduğu
 * üçün eyni fayl həm açıq, həm tünd fonda işləyir.
 * Wordmark mətn kimi verilir ki, hər ölçüdə kəskin qalsın və ekran
 * oxuyucular üçün oxunaqlı olsun.
 */
export function Logo({
  tone = "light",
  className,
  compact = false,
  markless = false,
}: LogoProps) {
  const isDark = tone === "dark";

  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} — ana səhifə`}
      className={cn("group inline-flex items-center gap-3", className)}
    >
      {!markless && (
        <Image
          src="/logo-mark.png"
          alt=""
          width={512}
          height={512}
          priority
          className="size-10 shrink-0 sm:size-11"
        />
      )}

      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-[0.18em] transition-colors duration-200 sm:text-xl",
            isDark
              ? "text-white group-hover:text-gold-soft"
              : "text-ink group-hover:text-gold-deep",
          )}
        >
          LUXE HOME ESTATE
        </span>

        {!compact && (
          <span className="mt-1.5 flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn("h-px w-4", isDark ? "bg-gold-soft" : "bg-gold")}
            />
            <span
              className={cn(
                "text-[0.58rem] font-medium tracking-[0.22em] uppercase",
                isDark ? "text-ink-invert-soft" : "text-ink-muted",
              )}
            >
              Daşınmaz Əmlak
            </span>
          </span>
        )}
      </span>
    </Link>
  );
}
