"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { SAVED_SEARCH_FREQUENCIES } from "@/lib/constants";
import type { PropertyFilters } from "@/lib/queries";
import { createSavedSearch } from "@/app/[locale]/(account)/kabinet/axtarislarim/actions";
import { trackEvent } from "@/lib/client-analytics";

export type SavableFilters = Omit<PropertyFilters, "sort" | "page" | "pageSize">;

/**
 * `/emlaklar` axtarış nəticələrində göstərilən "Axtarışı saxla" düyməsi.
 *
 * Yalnız giriş edilmiş, qeyri-əməkdaş hesab üçün render olunmalıdır — bu şərt
 * çağıran server komponentində (`emlaklar/page.tsx`) yoxlanılır.
 */
export function SaveSearchButton({ filters }: { filters: SavableFilters }) {
  const t = useTranslations("listings.search");
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createSavedSearch, IDLE_STATE);
  const { toast } = useToast();

  useEffect(() => {
    if (state.status === "success") {
      toast(state.message ?? "", "success");
      trackEvent("saved_search", { status: "success" });
      setOpen(false);
    }
  }, [state, toast]);

  const frequencyOptions = [
    { value: SAVED_SEARCH_FREQUENCIES.IMMEDIATE, label: t("saveSearchFrequencyImmediate") },
    { value: SAVED_SEARCH_FREQUENCIES.DAILY, label: t("saveSearchFrequencyDaily") },
    { value: SAVED_SEARCH_FREQUENCIES.WEEKLY, label: t("saveSearchFrequencyWeekly") },
    { value: SAVED_SEARCH_FREQUENCIES.OFF, label: t("saveSearchFrequencyOff") },
  ];

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Bookmark className="size-4" aria-hidden="true" />
        {t("saveSearch")}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={t("saveSearch")} size="sm">
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="filters" value={JSON.stringify(filters)} />
          {state.status === "error" && state.message && (
            <p role="alert" className="rounded-xs border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
              {state.message}
            </p>
          )}
          <Input
            name="name"
            label={t("saveSearchName")}
            required
            maxLength={120}
            error={state.fieldErrors?.name}
          />
          <Select
            name="frequency"
            label={t("saveSearchFrequency")}
            defaultValue={SAVED_SEARCH_FREQUENCIES.DAILY}
            options={frequencyOptions}
          />
          <Button type="submit" variant="primary" loading={pending} className="mt-2">
            {t("saveSearchSubmit")}
          </Button>
        </form>
      </Modal>
    </>
  );
}
