import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/states";

/** Tərəfdaş profilinin skeleton-u — hero, əlaqə zolağı və mətn bloku. */
export default async function PartnerDetailLoading() {
  const t = await getTranslations("common.ui");

  return (
    <div role="status" aria-label={t("detailLoading")} aria-busy="true">
      <header className="border-b border-line bg-[var(--surface-page)] py-7 sm:py-9">
        <Container>
          <Skeleton className="mb-4 h-4 w-48" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-10 w-full max-w-md" />
              <Skeleton className="mt-4 h-5 w-full max-w-xl" />
            </div>
            <Skeleton className="h-14 w-60 shrink-0" />
          </div>
        </Container>
      </header>

      <Section tone="ivory" spacing="compact" className="border-b border-line">
        <Container>
          <div className="rounded-md border border-line bg-paper p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-7 w-28" />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-11 w-44" />
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="paper" spacing="cozy">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="mt-5 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-11/12" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </Container>
      </Section>

      <span className="sr-only">{t("detailLoading")}</span>
    </div>
  );
}
