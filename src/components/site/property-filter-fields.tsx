"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUILDING_TYPES,
  DOCUMENT_STATUSES,
  LISTING_TYPES,
  PRICE_PERIODS,
  RENOVATIONS,
} from "@/lib/constants";

/**
 * Rayon açılışının bir sətri.
 *
 * `group` verilibsə, sətir həmin başlıq altında `<optgroup>`-a yığılır —
 * Bakının qəsəbələri aid olduqları inzibati rayonun altında görünür.
 */
export type DistrictOption = {
  value: string;
  label: string;
  kind?: string;
  group?: string;
};

export type CityOption = {
  value: string;
  label: string;
  districts?: DistrictOption[];
};

export type TypeOption = { value: string; label: string };
export type MetroOption = { value: string; label: string };
export type FeatureOption = { value: string; label: string; group: string };

export type SearchPanelInitial = {
  elan?: string;
  axtaris?: string;
  tip?: string;
  seher?: string;
  rayon?: string;
  metro?: string;
  otaq?: string;
  min?: string;
  max?: string;
  sahe_min?: string;
  sahe_max?: string;
  temir?: string;
  sened?: string;
  tikili?: string;
  dovr?: string;
  mertebe_min?: string;
  mertebe_max?: string;
  ilk_mertebe_yox?: string;
  son_mertebe_yox?: string;
  sekilli?: string;
  xususiyyet?: string[];
  siralama?: string;
};

export type PropertyFilterFieldsProps = {
  types: TypeOption[];
  cities: CityOption[];
  metros?: MetroOption[];
  features: FeatureOption[];
  initial: SearchPanelInitial;
  mode: "compact" | "full";
  /**
   * `stack` — tək sütun (desktop sidebar); `grid` — çoxsütunlu (mobil sheet).
   * Yalnız `full` rejimində nəzərə alınır.
   */
  layout?: "grid" | "stack";
};

const RENOVATION_KEYS = { COSMETIC: "cosmetic", RENOVATED: "renovated", DESIGNER: "designer", UNRENOVATED: "unrenovated", NEW_BUILDING: "newBuilding" } as const;
const DOCUMENT_KEYS = { TITLE_DEED: "titleDeed", CONTRACT: "contract", MUNICIPAL: "municipal", DECREE: "decree", POWER_OF_ATTORNEY: "powerOfAttorney", EXTRACT_COMMERCIAL: "commercialExtract", NONE: "none" } as const;
const BUILDING_KEYS = { NEW: "new", OLD: "old" } as const;
const FEATURE_GROUP_KEYS = { GENERAL: "general", UTILITY: "utility", INDOOR: "indoor", OUTDOOR: "outdoor", SECURITY: "security", PAYMENT: "payment" } as const;

const CONTROL =
  "min-h-12 min-w-0 w-full rounded-sm border border-line-strong bg-paper px-3 text-base text-ink transition-[border-color,box-shadow] duration-200 hover:border-ink-muted focus:border-gold focus:shadow-[0_0_0_4px_rgb(170_135_84/0.16)] sm:text-sm";
const SELECT_CLASS = cn(CONTROL, "cursor-pointer appearance-none pr-9");
const INPUT_CLASS = cn(CONTROL, "placeholder:text-ink-muted");
const LABEL_CLASS = "text-xs font-semibold text-ink-soft";

function SelectField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  options,
  onChange,
  className,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  placeholder: string;
  options: readonly { value: string; label: string; group?: string }[];
  onChange?: (value: string) => void;
  className?: string;
}) {
  // Ardıcıl eyni `group` dəyərləri bir `<optgroup>`-a yığılır. Sıra serverdən
  // gəldiyi kimi saxlanılır — rayon, sonra onun qəsəbələri.
  const groups: { group?: string; items: { value: string; label: string }[] }[] = [];
  for (const option of options) {
    const last = groups[groups.length - 1];
    if (last && last.group === option.group) last.items.push(option);
    else groups.push({ group: option.group, items: [option] });
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className={LABEL_CLASS}>{label}</label>
      <div className="relative">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? ""}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className={SELECT_CLASS}
        >
          <option value="">{placeholder}</option>
          {groups.map((entry, index) =>
            entry.group ? (
              <optgroup key={`${entry.group}-${index}`} label={entry.group}>
                {entry.items.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </optgroup>
            ) : (
              entry.items.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))
            ),
          )}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function RangeField({
  legend,
  minName,
  maxName,
  minValue,
  maxValue,
  step,
  minLabel,
  maxLabel,
}: {
  legend: string;
  minName: string;
  maxName: string;
  minValue?: string;
  maxValue?: string;
  step: number;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className={LABEL_CLASS}>{legend}</legend>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <input
          name={minName}
          type="number"
          inputMode="numeric"
          min={0}
          step={step}
          defaultValue={minValue ?? ""}
          placeholder={minLabel}
          aria-label={minLabel}
          className={INPUT_CLASS}
        />
        <span className="text-ink-muted" aria-hidden="true">—</span>
        <input
          name={maxName}
          type="number"
          inputMode="numeric"
          min={0}
          step={step}
          defaultValue={maxValue ?? ""}
          placeholder={maxLabel}
          aria-label={maxLabel}
          className={INPUT_CLASS}
        />
      </div>
    </fieldset>
  );
}

