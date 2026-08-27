import { getTranslations } from "next-intl/server";
import { Container, Section } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/states";

/**
 * Tərəfdaş siyahısının skeleton-u.
 *
 * Ölçülər real kartla eynidir (loqo zolağı, başlıq, nişan, üç sətir mətn),
 * ona görə məzmun gələndə düzülüş sıçramır — CLS yaranmır.
 */
export default async function PartnersLoading() {
  const t = await getTranslations("common.ui");

  return (
    <div role="status" aria-label={t("contentLoading")} aria-busy="true">
      <header className="border-b border-line bg-[var(--surface-page)] py-7 sm:py-9">
        <Container>
          <Skeleton className="mb-4 h-4 w-28" />
          <Skeleton className="h-10 w-full max-w-md sm:h-12" />
          <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        </Container>
      </header>

      <Section tone="ivory" spacing="cozy">
        <Container size="wide">
          <Skeleton className="h-5 w-full max-w-3xl" />

          <div className="mt-8 flex flex-wrap gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-11 w-28" />
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="rounded-md border border-line bg-paper p-5 sm:p-6">
                <Skeleton className="h-11 w-40" />
                <Skeleton className="mt-4 h-6 w-3/5" />
                <Skeleton className="mt-3 h-6 w-32" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-11/12" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <div className="mt-5 border-t border-line pt-4">
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <span className="sr-only">{t("contentLoading")}</span>
    </div>
  );
}
