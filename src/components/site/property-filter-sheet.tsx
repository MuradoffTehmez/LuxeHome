"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/ui/overlay";
import {
  PropertyFilterFields,
  type CityOption,
  type FeatureOption,
  type MetroOption,
  type SearchPanelInitial,
  type TypeOption,
} from "./property-filter-fields";

export type PropertyFilterSheetProps = {
  types: TypeOption[];
  cities: CityOption[];
  metros?: MetroOption[];
  features: FeatureOption[];
  initial: SearchPanelInitial;
  resultCount: number;
  activeCount: number;
};

/** 320–1023 px üçün fullscreen, safe-area-aware əmlak filter formu. */
export function PropertyFilterSheet({
  types,
  cities,
  metros = [],
  features,
  initial,
  resultCount,
  activeCount,
}: PropertyFilterSheetProps) {
  const t = useTranslations("listings.search");
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const formId = `${generatedId}-property-filter-form`;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-xs px-2 text-sm font-semibold text-ink transition-colors hover:text-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {t("filters")}{activeCount > 0 ? ` (${activeCount})` : ""}
        <span className="hidden text-xs font-normal text-ink-muted min-[390px]:inline">
          {t("resultShort", { count: resultCount })}
        </span>
      </button>

      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title={t("filters")}
        description={t("chooseCriteria")}
        placement="bottom"
        className="h-dvh max-h-dvh rounded-none pb-0 lg:hidden"
        footer={
          <Button type="submit" form={formId} fullWidth>
            {t("showResults", { count: resultCount })}
          </Button>
        }
      >
        <form id={formId} action="/emlaklar" method="get">
          <PropertyFilterFields
            types={types}
            cities={cities}
            metros={metros}
            features={features}
            initial={initial}
            mode="full"
          />
        </form>
      </Overlay>
    </>
  );
}
