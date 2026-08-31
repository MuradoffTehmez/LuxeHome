import { Skeleton, TableSkeleton } from "@/components/ui/states";
import { getAdminT } from "@/lib/admin-i18n";

export default async function PartnersAdminLoading() {
  const t = await getAdminT();

  return (
    <div role="status" aria-label={t("pages.partners.terefdaslarYuklenir")} aria-busy="true">
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <div className="mt-6"><TableSkeleton rows={7} /></div>
      <span className="sr-only">{t("pages.partners.terefdaslarYuklenir2")}</span>
    </div>
  );
}