function CheckboxField({
  name,
  label,
  value,
  defaultChecked,
}: {
  name: string;
  label: string;
  value?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink select-none">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-5 shrink-0 cursor-pointer accent-[--color-gold]"
      />
      {label}
    </label>
  );
}

/** Hero, desktop panel və mobil sheet arasında paylaşılan real GET form sahələri. */
export function PropertyFilterFields({
  types,
  cities,
  metros = [],
  features,
  initial,
  mode,
  layout = "grid",
}: PropertyFilterFieldsProps) {
  const stacked = mode === "full" && layout === "stack";
  const t = useTranslations("listings.search");
  const propertyT = useTranslations("property");
  const id = useId();
  const roomOptions = [1, 2, 3, 4].map((count) => ({ value: String(count), label: t("roomOption", { count }) })).concat({ value: "5", label: t("fivePlusRooms") });
  const renovationOptions = Object.values(RENOVATIONS).map((value) => ({ value, label: propertyT(`renovation.${RENOVATION_KEYS[value]}`) }));
  const buildingOptions = Object.values(BUILDING_TYPES).map((value) => ({ value, label: propertyT(`building.${BUILDING_KEYS[value]}`) }));
  const documentOptions = Object.values(DOCUMENT_STATUSES).map((value) => ({ value, label: propertyT(`document.${DOCUMENT_KEYS[value]}`) }));
  const periodOptions = Object.values(PRICE_PERIODS).map((value) => ({ value, label: value === PRICE_PERIODS.MONTH ? t("monthly") : t("daily") }));
  const [listingType, setListingType] = useState(initial.elan ?? LISTING_TYPES.SALE);
  const [citySlug, setCitySlug] = useState(initial.seher ?? "");
  const districts = useMemo(
    () => cities.find((city) => city.value === citySlug)?.districts ?? [],
    [cities, citySlug],
  );
  const selectedFeatures = useMemo(
    () => new Set(initial.xususiyyet ?? []),
    [initial.xususiyyet],
  );
  const featureGroups = useMemo(() => {
    const groups = new Map<string, FeatureOption[]>();
    for (const feature of features) {
      const items = groups.get(feature.group) ?? [];
      items.push(feature);
      groups.set(feature.group, items);
    }
    return [...groups.entries()];
  }, [features]);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        mode === "compact"
          ? "md:grid-cols-2 lg:grid-cols-12 lg:items-end"
          : stacked
            ? "grid-cols-1"
            : "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {initial.siralama && initial.siralama !== "newest" ? (
        <input type="hidden" name="siralama" value={initial.siralama} />
      ) : null}

      <fieldset className={cn("flex flex-col gap-1.5", mode === "compact" && "lg:col-span-3")}>
        <legend className={LABEL_CLASS}>{t("listingType")}</legend>
        <div className="grid min-h-12 grid-cols-2 rounded-sm border border-line-strong bg-beige/60 p-1">
          {[
            { value: LISTING_TYPES.SALE, label: t("sale") },
            { value: LISTING_TYPES.RENT, label: t("rent") },
          ].map((option) => (
            <label key={option.value} className="relative cursor-pointer">
              <input
                type="radio"
                name="elan"
                value={option.value}
                defaultChecked={listingType === option.value}
                onChange={() => setListingType(option.value)}
                className="peer sr-only"
              />
              <span className="flex min-h-11 items-center justify-center rounded-[7px] px-3 text-sm font-semibold text-ink-soft transition-colors peer-checked:bg-charcoal peer-checked:text-ink-invert peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={cn("flex min-w-0 flex-col gap-1.5", mode === "compact" && "lg:col-span-4")}>
        <label htmlFor={`${id}-query`} className={LABEL_CLASS}>{t("search")}</label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            id={`${id}-query`}
            name="axtaris"
            type="search"
            enterKeyHint="search"
            defaultValue={initial.axtaris ?? ""}
            placeholder={t("queryPlaceholder")}
            className={cn(INPUT_CLASS, "pl-9")}
          />
        </div>
      </div>

      <SelectField
        id={`${id}-type`}
        name="tip"
        label={t("propertyType")}
        placeholder={t("all")}
        defaultValue={initial.tip}
        options={types}
        className={mode === "compact" ? "hidden md:flex lg:col-span-2" : undefined}
      />
      <SelectField
        id={`${id}-city`}
        name="seher"
        label={t("city")}
        placeholder={t("all")}
        defaultValue={initial.seher}
        options={cities}
        onChange={setCitySlug}
        className={mode === "compact" ? "hidden md:flex lg:col-span-3" : undefined}
      />

      {mode === "full" ? (
        <>
          <SelectField
            id={`${id}-district`}
            name="rayon"
            label={t("district")}
            placeholder={citySlug ? t("all") : t("selectCityFirst")}
            defaultValue={initial.rayon}
            options={districts}
          />
          <SelectField
            id={`${id}-metro`}
            name="metro"
            label={t("metro")}
            placeholder={t("all")}
            defaultValue={initial.metro}
            options={metros}
          />
          <SelectField
            id={`${id}-rooms`}
            name="otaq"
            label={t("rooms")}
            placeholder={t("any")}
            defaultValue={initial.otaq}
            options={roomOptions}
          />
          <RangeField
            legend={t("price")}
            minName="min"
            maxName="max"
            minValue={initial.min}
            maxValue={initial.max}
            step={1000}
            minLabel={t("minimum", { unit: t("price") })}
            maxLabel={t("maximum", { unit: t("price") })}
          />
          <RangeField
            legend={t("area")}
            minName="sahe_min"
            maxName="sahe_max"
            minValue={initial.sahe_min}
            maxValue={initial.sahe_max}
            step={5}
            minLabel={t("minimum", { unit: t("area") })}
            maxLabel={t("maximum", { unit: t("area") })}
          />
          <SelectField
            id={`${id}-renovation`}
            name="temir"
            label={t("renovation")}
            placeholder={t("any")}
            defaultValue={initial.temir}
            options={renovationOptions}
          />
          <SelectField
            id={`${id}-document`}
            name="sened"
            label={t("document")}
            placeholder={t("any")}
            defaultValue={initial.sened}
            options={documentOptions}
          />
          <SelectField
            id={`${id}-building`}
            name="tikili"
            label={t("building")}
            placeholder={t("any")}
            defaultValue={initial.tikili}
            options={buildingOptions}
          />
          {listingType === LISTING_TYPES.RENT ? (
            <SelectField
              id={`${id}-period`}
              name="dovr"
              label={t("rentPeriod")}
              placeholder={t("any")}
              defaultValue={initial.dovr}
              options={periodOptions}
            />
          ) : null}
          <RangeField
            legend={t("floor")}
            minName="mertebe_min"
            maxName="mertebe_max"
            minValue={initial.mertebe_min}
            maxValue={initial.mertebe_max}
            step={1}
            minLabel={t("minimum", { unit: t("floor") })}
            maxLabel={t("maximum", { unit: t("floor") })}
          />

          {/* Əlavə filtrlər və ~40 xüsusiyyət checkbox-u açılan bölmədədir: açıq
              siyahı nəticələri bir ekrandan çox aşağı itələyirdi. Seçim varsa
              bölmə açıq gəlir ki, aktiv filtr gizli qalmasın. */}
          <details
            open={
              selectedFeatures.size > 0
              || initial.ilk_mertebe_yox === "1"
              || initial.son_mertebe_yox === "1"
              || initial.sekilli === "1"
              || undefined
            }
            className={cn(
              "group/more rounded-xl border border-line bg-ivory/60 shadow-xs",
              !stacked && "sm:col-span-2 lg:col-span-3",
            )}
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {t("moreFilters")}
              <ChevronDown
                className="size-4 shrink-0 text-ink-muted transition-transform duration-200 group-open/more:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="flex flex-col gap-5 border-t border-line px-4 pt-4 pb-3">
              <fieldset>
                <legend className={LABEL_CLASS}>{t("extra")}</legend>
                <div className={cn("mt-1 grid grid-cols-1", !stacked && "sm:grid-cols-2 lg:grid-cols-3")}>
                  <CheckboxField name="ilk_mertebe_yox" label={t("notFirstFloor")} defaultChecked={initial.ilk_mertebe_yox === "1"} />
                  <CheckboxField name="son_mertebe_yox" label={t("notLastFloor")} defaultChecked={initial.son_mertebe_yox === "1"} />
                  <CheckboxField name="sekilli" label={t("withPhotos")} defaultChecked={initial.sekilli === "1"} />
                </div>
              </fieldset>

              {featureGroups.map(([group, items]) => (
                <fieldset key={group}>
                  <legend className={LABEL_CLASS}>
                    {FEATURE_GROUP_KEYS[group as keyof typeof FEATURE_GROUP_KEYS] ? propertyT(`featureGroup.${FEATURE_GROUP_KEYS[group as keyof typeof FEATURE_GROUP_KEYS]}`) : group}
                  </legend>
                  <div className={cn("mt-1 grid", stacked ? "grid-cols-2 gap-x-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
                    {items.map((feature) => (
                      <CheckboxField
                        key={feature.value}
                        name="xususiyyet"
                        value={feature.value}
                        label={feature.label}
                        defaultChecked={selectedFeatures.has(feature.value)}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
