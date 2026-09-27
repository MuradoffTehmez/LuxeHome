import { LISTING_TYPES, PRICE_PERIODS } from "@/lib/constants";
import { truncateAtWord } from "@/lib/seo";

/**
 * SEO mətnlərinin saf qatı: məhdudiyyətlər, deterministik ehtiyat mətn və AI
 * çıxışının təmizlənməsi. Workers AI (`listing-enrichment.ts`, admin action-ı)
 * bunun üzərində işləyir — AI əlçatan olmayanda da elan SEO-suz qalmır.
 */

export const SEO_LIMITS = {
  metaTitle: 60,
  metaDescription: 160,
  ogTitle: 70,
  ogDescription: 200,
  socialText: 280,
  keyword: 60,
  keywords: 10,
} as const;

export type SeoCopy = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  keywords: string[];
  socialText: string;
};

/** AI-a və ehtiyat generatora verilən elan faktları — yalnız bazadakı dəyərlər. */
export type ListingSeoFacts = {
  title: string;
  description: string;
  listingType: string;
  propertyType: string;
  /** «Nərimanov rayonu, Bakı şəhəri» — tam ünvanın inzibati hissəsi. */
  place: string;
  /** Qısa yer: «Nərimanov», «Əliabad». */
  placeShort: string;
  city: string;
  price: number;
  currency: string;
  pricePeriod: string | null;
  rooms: number | null;
  area: number | null;
  landArea: number | null;
  floor: number | null;
  totalFloors: number | null;
  features: string[];
};

