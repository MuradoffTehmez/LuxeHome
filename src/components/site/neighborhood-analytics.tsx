"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Container, Section } from "@/components/ui/container";
import type { Locale } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export type NeighborhoodAnalyticsData = {
  description: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  averagePrice: number | null;
  medianPrice: number | null;
  averagePricePerSqm: number | null;
  annualChangePercent: number | null;
  saleRentRatio: number | null;
  averageRent: number | null;
  rentalYieldPercent: number | null;
  dataSource: string | null;
  measuredAt: Date | null;
};

/**
 * Rayon səhifəsindəki analitika bölməsi (PRD bölmə 49-50).
 *
 * Göstəricilər **uydurulmur**: `null` sahə sadəcə çıxarılır və heç bir göstərici
 * qalmayanda bölmə ümumiyyətlə render olunmur. Mənbə və ölçmə tarixi göstərilir ki,
 * rəqəmin haradan gəldiyi oxucuya aydın olsun.
 */
export function NeighborhoodAnalytics({
  name,
  profile,
  locale,
}: {
  name: string;
  profile: NeighborhoodAnalyticsData;
  locale: Locale;
}) {
  const t = useTranslations("phase2.neighborhood");
  const format = useFormatter();

  const description =
    locale === "en"
      ? profile.descriptionEn || profile.description
      : locale === "ru"
        ? profile.descriptionRu || profile.description
        : profile.description;

  const metrics: Array<[string, string]> = [];
  if (profile.averagePrice != null) metrics.push([t("averagePrice"), formatPrice(profile.averagePrice)]);
  if (profile.medianPrice != null) metrics.push([t("medianPrice"), formatPrice(profile.medianPrice)]);
  if (profile.averagePricePerSqm != null) {
    metrics.push([t("pricePerSqm"), `${formatPrice(profile.averagePricePerSqm)}/m²`]);
  }
  if (profile.annualChangePercent != null) {
    metrics.push([
      t("annualChange"),
      `${profile.annualChangePercent > 0 ? "+" : ""}${profile.annualChangePercent}%`,
    ]);
  }
  if (profile.saleRentRatio != null) metrics.push([t("saleRentRatio"), `${profile.saleRentRatio}`]);
  if (profile.averageRent != null) metrics.push([t("averageRent"), formatPrice(profile.averageRent)]);
  if (profile.rentalYieldPercent != null) {
    metrics.push([t("rentalYield"), `${profile.rentalYieldPercent}%`]);
  }

  if (metrics.length === 0 && !description) return null;

  return (
    <Section tone="paper" spacing="cozy" aria-labelledby="neighborhood-analytics-title">
      <Container>
        <h2 id="neighborhood-analytics-title" className="font-display text-3xl text-ink">
          {name} — {t("title")}
        </h2>

        {description && <p className="mt-5 max-w-3xl leading-relaxed text-ink-soft">{description}</p>}

        {metrics.length > 0 && (
          <dl className="mt-7 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 bg-paper px-5 py-4">
                <dt className="text-xs tracking-wide text-ink-muted uppercase">{label}</dt>
                <dd className="font-display text-xl text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {(profile.dataSource || profile.measuredAt) && (
          <p className="mt-4 text-xs text-ink-muted">
            {profile.dataSource ? `${t("source")}: ${profile.dataSource}` : ""}
            {profile.dataSource && profile.measuredAt ? " · " : ""}
            {profile.measuredAt
              ? `${t("measuredAt")}: ${format.dateTime(profile.measuredAt, { dateStyle: "medium" })}`
              : ""}
          </p>
        )}
      </Container>
    </Section>
  );
}
