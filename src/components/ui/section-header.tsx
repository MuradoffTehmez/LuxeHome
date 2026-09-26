import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
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
            "max-w-3xl font-display text-[clamp(2rem,3.2vw,3.25rem)] leading-[1.08] tracking-[-0.025em]",
            isDark ? "text-ink-invert" : "text-ink",
          )}
        >
          {title}
        </Heading>

        {description && (
          <p
            className={cn(
              "max-w-[60ch] text-base leading-relaxed sm:text-lg",
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
          className={buttonClassName(isDark ? "onDark" : "outline", "sm", false, "group/action shrink-0 self-start sm:self-end")}
        >
          {action.label}
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover/action:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}
