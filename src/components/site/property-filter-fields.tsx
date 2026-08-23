"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUILDING_TYPES,
  BUILDING_TYPE_LABELS,
  DOCUMENT_STATUSES,
  DOCUMENT_STATUS_LABELS,
  FEATURE_GROUP_LABELS,
  LISTING_TYPES,
  PRICE_PERIODS,
  RENOVATIONS,
  RENOVATION_LABELS,
  type FeatureGroup,
} from "@/lib/constants";

export type CityOption = {
  value: string;
  label: string;
  districts?: { value: string; label: string }[];
};

export type TypeOption = { value: string; label: string };
export type FeatureOption = { value: string; label: string; group: string };

export type SearchPanelInitial = {
  elan?: string;
  axtaris?: string;
  tip?: string;
  seher?: string;
  rayon?: string;
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
  features: FeatureOption[];
  initial: SearchPanelInitial;
  mode: "compact" | "full";
};

const ROOM_OPTIONS = [
  { value: "1", label: "1 otaq" },
  { value: "2", label: "2 otaq" },
  { value: "3", label: "3 otaq" },
  { value: "4", label: "4 otaq" },
  { value: "5", label: "5+ otaq" },
];

const RENOVATION_OPTIONS = Object.values(RENOVATIONS).map((value) => ({
  value,
  label: RENOVATION_LABELS[value],
}));
const BUILDING_OPTIONS = Object.values(BUILDING_TYPES).map((value) => ({
  value,
  label: BUILDING_TYPE_LABELS[value],
}));
const DOCUMENT_OPTIONS = Object.values(DOCUMENT_STATUSES).map((value) => ({
  value,
  label: DOCUMENT_STATUS_LABELS[value],
}));
const PERIOD_OPTIONS = Object.values(PRICE_PERIODS).map((value) => ({
  value,
  label: value === PRICE_PERIODS.MONTH ? "Aylıq" : "Günlük",
}));

const CONTROL =
  "min-h-12 w-full rounded-xs border border-line-strong bg-paper px-3 text-base text-ink transition-colors duration-200 hover:border-ink-muted focus:border-gold sm:text-sm";
const SELECT_CLASS = cn(CONTROL, "cursor-pointer appearance-none pr-9");
const INPUT_CLASS = cn(CONTROL, "placeholder:text-ink-muted");
const LABEL_CLASS = "text-xs font-medium tracking-wide text-ink-soft";

