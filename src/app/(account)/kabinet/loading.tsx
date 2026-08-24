import { Skeleton, TableSkeleton } from "@/components/ui/states";

export default function CabinetLoading() {
  return (
    <div role="status" aria-label="Kabinet yüklənir" aria-busy="true" className="min-w-0">
      <Skeleton className="h-9 w-full max-w-xs" />
      <Skeleton className="mt-3 h-5 w-full max-w-lg" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-md" />
        ))}
      </div>
      <div className="mt-6"><TableSkeleton rows={4} /></div>
      <span className="sr-only">Kabinet yüklənir…</span>
    </div>
  );
}
