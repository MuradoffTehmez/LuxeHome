import { cn } from "@/lib/utils";

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: "narrow" | "default" | "wide";
  as?: "div" | "section" | "header" | "footer" | "main" | "nav";
};

const SIZES = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-[90rem]",
} as const;

/**
 * Səhifə boyu eyni yan boşluqları təmin edir.
 * Gutter breakpoint-lərə görə artır (mobil 20px → desktop 40px).
 */
export function Container({
  size = "default",
  as: Tag = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full px-5 sm:px-6 lg:px-10", SIZES[size], className)}
      {...props}
    />
  );
}

const SECTION_TONES = {
  ivory: "bg-ivory text-ink",
  paper: "bg-paper text-ink",
  beige: "bg-beige text-ink",
  dark: "bg-charcoal text-ink-invert on-dark",
  navy: "bg-navy text-ink-invert on-dark",
} as const;

/**
 * Şaquli boşluq pilləkəni.
 *
 * Bunun `spacing` propu ilə verilməsi vacibdir: əvvəllər boşluq `className` ilə
 * (`py-10 sm:py-12`) əvəzlənirdi, lakin bazadakı `lg:py-24` qüvvədə qalırdı və
 * desktopda bütün override-lar səssizcə işləmirdi. Prop variantı bu konflikti
 * tamamilə aradan qaldırır.
 */
const SECTION_SPACING = {
  default: "py-16 sm:py-20 lg:py-24",
  cozy: "py-12 sm:py-16 lg:py-20",
  compact: "py-10 sm:py-12 lg:py-14",
  /** Boşluq `className` ilə tam əl ilə verilir. */
  none: "",
} as const;

/** Bölmələr arasında vahid şaquli ritm. */
export function Section({
  className,
  tone = "ivory",
  spacing = "default",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  tone?: keyof typeof SECTION_TONES;
  spacing?: keyof typeof SECTION_SPACING;
}) {
  return (
    <section
      className={cn(SECTION_SPACING[spacing], SECTION_TONES[tone], className)}
      {...props}
    />
  );
}
