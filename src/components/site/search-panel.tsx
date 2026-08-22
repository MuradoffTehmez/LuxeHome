"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

/**
 * Panelin başlanğıc vəziyyəti. Server komponenti cari URL filtrlərini bura ötürür ki,
 * axtarışdan sonra istifadəçinin seçimləri itməsin (state preservation).
 */
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

export type FeatureOption = { value: string; label: string; group: string };

type SearchPanelProps = {
  types: TypeOption[];
  cities: CityOption[];
  /** Qruplaşdırılmış xüsusiyyət və ödəniş şərtləri — çoxseçimli filtr üçün. */
  features?: FeatureOption[];
  initial?: SearchPanelInitial;
  /**
   * `hero` — ana səhifə üçün kompakt görünüş.
   * `page` — əmlaklar səhifəsi üçün; mobil ekranda filtrlər yığılmış gəlir.
   */
  variant?: "hero" | "page";
  className?: string;
};

/** Filtr paneli üçün sadə checkbox — `ui/field.tsx` admin stilindədir. */
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
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-ink select-none">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-4.5 shrink-0 cursor-pointer accent-[--color-gold]"
      />
      {label}
    </label>
  );
}

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

const PERIOD_OPTIONS = Object.values(PRICE_PERIODS).map((value) => ({
  value,
  label: value === "MONTH" ? "Aylıq" : "Günlük",
}));

const DOCUMENT_OPTIONS = Object.values(DOCUMENT_STATUSES).map((value) => ({
  value,
  label: DOCUMENT_STATUS_LABELS[value],
}));

/**
 * Qeyd: `focus:outline-none` yazılmır — klaviatura ilə gəzən istifadəçi üçün
 * globals.css-dəki `:focus-visible` konturu görünən qalmalıdır.
 */
const CONTROL =
  "min-h-12 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink " +
  "transition-colors duration-200 hover:border-ink-muted focus:border-gold";

const SELECT_CLASS = cn(CONTROL, "cursor-pointer appearance-none pr-9");
const INPUT_CLASS = cn(CONTROL, "placeholder:text-ink-muted");
const LABEL_CLASS = "text-xs font-medium tracking-wide text-ink-soft";

/** Chevron ikonu ilə birlikdə select — yerli qablaşdırma. */
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
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
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
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
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

/**
 * Əsas axtarış paneli.
 *
 * Nəticələr `/emlaklar` səhifəsinə query parametrləri ilə yönləndirilir — URL
 * paylaşıla və indeksləşdirilə bilər. Parametr adları `emlaklar/page.tsx`-də
 * oxunanlarla eyni olmalıdır: elan, axtaris, tip, seher, rayon, otaq, min, max,
 * sahe_min, sahe_max, temir, sened.
 */
