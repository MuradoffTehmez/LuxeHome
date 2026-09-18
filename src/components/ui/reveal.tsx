import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  /** Ardıcıl elementlərdə pilləli görünmə üçün gecikmə (ms). */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li";
};

/**
 * Kontenti client-side observer və React state olmadan render edir. Dəstəkləyən
 * brauzerlərdə giriş effekti CSS view timeline ilə işləyir; digərlərində kontent
 * dərhal görünür. Beləliklə çoxkartlı səhifələr onlarla hydration sərhədi yaratmır.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: RevealProps) {
  return (
    <Tag
      data-reveal=""
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
