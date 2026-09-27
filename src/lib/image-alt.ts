import { LISTING_TYPES, LOCATION_KINDS } from "@/lib/constants";
import { isRepublicCity, type PathPlace } from "@/lib/location-path";

/**
 * Elan şəkillərinin ALT mətni.
 *
 * AI yalnız fotoda **hansı sahənin** göründüyünü seçir (sabit siyahıdan); cümlə
 * isə burada elanın bazadakı faktlarından qurulur. Beləliklə model ünvan, otaq
 * sayı və ya əmlak növü uydura bilmir — ALT həmişə elanla uyğundur:
 * «Nərimanov rayonunda satılan 3 otaqlı mənzilin yataq otağı».
 */

export const IMAGE_ROOMS = [
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "balcony",
  "facade",
  "yard",
  "pool",
  "garage",
  "view",
  "hallway",
  "office",
  "other",
] as const;

export type ImageRoom = (typeof IMAGE_ROOMS)[number];

/** Sahənin mənsubiyyət şəkilçili adı: «mənzilin **yataq otağı**». */
const ROOM_PHRASE: Record<ImageRoom, string> = {
  living_room: "qonaq otağı",
  bedroom: "yataq otağı",
  kitchen: "mətbəxi",
  bathroom: "hamam otağı",
  balcony: "balkonu",
  facade: "fasadı",
  yard: "həyəti",
  pool: "hovuzu",
  garage: "qarajı",
  view: "pəncərədən görünüşü",
  hallway: "dəhlizi",
  office: "iş otağı",
  other: "görünüşü",
};

/** Əmlak növünün adlıq və yiyəlik halı — slug üzrə (taksonomiya slug-ları sabitdir). */
const TYPE_NOUNS: Record<string, readonly [nominative: string, genitive: string]> = {
  menziller: ["mənzil", "mənzilin"],
  "yeni-tikili": ["yeni tikili mənzil", "yeni tikili mənzilin"],
  "kohne-tikili": ["köhnə tikili mənzil", "köhnə tikili mənzilin"],
  villalar: ["villa", "villanın"],
  "heyet-evleri": ["həyət evi", "həyət evinin"],
  "bag-evleri": ["bağ evi", "bağ evinin"],
  torpaq: ["torpaq sahəsi", "torpaq sahəsinin"],
  ofisler: ["ofis", "ofisin"],
  obyektler: ["kommersiya obyekti", "kommersiya obyektinin"],
  qarajlar: ["qaraj", "qarajın"],
  "mini-otel": ["mini otel", "mini otelin"],
  "istirahet-merkezleri": ["istirahət mərkəzi", "istirahət mərkəzinin"],
  "konteyner-evler": ["konteyner ev", "konteyner evin"],
  "a-frame-evler": ["A-frame ev", "A-frame evin"],
  "xarici-emlak": ["əmlak", "əmlakın"],
};

/** Model cavabından sahə: yalnız siyahıdakı dəyər, qalanı `other`. */
export function parseImageRoom(value: unknown): ImageRoom {
  const text =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "room" in value
        ? String((value as { room: unknown }).room)
        : "";
  const normalized = text.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (IMAGE_ROOMS as readonly string[]).includes(normalized) ? (normalized as ImageRoom) : "other";
}

/** Yerlik hal: «Nərimanov rayonunda», «Əliabad qəsəbəsində», «Xınalıq kəndində». */
export function placeLocative(place: PathPlace): string {
  switch (place.kind) {
    case LOCATION_KINDS.CITY:
      return isRepublicCity(place.slug) ? `${place.name} şəhərində` : `${place.name} rayonunda`;
    case LOCATION_KINDS.DISTRICT:
      return `${place.name} rayonunda`;
    case LOCATION_KINDS.SETTLEMENT:
      return `${place.name} qəsəbəsində`;
    case LOCATION_KINDS.VILLAGE:
      return `${place.name} kəndində`;
    default:
      return `${place.name} ərazisində`;
  }
}

export type AltFacts = {
  listingType: string;
  typeSlug: string;
  typeName: string;
  rooms: number | null;
  /** Ən dəqiq məlum yer — `district` varsa o, yoxsa şəhər/rayon. */
  place: PathPlace;
};

/** Elanın ümumi ifadəsi: «Nərimanov rayonunda satılan 3 otaqlı mənzil». */
function subject(facts: AltFacts, genitive: boolean): string {
  const deal = facts.listingType === LISTING_TYPES.RENT ? "kirayə verilən" : "satılan";
  const rooms = facts.rooms ? `${facts.rooms} otaqlı ` : "";
  const known = TYPE_NOUNS[facts.typeSlug];
  const typeName = facts.typeName.toLocaleLowerCase("az-AZ");
  // Naməlum növdə şəkilçi təxmin edilmir — «… obyekti (villalar)» kimi səhv yazmaqdansa
  // ümumi «əmlak» sözü işlədilir.
  const noun = known ? known[genitive ? 1 : 0] : genitive ? `${typeName} əmlakının` : typeName;
  return `${placeLocative(facts.place)} ${deal} ${rooms}${noun}`.replace(/\s+/g, " ").trim();
}

/** AI sahəni tanıyanda: «… mənzilin yataq otağı». */
export function composeImageAlt(facts: AltFacts, room: ImageRoom): string {
  return capitalize(`${subject(facts, true)} ${ROOM_PHRASE[room]}`);
}

/** AI olmadan və ya hələ analiz edilməmiş şəkil üçün: «… mənzil — şəkil 2». */
export function fallbackImageAlt(facts: AltFacts, index: number): string {
  return capitalize(`${subject(facts, false)} — şəkil ${index + 1}`);
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("az-AZ") + value.slice(1);
}
