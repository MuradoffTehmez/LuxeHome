import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "./button";

type SectionHeaderProps = {
  /** Başlıq üstündə göstərilən kiçik etiket (eyebrow). */
  overline?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  action?: { label: string; href: string };
  className?: string;
  /** Sıralamada düzgün başlıq səviyyəsi üçün. */
  as?: "h1" | "h2" | "h3";
};

export function SectionHeader({
  overline,
  title,
  description,
  align = "left",
  tone = "light",
  action,
  className,
  as: Heading = "h2",
}: SectionHeaderProps) {
  const isDark = tone === "dark";
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
        isCentered && "sm:flex-col sm:items-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex max-w-2xl flex-col gap-3",
          isCentered && "items-center text-center",
        )}
      >
        {overline && (
          <span
            className={cn(
              "editorial-kicker flex items-center gap-3",
              isDark ? "text-gold-soft" : "text-gold-deep",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("h-px w-8", isDark ? "bg-gold-soft/50" : "bg-gold/60")}
            />
            {overline}
          </span>
        )}

        <Heading
          className={cn(
            "max-w-3xl font-display text-[clamp(2.25rem,4vw,4.5rem)] leading-[0.98] tracking-[-0.035em]",
            isDark ? "text-ink-invert" : "text-ink",
          )}
        >
          {title}
        </Heading>

        {description && (
          <p
            className={cn(
              "text-base leading-relaxed",
              isDark ? "text-ink-invert-soft" : "text-ink-soft",
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className={buttonClassName("ghost", "sm", false, cn(
            "group/action shrink-0 border-b px-0",
            isDark
              ? "border-white/30 text-ink-invert hover:border-gold-soft hover:bg-transparent hover:text-gold-soft"
              : "border-line-strong text-ink hover:border-gold-deep hover:bg-transparent hover:text-gold-deep",
          ))}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