const BRAND = "Luxe Home Estate";

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  // Link və markdown qalıqları SEO sahəsinə düşməsin.
  const text = value
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[*_`#>]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? truncateAtWord(text, max) : text;
}

/** Açar sözləri təmizləyir: kiçik hərf, təkrarsız, ən çox 10. */
export function normalizeKeywords(values: unknown): string[] {
  const list = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[,;\n]/)
      : [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of list) {
    const keyword = clean(item, SEO_LIMITS.keyword).toLocaleLowerCase("az-AZ").replace(/…$/, "");
    if (!keyword || keyword.length < 2 || seen.has(keyword)) continue;
    seen.add(keyword);
    result.push(keyword);
    if (result.length >= SEO_LIMITS.keywords) break;
  }
  return result;
}

/**
 * Model çıxışını sahə limitlərinə salır. Boş qalan sahə `fallback`-dən götürülür —
 * model bir sahəni unutsa da nəticə tam olur.
 */
export function sanitizeSeoCopy(raw: Partial<Record<keyof SeoCopy, unknown>>, fallback: SeoCopy): SeoCopy {
  const pick = (key: Exclude<keyof SeoCopy, "keywords">, max: number) => clean(raw[key], max) || fallback[key];
  const keywords = normalizeKeywords(raw.keywords);
  return {
    metaTitle: pick("metaTitle", SEO_LIMITS.metaTitle),
    metaDescription: pick("metaDescription", SEO_LIMITS.metaDescription),
    ogTitle: pick("ogTitle", SEO_LIMITS.ogTitle),
    ogDescription: pick("ogDescription", SEO_LIMITS.ogDescription),
    keywords: keywords.length > 0 ? keywords : fallback.keywords,
    socialText: pick("socialText", SEO_LIMITS.socialText),
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 0 }).format(value);
}

function priceText(facts: ListingSeoFacts): string {
  if (!(facts.price > 0)) return "";
  const symbol = facts.currency === "AZN" ? "₼" : facts.currency === "USD" ? "$" : facts.currency === "EUR" ? "€" : facts.currency;
  const period =
    facts.listingType === LISTING_TYPES.RENT
      ? facts.pricePeriod === PRICE_PERIODS.DAY
        ? " / gün"
        : " / ay"
      : "";
  return `${formatNumber(facts.price)} ${symbol}${period}`;
}

/**
 * Faktlardan deterministik SEO mətni (AZ). Heç nə uydurmur — yalnız verilən
 * sahələri birləşdirir. AI əlçatan deyilsə və ya cavabı yararsızdırsa istifadə olunur.
 */
export function fallbackListingSeo(facts: ListingSeoFacts): SeoCopy {
  const deal = facts.listingType === LISTING_TYPES.RENT ? "kirayə" : "satılır";
  const dealAdjective = facts.listingType === LISTING_TYPES.RENT ? "Kirayə" : "Satılır";
  const rooms = facts.rooms ? `${facts.rooms} otaqlı ` : "";
  const type = facts.propertyType.toLocaleLowerCase("az-AZ");
  const size = facts.area
    ? `${formatNumber(facts.area)} m²`
    : facts.landArea
      ? `${formatNumber(facts.landArea)} sot`
      : "";
  const price = priceText(facts);
  const floor = facts.floor ? `${facts.floor}${facts.totalFloors ? `/${facts.totalFloors}` : ""} mərtəbə` : "";

  const headline = `${rooms}${type} ${deal} — ${facts.placeShort}`;
  const details = [size, floor, price].filter(Boolean).join(", ");
  const featureText = facts.features.slice(0, 3).join(", ");

  const metaTitle = truncateAtWord(`${dealAdjective}: ${rooms}${type}, ${facts.placeShort}`, SEO_LIMITS.metaTitle);
  const metaDescription = truncateAtWord(
    [`${headline}.`, details && `${details}.`, featureText && `${featureText}.`, `${facts.place}. ${BRAND}.`]
      .filter(Boolean)
      .join(" "),
    SEO_LIMITS.metaDescription,
  );
  const ogTitle = truncateAtWord(`${facts.title} | ${BRAND}`, SEO_LIMITS.ogTitle);
  const ogDescription = truncateAtWord(
    [details && `${details}.`, `${facts.place}.`, truncateAtWord(facts.description, 120)].filter(Boolean).join(" "),
    SEO_LIMITS.ogDescription,
  );
  const keywords = normalizeKeywords([
    `${facts.placeShort} ${type} ${deal}`,
    `${rooms}${type} ${facts.city}`.trim(),
    `${type} ${deal}`,
    `${facts.city} ${type}`,
    facts.placeShort !== facts.city ? `${facts.placeShort} ${type}` : "",
    ...facts.features.slice(0, 3).map((feature) => `${type} ${feature}`),
  ]);
  const socialText = truncateAtWord(
    [`🏠 ${headline}`, details, facts.place, BRAND].filter(Boolean).join(" · "),
    SEO_LIMITS.socialText,
  );

  return { metaTitle, metaDescription, ogTitle, ogDescription, keywords, socialText };
}

/** Səhifə/məqalə üçün: yalnız başlıq və mətndən deterministik SEO. */
export function fallbackPageSeo(input: { title: string; body: string }): SeoCopy {
  const title = clean(input.title, 200);
  const body = clean(input.body, 2000);
  const description = body ? truncateAtWord(body, SEO_LIMITS.metaDescription) : title;
  const words = title
    .toLocaleLowerCase("az-AZ")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 3);
  return {
    metaTitle: truncateAtWord(title, SEO_LIMITS.metaTitle),
    metaDescription: description,
    ogTitle: truncateAtWord(`${title} | ${BRAND}`, SEO_LIMITS.ogTitle),
    ogDescription: body ? truncateAtWord(body, SEO_LIMITS.ogDescription) : description,
    keywords: normalizeKeywords([title, ...words.slice(0, 6)]),
    socialText: truncateAtWord([title, body && truncateAtWord(body, 180), BRAND].filter(Boolean).join(" — "), SEO_LIMITS.socialText),
  };
}

/** Modelə göndərilən JSON sxemi — `runAiText` onu JSON mode ilə məcbur edir. */
export const SEO_COPY_SCHEMA = {
  type: "object",
  properties: {
    metaTitle: { type: "string" },
    metaDescription: { type: "string" },
    ogTitle: { type: "string" },
    ogDescription: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    socialText: { type: "string" },
  },
  required: ["metaTitle", "metaDescription", "ogTitle", "ogDescription", "keywords", "socialText"],
} as const;
