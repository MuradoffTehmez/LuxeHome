"use client";

import { useTranslations } from "next-intl";
import { AdminForm } from "@/components/admin/form-shell";
import { AdminInput } from "@/components/admin/form-fields";
import { LIFETIME_DAYS_RANGE, REMINDER_DAYS_RANGE, type ListingExpiryConfig } from "@/lib/listing-expiry-policy";
import { saveListingExpiry } from "./actions";

/** Elanın ömrü və «hələ aktualdırmı?» xatırlatması (#204, PRD 5.2). */
export function ListingExpiryForm({ config }: { config: ListingExpiryConfig }) {
  const t = useTranslations("admin");
  return (
    <AdminForm action={saveListingExpiry}>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <AdminInput
          name="lifetimeDays"
          type="number"
          inputMode="numeric"
          label={t("pages.settings.listingExpiry.lifetime")}
          hint={t("pages.settings.listingExpiry.lifetimeHint", LIFETIME_DAYS_RANGE)}
          defaultValue={config.lifetimeDays}
          min={LIFETIME_DAYS_RANGE.min}
          max={LIFETIME_DAYS_RANGE.max}
          required
        />
        <AdminInput
          name="reminderDays"
          type="number"
          inputMode="numeric"
          label={t("pages.settings.listingExpiry.reminder")}
          hint={t("pages.settings.listingExpiry.reminderHint", REMINDER_DAYS_RANGE)}
          defaultValue={config.reminderDays}
          min={REMINDER_DAYS_RANGE.min}
          max={REMINDER_DAYS_RANGE.max}
          required
        />
      </div>
    </AdminForm>
  );
}