export function SearchPanel({
  types,
  cities,
  features = [],
  initial = {},
  variant = "hero",
  className,
}: SearchPanelProps) {
  const router = useRouter();

  const [listingType, setListingType] = useState(initial.elan ?? LISTING_TYPES.SALE);
  const [citySlug, setCitySlug] = useState(initial.seher ?? "");

  // Ətraflı filtr açıq gəlir, əgər istifadəçi artıq həmin sahələrdən istifadə edibsə
  const hasAdvanced = Boolean(
    initial.sahe_min ||
      initial.sahe_max ||
      initial.temir ||
      initial.sened ||
      initial.tikili ||
      initial.mertebe_min ||
      initial.mertebe_max ||
      initial.ilk_mertebe_yox ||
      initial.son_mertebe_yox ||
      initial.sekilli ||
      (initial.xususiyyet?.length ?? 0) > 0,
  );
  const [advancedOpen, setAdvancedOpen] = useState(hasAdvanced);

  // Mobil ekranda əmlaklar səhifəsində filtrlər yer tutmasın deyə yığılmış başlayır
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedFeatures = useMemo(
    () => new Set(initial.xususiyyet ?? []),
    [initial.xususiyyet],
  );

  // Xüsusiyyətlər qrup üzrə bölünür: siyahı uzun olduqda düz siyahı oxunmur
  const featureGroups = useMemo(() => {
    const groups = new Map<string, FeatureOption[]>();
    for (const feature of features) {
      const bucket = groups.get(feature.group) ?? [];
      bucket.push(feature);
      groups.set(feature.group, bucket);
    }
    return [...groups.entries()];
  }, [features]);

  const districts = useMemo(() => {
    if (!citySlug) return [];
    return cities.find((city) => city.value === citySlug)?.districts ?? [];
  }, [cities, citySlug]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    params.set("elan", listingType);

    for (const field of [
      "axtaris",
      "tip",
      "seher",
      "rayon",
      "otaq",
      "min",
      "max",
      "sahe_min",
      "sahe_max",
      "temir",
      "sened",
      "tikili",
      "dovr",
      "mertebe_min",
      "mertebe_max",
    ]) {
      const value = String(form.get(field) ?? "").trim();
      if (value) params.set(field, value);
    }

    // Bayraqlar yalnız işarələnəndə URL-ə düşür ki, ünvan lazımsız uzanmasın
    for (const flag of ["ilk_mertebe_yox", "son_mertebe_yox", "sekilli"]) {
      if (form.get(flag)) params.set(flag, "1");
    }

    // Çoxseçimli xüsusiyyət filtri — hər seçim ayrı parametr kimi gedir
    for (const value of form.getAll("xususiyyet")) {
      const slug = String(value).trim();
      if (slug) params.append("xususiyyet", slug);
    }

    // Sıralama seçimi filtrdən asılı deyil — mövcudsa saxlanılır
    if (initial.siralama) params.set("siralama", initial.siralama);

    router.push(`/emlaklar?${params.toString()}`);
  }

  const filtersId = "search-panel-filters";

  return (
    <div
      className={cn(
        "rounded-sm border p-4 backdrop-blur-md sm:p-5",
        variant === "hero"
          ? "border-white/20 bg-paper/94 shadow-editorial"
          : "border-line bg-paper shadow-sm",
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* --- Əsas discovery sırası --- */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="flex flex-col gap-1.5 lg:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <span className={LABEL_CLASS}>Elan növü</span>
              {variant === "page" && (
                <button
                  type="button"
                  onClick={() => setMobileOpen((open) => !open)}
                  aria-expanded={mobileOpen}
                  aria-controls={filtersId}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink transition-colors duration-200 hover:text-gold-deep sm:hidden"
                >
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Filtrlər
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      mobileOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
            <div
              role="radiogroup"
              aria-label="Elan növü"
              className="grid min-h-12 grid-cols-2 rounded-xs border border-line-strong p-1"
            >
              {[
                { value: LISTING_TYPES.SALE, label: "Satılır" },
                { value: LISTING_TYPES.RENT, label: "Kirayə" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={listingType === option.value}
                  onClick={() => setListingType(option.value)}
                  className={cn(
                    "min-h-10 cursor-pointer rounded-xs px-3 text-sm font-medium transition-colors duration-200",
                    listingType === option.value
                      ? "bg-charcoal text-ink-invert"
                      : "text-ink-soft hover:text-ink",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-6">
            <label htmlFor="search-query" className={LABEL_CLASS}>
              Axtarış
            </label>
            <div className="relative">
            <label htmlFor="search-query" className="sr-only">
              Açar söz ilə axtarış
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden="true"
            />
            <input
              id="search-query"
              name="axtaris"
              type="search"
              enterKeyHint="search"
              defaultValue={initial.axtaris ?? ""}
              placeholder="Ünvan, rayon və ya açar söz — məs. «Badamdar villa»"
              className={cn(INPUT_CLASS, "pl-9")}
            />
          </div>
          </div>

          <Button
            type="submit"
            size="md"
            className="min-h-13 sm:col-span-2 lg:col-span-3"
          >
            <Search className="size-4" aria-hidden="true" />
            Axtar
          </Button>
        </div>

        {/* --- Əsas filtrlər --- */}
        <div
          id={filtersId}
          className={cn(
            "grid gap-3 sm:grid-cols-2 lg:grid-cols-12",
            // Mobil ekranda `page` variantında yığılır; sm-dən yuxarı həmişə açıqdır
            variant === "page" && !mobileOpen && "hidden sm:grid",
          )}
        >
          <SelectField
            id="search-type"
            name="tip"
            label="Əmlak növü"
            placeholder="Hamısı"
            defaultValue={initial.tip}
            options={types}
            className="lg:col-span-2"
          />

          <SelectField
            id="search-city"
            name="seher"
            label="Şəhər"
            placeholder="Hamısı"
            defaultValue={initial.seher}
            options={cities}
            onChange={setCitySlug}
            className="lg:col-span-2"
          />

          {/* Rayon yalnız şəhər seçildikdə mənalıdır */}
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label htmlFor="search-district" className={LABEL_CLASS}>
              Rayon
            </label>
            <div className="relative">
              <select
                id="search-district"
                name="rayon"
                defaultValue={initial.rayon ?? ""}
                disabled={districts.length === 0}
                className={cn(
                  SELECT_CLASS,
                  "disabled:cursor-not-allowed disabled:bg-beige disabled:text-ink-muted",
                )}
              >
                <option value="">
                  {citySlug ? "Hamısı" : "Əvvəlcə şəhər seçin"}
                </option>
                {districts.map((district) => (
                  <option key={district.value} value={district.value}>
                    {district.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
                aria-hidden="true"
              />
            </div>
          </div>

          <SelectField
            id="search-rooms"
            name="otaq"
            label="Otaq sayı"
            placeholder="Fərq etməz"
            defaultValue={initial.otaq}
            options={ROOM_OPTIONS}
            className="lg:col-span-2"
          />

          {/* Qiymət aralığı — iki sahə bir sütunda */}
          <fieldset className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
            <legend className={LABEL_CLASS}>Qiymət (₼)</legend>
            <div className="flex items-center gap-2">
              <input
                name="min"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                defaultValue={initial.min ?? ""}
                placeholder="Min"
                aria-label="Minimum qiymət (₼)"
                className={INPUT_CLASS}
              />
              <span className="text-ink-muted" aria-hidden="true">
                —
              </span>
              <input
                name="max"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                defaultValue={initial.max ?? ""}
                placeholder="Maks"
                aria-label="Maksimum qiymət (₼)"
                className={INPUT_CLASS}
              />
            </div>
          </fieldset>
        </div>

        {/* --- Ətraflı filtrlər (progressive disclosure) --- */}
        <div
          className={cn(
            "flex flex-col gap-4",
            variant === "page" && !mobileOpen && "hidden sm:flex",
          )}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              aria-expanded={advancedOpen}
              aria-controls="search-advanced"
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft transition-colors duration-200 hover:text-gold-deep"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Ətraflı filtr
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-200",
                  advancedOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>

            <Link
              href="/emlaklar"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Filtrləri sıfırla
            </Link>
          </div>

          {advancedOpen && (
            <div
              id="search-advanced"
              className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <fieldset className="flex flex-col gap-1.5">
                <legend className={LABEL_CLASS}>Sahə (m²)</legend>
                <div className="flex items-center gap-2">
                  <input
                    name="sahe_min"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={5}
                    defaultValue={initial.sahe_min ?? ""}
                    placeholder="Min"
                    aria-label="Minimum sahə (m²)"
                    className={INPUT_CLASS}
                  />
                  <span className="text-ink-muted" aria-hidden="true">
                    —
                  </span>
                  <input
                    name="sahe_max"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={5}
                    defaultValue={initial.sahe_max ?? ""}
                    placeholder="Maks"
                    aria-label="Maksimum sahə (m²)"
                    className={INPUT_CLASS}
                  />
                </div>
              </fieldset>

              <SelectField
                id="search-renovation"
                name="temir"
                label="Təmir vəziyyəti"
                placeholder="Fərq etməz"
                defaultValue={initial.temir}
                options={RENOVATION_OPTIONS}
              />

              <SelectField
                id="search-document"
                name="sened"
                label="Sənəd"
                placeholder="Fərq etməz"
                defaultValue={initial.sened}
                options={DOCUMENT_OPTIONS}
              />

              <SelectField
                id="search-building"
                name="tikili"
                label="Tikili növü"
                placeholder="Fərq etməz"
                defaultValue={initial.tikili}
                options={BUILDING_OPTIONS}
              />

              {listingType === LISTING_TYPES.RENT && (
                <SelectField
                  id="search-period"
                  name="dovr"
                  label="Kirayə müddəti"
                  placeholder="Fərq etməz"
                  defaultValue={initial.dovr}
                  options={PERIOD_OPTIONS}
                />
              )}

              <fieldset className="flex flex-col gap-1.5">
                <legend className={LABEL_CLASS}>Mərtəbə</legend>
                <div className="flex items-center gap-2">
                  <input
                    name="mertebe_min"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={200}
                    defaultValue={initial.mertebe_min ?? ""}
                    placeholder="Min"
                    aria-label="Minimum mərtəbə"
                    className={INPUT_CLASS}
                  />
                  <span className="text-ink-muted" aria-hidden="true">
                    —
                  </span>
                  <input
                    name="mertebe_max"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={200}
                    defaultValue={initial.mertebe_max ?? ""}
                    placeholder="Maks"
                    aria-label="Maksimum mərtəbə"
                    className={INPUT_CLASS}
                  />
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <legend className={LABEL_CLASS}>Əlavə şərtlər</legend>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <CheckboxField
                    name="ilk_mertebe_yox"
                    label="Birinci mərtəbə olmasın"
                    defaultChecked={initial.ilk_mertebe_yox === "1"}
                  />
                  <CheckboxField
                    name="son_mertebe_yox"
                    label="Son mərtəbə olmasın"
                    defaultChecked={initial.son_mertebe_yox === "1"}
                  />
                  <CheckboxField
                    name="sekilli"
                    label="Yalnız şəkilli elanlar"
                    defaultChecked={initial.sekilli === "1"}
                  />
                </div>
              </fieldset>

              {featureGroups.length > 0 && (
                <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
                  {featureGroups.map(([group, items]) => (
                    <fieldset key={group} className="flex flex-col gap-1.5">
                      <legend className={LABEL_CLASS}>
                        {FEATURE_GROUP_LABELS[group as FeatureGroup] ?? group}
                      </legend>
                      <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
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
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
