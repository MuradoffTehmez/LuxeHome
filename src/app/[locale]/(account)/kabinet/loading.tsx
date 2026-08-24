import { Skeleton, TableSkeleton } from "@/components/ui/states";
import { getTranslations } from "next-intl/server";

export default async function CabinetLoading() {
  const t = await getTranslations("auth.cabinet");
  return (
    <div role="status" aria-label={t("loading")} aria-busy="true" className="min-w-0">
      <Skeleton className="h-9 w-full max-w-xs" />
      <Skeleton className="mt-3 h-5 w-full max-w-lg" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-md" />
        ))}
      </div>
      <div className="mt-6"><TableSkeleton rows={4} /></div>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
