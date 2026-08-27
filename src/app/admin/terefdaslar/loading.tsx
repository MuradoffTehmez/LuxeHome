import { Skeleton, TableSkeleton } from "@/components/ui/states";

export default function PartnersAdminLoading() {
  return (
    <div role="status" aria-label="Tərəfdaşlar yüklənir" aria-busy="true">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <div className="mt-6"><TableSkeleton rows={7} /></div>
      <span className="sr-only">Tərəfdaşlar yüklənir…</span>
    </div>
  );
}
