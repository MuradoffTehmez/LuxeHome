import { ChartNoAxesColumn, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriceAssessment } from "@/lib/price-benchmark";

type PriceInsightProps = {
  assessment: PriceAssessment;
  labels: {
    title: string;
    verdict: string;
    basis: string;
    disclaimer: string;
  };
};

const BAND_TONE = {
  below: "bg-success-bg text-success border-success/25",
  fair: "bg-info-bg text-info border-info/25",
  above: "bg-beige text-ink-soft border-line-strong",
} as const;

/** Qiymət şkalası: median ortada, elanın mövqeyi ±30% aralığında göstərilir. */
function markerPosition(diffPercent: number): number {
  const clamped = Math.max(-30, Math.min(30, diffPercent));
  return 50 + (clamped / 30) * 45;
}

/**
 * Detal səhifəsində «bazar müqayisəsi» bloku (#105). Mətnlər server tərəfdə hazırlanır —
 * komponent yalnız təqdimatdır.
 */
export function PriceInsight({ assessment, labels }: PriceInsightProps) {
  return (
    <section className="rounded-xl border border-line bg-paper p-5 shadow-xs sm:p-7" aria-labelledby="price-insight-title">
      <h2 id="price-insight-title" className="flex items-center gap-2 font-sans text-lg font-semibold text-ink">
        <ChartNoAxesColumn className="size-5 text-gold-deep" aria-hidden="true" />
        {labels.title}
      </h2>
      <p className={cn("mt-4 inline-flex rounded-full border px-3 py-1 text-sm font-semibold", BAND_TONE[assessment.band])}>
        {labels.verdict}
      </p>

      <div className="relative mt-6 h-2 rounded-full bg-[linear-gradient(90deg,var(--color-success)_0%,var(--color-info)_50%,var(--color-line-strong)_100%)] opacity-80" aria-hidden="true">
        <span className="absolute top-1/2 left-1/2 h-4 w-px -translate-y-1/2 bg-ink-muted" />
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink shadow-sm"
          style={{ left: `${markerPosition(assessment.diffPercent)}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-ink-soft">{labels.basis}</p>
      <p className="mt-3 flex items-start gap-2 text-xs text-ink-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {labels.disclaimer}
      </p>
    </section>
  );
}
