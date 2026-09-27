import type { Locale } from "@/lib/constants";

/**
 * Ünvanın ən üst pilləsi: region / muxtar respublika.
 *
 * Mənbə — Azərbaycan Respublikası Prezidentinin 7 iyul 2021-ci il tarixli
 * 1382 nömrəli Fərmanı ilə təsdiqlənmiş 14 iqtisadi rayon; Naxçıvan iqtisadi
 * rayonu Naxçıvan Muxtar Respublikasının ərazisidir və saytda muxtar respublika
 * adı ilə göstərilir.
 *
 * **Niyə bazada deyil, kodda.** Region şəhər/rayonun (`Location.kind = CITY`)
 * sabit atributudur və 75 qeydin hamısı üçün birmənalıdır. Onu `Location`
 * ağacına ayrıca pillə kimi salmaq bütün kök sorğularını (`kind = CITY`,
 * `parentId = null`), slug konvensiyasını və landing-ləri dəyişərdi — halbuki
 * region yalnız seçim siyahısını daraltmaq və tam ünvanı göstərmək üçündür.
 * Bağlantı şəhər **slug-ı** ilədir: slug-lar ilk seed-dən sabitdir.
 */

export type RegionKey =
  | "baki"
  | "naxcivan"
  | "abseron-xizi"
  | "dagliq-sirvan"
  | "gence-daskesen"
  | "qarabag"
  | "qazax-tovuz"
  | "quba-xacmaz"
  | "lenkeran-astara"
  | "merkezi-aran"
  | "mil-mugan"
  | "seki-zaqatala"
  | "serqi-zengezur"
  | "sirvan-salyan";

export type Region = {
  key: RegionKey;
  /** Muxtar respublika — göstərişdə «iqtisadi rayon» yazılmır. */
  autonomous?: boolean;
  names: Record<Locale, string>;
  /** Tərkibindəki şəhər və rayonların slug-ları (`Location.kind = CITY`). */
  citySlugs: readonly string[];
};

export const REGIONS: readonly Region[] = [
  {
    key: "baki",
    names: { az: "Bakı", en: "Baku", ru: "Баку" },
    citySlugs: ["baki"],
  },
  {
    key: "naxcivan",
    autonomous: true,
    names: {
      az: "Naxçıvan Muxtar Respublikası",
      en: "Nakhchivan Autonomous Republic",
      ru: "Нахичеванская Автономная Республика",
    },
    citySlugs: ["naxcivan", "babek", "culfa", "kengerli", "ordubad", "sederek", "sahbuz", "serur"],
  },
  {
    key: "abseron-xizi",
    names: { az: "Abşeron-Xızı", en: "Absheron-Khizi", ru: "Абшерон-Хызы" },
    citySlugs: ["sumqayit", "abseron", "xizi"],
  },
  {
    key: "dagliq-sirvan",
    names: { az: "Dağlıq Şirvan", en: "Mountainous Shirvan", ru: "Горный Ширван" },
    citySlugs: ["samaxi", "agsu", "ismayilli", "qobustan"],
  },
  {
    key: "gence-daskesen",
    names: { az: "Gəncə-Daşkəsən", en: "Ganja-Dashkasan", ru: "Гянджа-Дашкесан" },
    citySlugs: ["gence", "naftalan", "daskesen", "goygol", "goranboy", "samux"],
  },
  {
    key: "qarabag",
    names: { az: "Qarabağ", en: "Karabakh", ru: "Карабах" },
    citySlugs: ["xankendi", "agcabedi", "agdam", "agdere", "berde", "fuzuli", "xocali", "xocavend", "susa", "terter"],
  },
  {
    key: "qazax-tovuz",
    names: { az: "Qazax-Tovuz", en: "Gazakh-Tovuz", ru: "Газах-Товуз" },
    citySlugs: ["agstafa", "gedebey", "qazax", "semkir", "tovuz"],
  },
  {
    key: "quba-xacmaz",
    names: { az: "Quba-Xaçmaz", en: "Guba-Khachmaz", ru: "Губа-Хачмаз" },
    citySlugs: ["xacmaz", "quba", "qusar", "siyezen", "sabran"],
  },
  {
    key: "lenkeran-astara",
    names: { az: "Lənkəran-Astara", en: "Lankaran-Astara", ru: "Ленкорань-Астара" },
    citySlugs: ["lenkeran", "astara", "celilabad", "lerik", "masalli", "yardimli"],
  },
  {
    key: "merkezi-aran",
    names: { az: "Mərkəzi Aran", en: "Central Aran", ru: "Центральный Аран" },
    citySlugs: ["mingecevir", "yevlax", "agdas", "goycay", "kurdemir", "ucar", "zerdab"],
  },
  {
    key: "mil-mugan",
    names: { az: "Mil-Muğan", en: "Mil-Mughan", ru: "Миль-Муган" },
    citySlugs: ["beyleqan", "imisli", "saatli", "sabirabad"],
  },
  {
    key: "seki-zaqatala",
    names: { az: "Şəki-Zaqatala", en: "Shaki-Zagatala", ru: "Шеки-Закатала" },
    citySlugs: ["seki", "balaken", "qax", "qebele", "oguz", "zaqatala"],
  },
  {
    key: "serqi-zengezur",
    names: { az: "Şərqi Zəngəzur", en: "East Zangezur", ru: "Восточный Зангезур" },
    citySlugs: ["cebrayil", "kelbecer", "qubadli", "lacin", "zengilan"],
  },
  {
    key: "sirvan-salyan",
    names: { az: "Şirvan-Salyan", en: "Shirvan-Salyan", ru: "Ширван-Сальян" },
    citySlugs: ["sirvan", "bilesuvar", "haciqabul", "neftcala", "salyan"],
  },
];

const REGION_BY_CITY = new Map<string, Region>(
  REGIONS.flatMap((region) => region.citySlugs.map((slug) => [slug, region] as const)),
);

/** Şəhər/rayon slug-ına görə region; tanınmayan slug üçün `null`. */
export function regionForCitySlug(citySlug: string): Region | null {
  return REGION_BY_CITY.get(citySlug) ?? null;
}

/** Regionun göstərilən adı. Bakı regionu şəhər adı ilə üst-üstə düşür. */
export function regionLabel(region: Region, locale: Locale): string {
  if (region.autonomous) return region.names[locale];
  if (region.key === "baki") return region.names[locale];
  const suffix = locale === "az" ? " iqtisadi rayonu" : locale === "ru" ? " экономический район" : " economic region";
  return `${region.names[locale]}${suffix}`;
}
