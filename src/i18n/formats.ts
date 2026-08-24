import type { Formats } from "next-intl";

/**
 * Bütün dillərdə paylaşılan format presetləri. Mesajlarda `{value, number, azn}`
 * kimi çağırılır, komponentlərdə isə `useFormatter().number(value, "azn")`.
 *
 * AZN üçün ayrıca preset var, çünki `Intl.NumberFormat`-ın `az-AZ` üçün daxili
 * valyuta adı bəzi mühitlərdə "AZN" əvəzinə "₼" yazır — sabit üç hərfli kodu
 * qorumaq üçün `currencyDisplay: "code"` təyin olunub.
 */
export const formats = {
  number: {
    azn: {
      style: "currency",
      currency: "AZN",
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    },
    // "m²" üçün rəsmi Intl vahidi yoxdur (yalnız "meter" var, "square-meter" deyil) —
    // simvol hər üç dildə eynidir, ona görə rəqəm qruplaşdırılır və "m²" mesajlarda
    // əl ilə əlavə olunur (bax: property.json-dakı "{value, number, integer} m²" nümunəsi).
    integer: {
      maximumFractionDigits: 0,
    },
  },
  dateTime: {
    short: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
    long: {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
    withTime: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  },
} satisfies Formats;
