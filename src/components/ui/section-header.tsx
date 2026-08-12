import { cn } from "@/lib/utils";
import { ButtonLink } from "./button";

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
              "flex items-center gap-3 text-xs font-medium tracking-[0.2em] uppercase",
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
            "font-display text-3xl sm:text-4xl lg:text-[2.75rem]",
            isDark ? "text-white" : "text-ink",
          )}
        >
          {title}
        </Heading>

        {description && (
          <p
            className={cn(
              "text-base leading-relaxed",
              isDark ? "text-zinc-300" : "text-ink-soft",
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <ButtonLink
          href={action.href}
          variant={isDark ? "onDark" : "outline"}
          size="sm"
          className="shrink-0"
        >
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
