import {
  BUILDING_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  LISTING_TYPE_LABELS,
  RENOVATION_LABELS,
  SORT_OPTIONS,
  type BuildingType,
  type DocumentStatus,
  type ListingType,
  type Renovation,
  type SortOption,
} from "./constants";
import { formatNumber } from "./utils";

export type PropertySearchInput = Record<string, string | string[] | undefined>;
export type PropertySearchOverride = Record<
  string,
  string | number | readonly string[] | null
>;

export const PROPERTY_SEARCH_KEYS = [
  "elan",
  "axtaris",
  "tip",
  "seher",
  "rayon",
  "metro",
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
] as const;

export type PropertySearchKey = (typeof PROPERTY_SEARCH_KEYS)[number];

export type ParsedPropertySearch = {
  values: Partial<Record<PropertySearchKey, string>>;
  featureSlugs: string[];
  excludeFirstFloor: boolean;
  excludeLastFloor: boolean;
  withImagesOnly: boolean;
  sort: SortOption;
  page: number;
};

export type PropertyFilterLabelOptions = {
  types?: readonly { value: string; label: string }[];
  cities?: readonly {
    value: string;
    label: string;
    districts?: readonly { value: string; label: string }[];
  }[];
  features?: readonly { value: string; label: string }[];
  metros?: readonly { value: string; label: string }[];
  translateLabel?: (key: string, fallback: string) => string;
};

export type ActiveFilterChip = { key: string; label: string; href: string };

const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

function singleValue(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function parsePropertySearchParams(
  params: PropertySearchInput,
): ParsedPropertySearch {
  const values = Object.fromEntries(
    PROPERTY_SEARCH_KEYS.flatMap((key) => {
      const value = singleValue(params[key]);
      return value ? [[key, value]] : [];
    }),
  ) as ParsedPropertySearch["values"];
  const rawFeatures = Array.isArray(params.xususiyyet)
    ? params.xususiyyet
    : params.xususiyyet
      ? [params.xususiyyet]
      : [];
  const rawSort = singleValue(params.siralama);
  const sort = SORT_VALUES.includes(rawSort as SortOption)
    ? (rawSort as SortOption)
    : "newest";
  const rawPage = Number(singleValue(params.sehife) ?? 1);

  return {
    values,
    featureSlugs: rawFeatures.map((value) => value.trim()).filter(Boolean),
    excludeFirstFloor: singleValue(params.ilk_mertebe_yox) === "1",
    excludeLastFloor: singleValue(params.son_mertebe_yox) === "1",
    withImagesOnly: singleValue(params.sekilli) === "1",
    sort,
    page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function buildPropertySearchHref(
  state: ParsedPropertySearch,
  overrides: PropertySearchOverride = {},
): string {
  const params = new URLSearchParams();

  for (const key of PROPERTY_SEARCH_KEYS) {
    const value = state.values[key];
    if (value) params.set(key, value);
  }
  for (const value of state.featureSlugs) params.append("xususiyyet", value);
  if (state.excludeFirstFloor) params.set("ilk_mertebe_yox", "1");
  if (state.excludeLastFloor) params.set("son_mertebe_yox", "1");
  if (state.withImagesOnly) params.set("sekilli", "1");
  if (state.sort !== "newest") params.set("siralama", state.sort);
  if (state.page > 1) params.set("sehife", String(state.page));

  for (const [key, value] of Object.entries(overrides)) {
    params.delete(key);
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  if (Object.keys(overrides).some((key) => key !== "sehife")) {
    params.delete("sehife");
  }

  const query = params.toString();
  return `/emlaklar${query ? `?${query}` : ""}`;
}

function numericLabel(value: string, suffix: string): string {
  const number = Number(value);
  return `${Number.isFinite(number) ? formatNumber(number) : value}${suffix}`;
}

export function buildActivePropertyFilters(
  state: ParsedPropertySearch,
  options: PropertyFilterLabelOptions = {},
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  const values = state.values;
  const add = (key: string, label: string, overrideKey = key) => {
    chips.push({
      key,
      label: options.translateLabel?.(key, label) ?? label,
      href: buildPropertySearchHref(state, { [overrideKey]: null }),
    });
  };
  const optionLabel = (
    items: readonly { value: string; label: string }[] | undefined,
    value: string,
  ) => items?.find((item) => item.value === value)?.label ?? value;

  if (values.elan) add("elan", LISTING_TYPE_LABELS[values.elan as ListingType] ?? values.elan);
  if (values.axtaris) add("axtaris", `«${values.axtaris}»`);
  if (values.tip) add("tip", optionLabel(options.types, values.tip));
  if (values.seher) add("seher", optionLabel(options.cities, values.seher));
  if (values.rayon) {
    const districts = options.cities?.flatMap((city) => city.districts ?? []);
    add("rayon", optionLabel(districts, values.rayon));
  }
  if (values.metro) add("metro", optionLabel(options.metros, values.metro));
  if (values.otaq) add("otaq", Number(values.otaq) >= 5 ? "5+ otaq" : `${values.otaq} otaq`);
  if (values.min) add("min", numericLabel(values.min, " ₼-dən"));
  if (values.max) add("max", numericLabel(values.max, " ₼-dək"));
  if (values.sahe_min) add("sahe_min", numericLabel(values.sahe_min, " m²-dən"));
  if (values.sahe_max) add("sahe_max", numericLabel(values.sahe_max, " m²-dək"));
  if (values.temir) add("temir", RENOVATION_LABELS[values.temir as Renovation] ?? values.temir);
  if (values.sened) add("sened", DOCUMENT_STATUS_LABELS[values.sened as DocumentStatus] ?? values.sened);
  if (values.tikili) add("tikili", BUILDING_TYPE_LABELS[values.tikili as BuildingType] ?? values.tikili);
  if (values.dovr) add("dovr", values.dovr === "MONTH" ? "Aylıq kirayə" : values.dovr === "DAY" ? "Günlük kirayə" : values.dovr);
  if (values.mertebe_min) add("mertebe_min", numericLabel(values.mertebe_min, "-ci mərtəbədən"));
  if (values.mertebe_max) add("mertebe_max", numericLabel(values.mertebe_max, "-ci mərtəbəyədək"));

  if (state.excludeFirstFloor) add("ilk_mertebe_yox", "Birinci mərtəbə olmasın");
  if (state.excludeLastFloor) add("son_mertebe_yox", "Son mərtəbə olmasın");
  if (state.withImagesOnly) add("sekilli", "Yalnız şəkilli elanlar");

  for (const slug of state.featureSlugs) {
    chips.push({
      key: `xususiyyet:${slug}`,
      label: options.translateLabel?.(`xususiyyet:${slug}`, optionLabel(options.features, slug)) ?? optionLabel(options.features, slug),
      href: buildPropertySearchHref(state, {
        xususiyyet: state.featureSlugs.filter((value) => value !== slug),
      }),
    });
  }

  if (state.sort !== "newest") {
    add(
      "siralama",
      SORT_OPTIONS.find((option) => option.value === state.sort)?.label ?? state.sort,
    );
  }

  return chips;
}
