"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdminForm } from "@/components/admin/form-shell";
import { upsertNeighborhoodProfile } from "./actions";

export type NeighborhoodLocationOption = {
  id: string;
  label: string;
};

export type NeighborhoodProfileValues = {
  locationId: string;
  averagePrice: string;
  medianPrice: string;
  averagePricePerSqm: string;
  annualChangePercent: string;
  saleRentRatio: string;
  averageRent: string;
  rentalYieldPercent: string;
  description: string;
  descriptionEn: string;
  descriptionRu: string;
  dataSource: string;
  measuredAt: string;
};

const EMPTY: Omit<NeighborhoodProfileValues, "locationId"> = {
  averagePrice: "",
  medianPrice: "",
  averagePricePerSqm: "",
  annualChangePercent: "",
  saleRentRatio: "",
  averageRent: "",
  rentalYieldPercent: "",
  description: "",
  descriptionEn: "",
  descriptionRu: "",
  dataSource: "",
  measuredAt: "",
};

const NUMBER_FIELDS = [
  ["averagePrice", "Orta qiymət"],
  ["medianPrice", "Median qiymət"],
  ["averagePricePerSqm", "m² qiyməti"],
  ["annualChangePercent", "İllik dəyişiklik %"],
  ["saleRentRatio", "Satış / icarə nisbəti"],
  ["averageRent", "Orta icarə"],
  ["rentalYieldPercent", "İcarə gəlirliliyi %"],
] as const;

const inputClass = "mt-1 min-h-11 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

/**
 * Rayon analitikasının yaratma və redaktə forması.
 *
 * Əvvəl forma həmişə boş açılırdı: `upsert` mövcud sətri **tamamilə** üzərinə yazdığı
 * üçün bir göstəricini dəyişmək istəyən admin bütün qalanlarını da yenidən yazmalı,
 * yoxsa onları səssizcə silməli olurdu. İndi rayon seçiləndə saxlanmış dəyərlər
 * forma sahələrinə yüklənir — `key` dəyişdiyi üçün React sahələri yenidən mount edir.
 */
export function NeighborhoodEditor({
  locations,
  profiles,
}: {
  locations: NeighborhoodLocationOption[];
  profiles: Record<string, Omit<NeighborhoodProfileValues, "locationId">>;
}) {
  const t = useTranslations("admin");
  const [locationId, setLocationId] = useState("");
  const values = profiles[locationId] ?? EMPTY;

  return (
    <AdminForm action={upsertNeighborhoodProfile} submitLabel={t("pages.amenities.analitikaniYaddaSaxla")} className="gap-4">
      <label className="text-sm text-ink-soft">
        {t("pages.amenities.rayonQesebe")}
        <select
          className={inputClass}
          name="locationId"
          required
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
        >
          <option value="">{t("pages.amenities.secin")}</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.label}
              {profiles[location.id] ? " · analitika var" : ""}
            </option>
          ))}
        </select>
      </label>

      <div key={locationId || "empty"} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {NUMBER_FIELDS.map(([name, label]) => (
            <label key={name} className="text-sm text-ink-soft">
              {label}
              <input className={inputClass} name={name} type="number" step="0.01" defaultValue={values[name]} />
            </label>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="text-sm text-ink-soft">{t("pages.amenities.azTesvir")}<textarea className={`${inputClass} min-h-28 py-2`} name="description" defaultValue={values.description} /></label>
          <label className="text-sm text-ink-soft">{t("pages.amenities.enTesvir")}<textarea className={`${inputClass} min-h-28 py-2`} name="descriptionEn" defaultValue={values.descriptionEn} /></label>
          <label className="text-sm text-ink-soft">{t("pages.amenities.ruTesvir")}<textarea className={`${inputClass} min-h-28 py-2`} name="descriptionRu" defaultValue={values.descriptionRu} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-ink-soft">{t("pages.amenities.menbe")}<input className={inputClass} name="dataSource" defaultValue={values.dataSource} /></label>
          <label className="text-sm text-ink-soft">{t("pages.amenities.melumatTarixi")}<input className={inputClass} name="measuredAt" type="date" defaultValue={values.measuredAt} /></label>
        </div>
      </div>
    </AdminForm>
  );
}
