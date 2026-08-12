import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "dark"
  | "onDark"
  | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Champagne gold — səhifədə yalnız bir əsas CTA
  primary:
    "bg-gold text-ink hover:bg-gold-soft active:bg-gold-deep active:text-paper border border-transparent",
  secondary:
    "bg-charcoal text-ink-invert hover:bg-charcoal-soft border border-transparent",
  outline:
    "bg-transparent text-ink border border-line-strong hover:border-gold hover:text-gold-deep",
  ghost: "bg-transparent text-ink-soft hover:bg-beige hover:text-ink border border-transparent",
  dark: "bg-navy text-ink-invert hover:bg-navy-soft border border-transparent",
  // Tünd fon üzərində ikincili düymə
  onDark:
    "bg-transparent text-white border border-white/25 hover:border-gold-soft hover:text-gold-soft",
  danger: "bg-danger text-paper hover:opacity-90 border border-transparent",
};

const SIZES: Record<Size, string> = {
  // Bütün ölçülər ən azı 44px hündürlükdə — toxunma hədəfi tələbi
  sm: "min-h-11 px-4 text-sm gap-1.5",
  md: "min-h-12 px-6 text-sm gap-2",
  lg: "min-h-14 px-8 text-base gap-2.5",
};

const BASE =
  "inline-flex items-center justify-center rounded-xs font-medium tracking-wide whitespace-nowrap " +
  "transition-colors duration-200 cursor-pointer select-none " +
  "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps & { loading?: boolean } & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "className"
  >;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, "children" | "className">;

/** Naviqasiya üçün — vizual olaraq Button ilə eynidir, semantik olaraq linkdir. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Xarici linklər (WhatsApp, telefon, Instagram) üçün. */
export function ButtonAnchor({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: CommonProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className">) {
  return (
    <a
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {children}
    </a>
  );
}

/**
 * Yalnız ikondan ibarət düymə.
 * `label` mütləqdir — ekran oxuyucular üçün.
 */
export function IconButton({
  label,
  className,
  children,
  variant = "ghost",
  ...props
}: Omit<ButtonProps, "size" | "children"> & {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        BASE,
        VARIANTS[variant],
        "size-11 shrink-0 rounded-xs p-0",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
