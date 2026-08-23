import { Skeleton, TableSkeleton } from "@/components/ui/states";

export default function AdminLoading() {
  return (
    <div role="status" aria-label="İdarə paneli yüklənir" aria-busy="true" className="min-w-0">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-md" />
        ))}
      </div>
      <div className="mt-6"><TableSkeleton rows={6} /></div>
      <span className="sr-only">İdarə paneli yüklənir…</span>
    </div>
  );
}
