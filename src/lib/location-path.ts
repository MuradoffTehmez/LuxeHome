import { LOCATION_KINDS, type Locale } from "@/lib/constants";
import { regionForCitySlug, regionLabel } from "@/lib/regions";

/**
 * Elan ünvanının tam, iyerarxik göstərilməsi.
 *
 * Elan `cityId` (şəhər/rayon) və bir `districtId` saxlayır — sonuncu ağacdakı
 * ən dərin seçilmiş yerdir (şəhər rayonu, qəsəbə, kənd və ya massiv). Tam yol
 * həmin yerdən valideynə doğru bərpa olunur və region kodda sabit xəritədən
 * (`regions.ts`) gəlir. Nəticə: «Əliabad» əvəzinə «Naxçıvan Muxtar
 * Respublikası, Naxçıvan şəhəri, Əliabad qəsəbəsi».
 *
 * Fayl Prisma idxal etmir — həm server, həm brauzer forması işlədir.
 */

export type PathPlace = { name: string; slug: string; kind: string };

/** Respublika tabeli 11 şəhər — qalan `CITY` qeydləri rayondur. */
const REPUBLIC_CITY_SLUGS = new Set([
  "baki",
  "gence",
  "sumqayit",
  "mingecevir",
  "sirvan",
  "naftalan",
  "naxcivan",
  "xankendi",
  "lenkeran",
  "seki",
  "yevlax",
]);

/**
 * Rayon tabeli şəhərlər. Rəsmi təsnifatda qəsəbə ilə eyni pillədədir və bazada
 * `SETTLEMENT` kimi saxlanılır, amma «Xırdalan qəsəbəsi» yazmaq yanlışdır.
 */
const DISTRICT_TOWN_SLUGS = new Set([
  "abseron-xirdalan",
  "lenkeran-liman",
  "celilabad-goytepe",
  "fuzuli-horadiz",
  "goranboy-delimemmedli",
  "xacmaz-xudat",
  "tovuz-qovlar",
]);

export function isRepublicCity(slug: string): boolean {
  return REPUBLIC_CITY_SLUGS.has(slug);
}

type Kind = "city" | "rayon" | "urbanDistrict" | "town" | "settlement" | "village" | "neighborhood" | "metro";

function kindOf(place: PathPlace): Kind {
  switch (place.kind) {
    case LOCATION_KINDS.CITY:
      return isRepublicCity(place.slug) ? "city" : "rayon";
    case LOCATION_KINDS.DISTRICT:
      return "urbanDistrict";
    case LOCATION_KINDS.SETTLEMENT:
      return DISTRICT_TOWN_SLUGS.has(place.slug) ? "town" : "settlement";
    case LOCATION_KINDS.VILLAGE:
      return "village";
    case LOCATION_KINDS.METRO:
      return "metro";
    default:
      return "neighborhood";
  }
}

const SUFFIX: Record<Locale, Record<Kind, (name: string) => string>> = {
  az: {
    city: (name) => `${name} şəhəri`,
    rayon: (name) => `${name} rayonu`,
    urbanDistrict: (name) => `${name} rayonu`,
    town: (name) => `${name} şəhəri`,
    settlement: (name) => `${name} qəsəbəsi`,
    village: (name) => `${name} kəndi`,
    neighborhood: (name) => name,
    metro: (name) => `${name} metrosu`,
  },
  en: {
    city: (name) => `${name} city`,
    rayon: (name) => `${name} District`,
    urbanDistrict: (name) => `${name} district`,
    town: (name) => `${name} town`,
    settlement: (name) => `${name} settlement`,
    village: (name) => `${name} village`,
    neighborhood: (name) => name,
    metro: (name) => `${name} metro`,
  },
  ru: {
    city: (name) => `г. ${name}`,
    rayon: (name) => `${name} район`,
    urbanDistrict: (name) => `${name} район`,
    town: (name) => `г. ${name}`,
    settlement: (name) => `пос. ${name}`,
    village: (name) => `с. ${name}`,
    neighborhood: (name) => name,
    metro: (name) => `м. ${name}`,
  },
};

/** Yerin növü ilə adı: «Nərimanov rayonu», «Əliabad qəsəbəsi», «Xınalıq kəndi». */
export function placeLabel(place: PathPlace, locale: Locale): string {
  return SUFFIX[locale][kindOf(place)](place.name);
}

export type AddressPathInput = {
  city: PathPlace;
  /** Ən dərin seçilmiş yer; valideyni şəhər deyilsə (`parent`) o da göstərilir. */
  district?: (PathPlace & { parent?: PathPlace | null }) | null;
  neighborhoodName?: string | null;
  street?: string | null;
  building?: string | null;
  /** Köhnə elanların sərbəst ünvan sətri — yeni sahələr boşdursa göstərilir. */
  address?: string | null;
};

/**
 * Ünvanın hissələri, ümumidən xüsusiyə: region → şəhər/rayon → şəhər rayonu →
 * qəsəbə/kənd/massiv → sərbəst massiv adı → küçə → bina.
 *
 * Bakı regionu şəhərin özü ilə eyni olduğu üçün təkrarlanmır.
 */
export function addressParts(input: AddressPathInput, locale: Locale): string[] {
  const parts: string[] = [];
  const region = regionForCitySlug(input.city.slug);
  if (region && region.key !== "baki") parts.push(regionLabel(region, locale));
  parts.push(placeLabel(input.city, locale));

  const district = input.district;
  if (district) {
    const parent = district.parent;
    if (parent && parent.kind !== LOCATION_KINDS.CITY) parts.push(placeLabel(parent, locale));
    parts.push(placeLabel(district, locale));
  }

  const neighborhood = input.neighborhoodName?.trim();
  if (neighborhood && neighborhood !== district?.name) parts.push(neighborhood);

  const street = composeStreetAddress(input);
  if (street) parts.push(street);
  else if (input.address?.trim()) parts.push(input.address.trim());
  return parts;
}

/** Tam ünvan sətri. */
export function formatFullAddress(input: AddressPathInput, locale: Locale): string {
  return addressParts(input, locale).join(", ");
}

/**
 * Kart üçün qısa yer: ən dərin yer + şəhər/rayon. «Əliabad q., Naxçıvan» —
 * yalnız «Əliabad» yazılanda hansı şəhərə aid olduğu görünmürdü.
 */
export function shortLocation(
  input: { city: PathPlace; district?: PathPlace | null },
  locale: Locale,
): string {
  if (!input.district) return placeLabel(input.city, locale);
  return `${placeLabel(input.district, locale)}, ${input.city.name}`;
}

/** Küçə və bina sahələrindən ünvan sətri; ikisi də boşdursa `null`. */
export function composeStreetAddress(input: { street?: string | null; building?: string | null }): string | null {
  const value = [input.street?.trim(), input.building?.trim()].filter(Boolean).join(", ");
  return value || null;
}
