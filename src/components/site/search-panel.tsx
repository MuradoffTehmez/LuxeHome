"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/client-analytics";
import {
  PropertyFilterFields,
  type CityOption,
  type FeatureOption,
  type SearchPanelInitial,
  type TypeOption,
} from "./property-filter-fields";

export type { CityOption, FeatureOption, SearchPanelInitial, TypeOption } from "./property-filter-fields";

type SearchPanelProps = {
  types: TypeOption[];
  cities: CityOption[];
  features?: FeatureOption[];
  initial?: SearchPanelInitial;
  variant?: "hero" | "page";
  className?: string;
};

/** Hero compact axtarışı və desktop tam filter paneli üçün native GET shell-i. */
export function SearchPanel({
  types,
  cities,
  features = [],
  initial = {},
  variant = "hero",
  className,
}: SearchPanelProps) {
  const t = useTranslations("listings.search");
  const isPage = variant === "page";

  return (
    <div
      className={cn(
        "rounded-sm border p-4 backdrop-blur-md sm:p-5",
        isPage
          ? "hidden border-line bg-paper shadow-sm lg:block"
          : "border-white/20 bg-paper/94 shadow-editorial",
        className,
      )}
    >
      <form action="/emlaklar" method="get" className="flex flex-col gap-5" onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const filterCount = Array.from(data.entries()).filter(([, value]) => String(value).trim()).length;
        trackEvent("filter_submit", { filter_count: filterCount, placement: variant });
      }}>
        <PropertyFilterFields
          types={types}
          cities={cities}
          features={features}
          initial={initial}
          mode={isPage ? "full" : "compact"}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {isPage ? (
            <Link
              href="/emlaklar"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xs px-3 text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {t("reset")}
            </Link>
          ) : null}
          <Button type="submit" size="md" className="sm:min-w-40">
            <Search className="size-4" aria-hidden="true" />
            {t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
