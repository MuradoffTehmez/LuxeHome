import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "gold" | "dark" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-beige text-ink-soft border-line-strong",
  success: "bg-success-bg text-success border-success/25",
  warning: "bg-warning-bg text-warning border-warning/25",
  danger: "bg-danger-bg text-danger border-danger/25",
  info: "bg-info-bg text-info border-info/25",
  // `text-ink` yox: o, tünd rejimdə açığa dönür və qızıl fonda kontrast itir.
  gold: "bg-gold text-on-gold border-transparent",
  dark: "bg-charcoal text-ink-invert border-transparent",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xs border px-2.5 py-1",
        "text-xs font-medium tracking-wide whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
