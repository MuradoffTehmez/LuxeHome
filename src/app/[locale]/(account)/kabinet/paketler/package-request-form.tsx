"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { IDLE_STATE } from "@/lib/admin/action-state";
import { formatMoneyMinor } from "@/lib/package-math";
import { cn } from "@/lib/utils";
import { requestPackage } from "./actions";

type PackageOption = { id: string; name: string; description: string | null; durationDays: number; priceMinor: number };

/** Elan + paket seçimi (#109). Ödəniş burada alınmır — sifariş menecerə düşür. */
export function PackageRequestForm({
  packages,
  properties,
  initialPropertyId,
}: {
  packages: PackageOption[];
  properties: { id: string; title: string }[];
  initialPropertyId: string | null;
}) {
  const t = useTranslations("account.packages");
  const [state, action, pending] = useActionState(requestPackage, IDLE_STATE);
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const { toast } = useToast();
  useEffect(() => {
    if (state.message) toast(state.message, state.status === "success" ? "success" : "error");
  }, [state, toast]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Select
        name="propertyId"
        label={t("listing")}
        required
        defaultValue={initialPropertyId ?? undefined}
        placeholder={t("chooseListing")}
        options={properties.map((property) => ({ value: property.id, label: property.title }))}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">{t("package")}</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {packages.map((pkg) => {
            const selected = pkg.id === packageId;
            return (
              <label
                key={pkg.id}
                className={cn(
                  "flex min-h-11 cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold",
                  selected ? "border-gold bg-gold/10" : "border-line-strong bg-paper hover:border-gold",
                )}
              >
                <input type="radio" name="packageId" value={pkg.id} checked={selected} onChange={() => setPackageId(pkg.id)} className="sr-only" />
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-ink">{pkg.name}</span>
                  <span className="tabular shrink-0 font-semibold text-gold-deep">{formatMoneyMinor(pkg.priceMinor)}</span>
                </span>
                <span className="text-sm text-ink-soft">{t("days", { days: pkg.durationDays })}</span>
                {pkg.description ? <span className="text-sm text-ink-muted">{pkg.description}</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>
      <Button type="submit" loading={pending} className="w-full sm:w-fit">
        <Crown className="size-4" aria-hidden="true" />
        {t("submit")}
      </Button>
    </form>
  );
}
