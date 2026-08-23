import { cn } from "@/lib/utils";

type PublicDetailLayoutProps = {
  main: React.ReactNode;
  aside: React.ReactNode;
  className?: string;
  mainClassName?: string;
  asideClassName?: string;
};

/** Mobil məzmun sırasını qoruyan, desktopda sticky yan panel yaradan detal kompozisiyası. */
export function PublicDetailLayout({
  main,
  aside,
  className,
  mainClassName,
  asideClassName,
}: PublicDetailLayoutProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14",
        className,
      )}
    >
      <div className={cn("min-w-0", mainClassName)}>{main}</div>
      <aside className={cn("min-w-0 lg:sticky lg:top-28 lg:self-start", asideClassName)}>
        {aside}
      </aside>
    </div>
  );
}
