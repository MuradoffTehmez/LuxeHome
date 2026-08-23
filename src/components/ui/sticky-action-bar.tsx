import { cn } from "@/lib/utils";

export type StickyActionBarProps = {
  children: React.ReactNode;
  className?: string;
};

/** Mobil səhifələrdə əsas əməli əlçatan məsafədə saxlayan safe-area zolağı. */
export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <aside
      aria-label="Səhifə əməliyyatları"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-line bg-paper/95 px-4 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] shadow-[0_-12px_30px_rgba(24,29,39,0.08)] backdrop-blur lg:hidden",
        className,
      )}
    >
      {children}
    </aside>
  );
}
