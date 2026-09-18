"use client";

import type { ComponentPropsWithoutRef } from "react";
import { trackEvent } from "@/lib/client-analytics";

type TrackedPropertySearchFormProps = ComponentPropsWithoutRef<"form"> & {
  placement: "hero" | "page";
};

export function countActiveSearchFilters(data: FormData): number {
  return Array.from(data.entries()).filter(([, value]) => String(value).trim()).length;
}

/** Native GET naviqasiyasını dəyişmədən axtarış funnel telemetriyasını saxlayır. */
export function TrackedPropertySearchForm({ placement, onSubmit, ...props }: TrackedPropertySearchFormProps) {
  return (
    <form
      {...props}
      data-analytics-placement={placement}
      onSubmit={(event) => {
        onSubmit?.(event);
        if (event.defaultPrevented) return;

        trackEvent("filter_submit", {
          filter_count: countActiveSearchFilters(new FormData(event.currentTarget)),
          placement,
        });
      }}
    />
  );
}