function SelectField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  options,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  placeholder: string;
  options: readonly { value: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
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
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
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
  unit,
  step,
}: {
  legend: string;
  minName: string;
  maxName: string;
  minValue?: string;
  maxValue?: string;
  unit: string;
  step: number;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={LABEL_CLASS}>{legend}</legend>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <input
          name={minName}
          type="number"
          inputMode="numeric"
          min={0}
          step={step}
          defaultValue={minValue ?? ""}
          placeholder="Min"
          aria-label={`Minimum ${unit}`}
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
          placeholder="Maks"
          aria-label={`Maksimum ${unit}`}
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
  features,
  initial,
  mode,
}: PropertyFilterFieldsProps) {
  const id = useId();
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
    <div className={cn("grid gap-4", mode === "compact" ? "lg:grid-cols-12 lg:items-end" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {initial.siralama && initial.siralama !== "newest" ? (
        <input type="hidden" name="siralama" value={initial.siralama} />
      ) : null}

      <fieldset className={cn("flex flex-col gap-1.5", mode === "compact" && "lg:col-span-3")}>
        <legend className={LABEL_CLASS}>Elan növü</legend>
        <div className="grid min-h-12 grid-cols-2 rounded-xs border border-line-strong bg-paper p-1">
          {[
            { value: LISTING_TYPES.SALE, label: "Satılır" },
            { value: LISTING_TYPES.RENT, label: "Kirayə" },
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
              <span className="flex min-h-11 items-center justify-center rounded-xs px-3 text-sm font-medium text-ink-soft transition-colors peer-checked:bg-charcoal peer-checked:text-ink-invert peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={cn("flex flex-col gap-1.5", mode === "compact" && "sm:col-span-2 lg:col-span-4")}>
        <label htmlFor={`${id}-query`} className={LABEL_CLASS}>Axtarış</label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            id={`${id}-query`}
            name="axtaris"
            type="search"
            enterKeyHint="search"
            defaultValue={initial.axtaris ?? ""}
            placeholder="Ünvan, rayon və ya açar söz"
            className={cn(INPUT_CLASS, "pl-9")}
          />
        </div>
      </div>

      <SelectField
        id={`${id}-type`}
        name="tip"
        label="Əmlak növü"
        placeholder="Hamısı"
        defaultValue={initial.tip}
        options={types}
      />
      <SelectField
        id={`${id}-city`}
        name="seher"
        label="Şəhər"
        placeholder="Hamısı"
        defaultValue={initial.seher}
        options={cities}
        onChange={setCitySlug}
      />

      {mode === "full" ? (
        <>
          <SelectField
            id={`${id}-district`}
            name="rayon"
            label="Rayon"
            placeholder={citySlug ? "Hamısı" : "Əvvəlcə şəhər seçin"}
            defaultValue={initial.rayon}
            options={districts}
          />
          <SelectField
            id={`${id}-rooms`}
            name="otaq"
            label="Otaq sayı"
            placeholder="Fərq etməz"
            defaultValue={initial.otaq}
            options={ROOM_OPTIONS}
          />
          <RangeField
            legend="Qiymət (₼)"
            minName="min"
            maxName="max"
            minValue={initial.min}
            maxValue={initial.max}
            unit="qiymət (₼)"
            step={1000}
          />
          <RangeField
            legend="Sahə (m²)"
            minName="sahe_min"
            maxName="sahe_max"
            minValue={initial.sahe_min}
            maxValue={initial.sahe_max}
            unit="sahə (m²)"
            step={5}
          />
          <SelectField
            id={`${id}-renovation`}
            name="temir"
            label="Təmir vəziyyəti"
            placeholder="Fərq etməz"
            defaultValue={initial.temir}
            options={RENOVATION_OPTIONS}
          />
          <SelectField
            id={`${id}-document`}
            name="sened"
            label="Sənəd"
            placeholder="Fərq etməz"
            defaultValue={initial.sened}
            options={DOCUMENT_OPTIONS}
          />
          <SelectField
            id={`${id}-building`}
            name="tikili"
            label="Tikili növü"
            placeholder="Fərq etməz"
            defaultValue={initial.tikili}
            options={BUILDING_OPTIONS}
          />
          {listingType === LISTING_TYPES.RENT ? (
            <SelectField
              id={`${id}-period`}
              name="dovr"
              label="Kirayə müddəti"
              placeholder="Fərq etməz"
              defaultValue={initial.dovr}
              options={PERIOD_OPTIONS}
            />
          ) : null}
          <RangeField
            legend="Mərtəbə"
            minName="mertebe_min"
            maxName="mertebe_max"
            minValue={initial.mertebe_min}
            maxValue={initial.mertebe_max}
            unit="mərtəbə"
            step={1}
          />

          <fieldset className="sm:col-span-2 lg:col-span-3">
            <legend className={LABEL_CLASS}>Əlavə şərtlər</legend>
            <div className="mt-1 grid sm:grid-cols-2 lg:grid-cols-3">
              <CheckboxField name="ilk_mertebe_yox" label="Birinci mərtəbə olmasın" defaultChecked={initial.ilk_mertebe_yox === "1"} />
              <CheckboxField name="son_mertebe_yox" label="Son mərtəbə olmasın" defaultChecked={initial.son_mertebe_yox === "1"} />
              <CheckboxField name="sekilli" label="Yalnız şəkilli elanlar" defaultChecked={initial.sekilli === "1"} />
            </div>
          </fieldset>

          {featureGroups.map(([group, items]) => (
            <fieldset key={group} className="sm:col-span-2 lg:col-span-3">
              <legend className={LABEL_CLASS}>
                {FEATURE_GROUP_LABELS[group as FeatureGroup] ?? group}
              </legend>
              <div className="mt-1 grid sm:grid-cols-2 lg:grid-cols-3">
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
        </>
      ) : null}
    </div>
  );
}
