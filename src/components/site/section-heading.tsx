import { cn } from "@/lib/utils";

/**
 * Bölmə başlığı: kiçik üst yazı, başlıq və izah. Başlıq ilə izah arasında,
 * həmçinin başlıq blokundan məzmuna qədər sabit boşluq saxlanılır ki, bölmələr
 * bir-birinin içinə keçmiş kimi görünməsin.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Sağda (dar ekranda altda) göstərilən keçid və ya say. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="editorial-kicker mb-3 flex items-center gap-3 text-gold-deep">
            <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-balance font-display text-2xl leading-tight text-ink sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-[60ch] text-base leading-7 text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 text-sm text-ink-muted">{action}</div> : null}
    </div>
  );
}
