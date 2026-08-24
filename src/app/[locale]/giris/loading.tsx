import { AuthShell } from "@/components/auth/auth-shell";
import { Skeleton } from "@/components/ui/states";
import { getTranslations } from "next-intl/server";

export default async function StaffAuthLoading() {
  const t = await getTranslations("auth.staffLogin");
  return (
    <AuthShell standalone eyebrow={t("eyebrow")} title={t("loadingTitle")}>
      <div role="status" aria-label={t("loading")} aria-busy="true" className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <span className="sr-only">{t("loading")}</span>
      </div>
    </AuthShell>
  );
}
