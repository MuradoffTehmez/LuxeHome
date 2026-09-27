import {
  BUILDING_TYPE_LABELS,
  CURRENCIES,
  DOCUMENT_STATUS_LABELS,
  LISTING_TYPES,
  LOCATION_KINDS,
  PRICE_PERIODS,
  PROPERTY_STATUSES,
  RENOVATION_LABELS,
} from "@/lib/constants";
import { propertySchema, type PropertyInput } from "@/lib/admin/schemas";
import { normalizeSearchText } from "@/lib/search-normalization";

/**
 * CSV-dən toplu elan idxalı (#103) — bazasız, təmiz çevirmə məntiqi.
 *
 * Hər sətir admin formasının `propertySchema`-sından keçir, yəni idxal forma ilə
 * eyni qaydaları tətbiq edir. Taksonomiya (növ, şəhər, rayon, metro, xüsusiyyət)
 * slug **və ya** ad ilə tapılır; ad diakritikdən asılı olmadan müqayisə olunur
 * («Nerimanov» = «Nərimanov»). İdxal olunan elan həmişə **qaralama** yaranır —
 * redaktor baxıb dərc edir.
 */

export const IMPORT_MAX_ROWS = 500;
export const IMPORT_MAX_IMAGES_PER_ROW = 12;
/** Bir commit sorğusunda işlənən sətir sayı — şəkil yükləməsi Worker limitinə sığsın. */
export const IMPORT_BATCH_SIZE = 10;

export const IMPORT_COLUMNS = [
  { key: "title", required: true },
  { key: "description", required: true },
  { key: "listing_type", required: true },
  { key: "price", required: true },
  { key: "currency", required: false },
  { key: "price_period", required: false },
  { key: "type", required: true },
  { key: "city", required: true },
  { key: "district", required: false },
  { key: "metro", required: false },
  { key: "address", required: false },
  { key: "rooms", required: false },
  { key: "area", required: false },
  { key: "land_area", required: false },
  { key: "floor", required: false },
  { key: "total_floors", required: false },
  { key: "renovation", required: false },
  { key: "document", required: false },
  { key: "building_type", required: false },
  { key: "latitude", required: false },
  { key: "longitude", required: false },
  { key: "video_url", required: false },
  { key: "features", required: false },
  { key: "images", required: false },
] as const;

export type ImportColumn = (typeof IMPORT_COLUMNS)[number]["key"];

export type ImportLookups = {
  types: { id: string; slug: string; name: string }[];
  locations: {
    id: string;
    slug: string;
    name: string;
    kind: string;
    parentId: string | null;
    parent: { parentId: string | null } | null;
  }[];
  features: { id: string; slug: string; name: string }[];
};

export type ImportIssue = { code: string; field?: string; value?: string; message?: string };

export type ImportRow = {
  /** Fayldakı sətir nömrəsi (başlıq = 1). */
  line: number;
  title: string;
  input: PropertyInput | null;
  images: string[];
  errors: ImportIssue[];
};

export type ImportParseResult = {
  headerErrors: ImportIssue[];
  rows: ImportRow[];
};

const key = (value: string) => normalizeSearchText(value);

/** «350 000», «350,000», «85,5», «1.250.000» kimi yazılışları ədədə çevirir. */
export function parseImportNumber(raw: string): number | null {
  let value = raw.trim().replace(/[\s ₼$€]/g, "");
  if (!value) return null;
  const hasComma = value.includes(",");
  const hasDot = value.includes(".");
  if (hasComma && hasDot) {
    // Sonuncu ayırıcı onluq hissədir, digəri minlik.
    value = value.lastIndexOf(",") > value.lastIndexOf(".")
      ? value.replace(/\./g, "").replace(",", ".")
      : value.replace(/,/g, "");
  } else if (hasComma) {
    value = /^\d{1,3}(,\d{3})+$/.test(value) ? value.replace(/,/g, "") : value.replace(",", ".");
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(value)) {
    // Yerli yazılışda nöqtə minlik ayırıcısıdır: «185.000» = 185 000, 185 deyil.
    value = value.replace(/\./g, "");
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** Kod və ya etiketə görə enum dəyəri (böyük-kiçik hərf və diakritikdən asılı olmadan). */
function enumValue(raw: string, labels: Record<string, string>, aliases: Record<string, string> = {}): string | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (upper in labels) return upper;
  const normalized = key(trimmed);
  if (normalized in aliases) return aliases[normalized];
  const match = Object.entries(labels).find(([, label]) => key(label) === normalized);
  return match ? match[0] : undefined;
}

const LISTING_ALIASES: Record<string, string> = {
  satis: LISTING_TYPES.SALE, satilir: LISTING_TYPES.SALE, sale: LISTING_TYPES.SALE, prodazha: LISTING_TYPES.SALE,
  kiraye: LISTING_TYPES.RENT, icare: LISTING_TYPES.RENT, rent: LISTING_TYPES.RENT, arenda: LISTING_TYPES.RENT,
};
const PERIOD_ALIASES: Record<string, string> = {
  ayliq: PRICE_PERIODS.MONTH, ay: PRICE_PERIODS.MONTH, month: PRICE_PERIODS.MONTH, monthly: PRICE_PERIODS.MONTH,
  gunluk: PRICE_PERIODS.DAY, gun: PRICE_PERIODS.DAY, day: PRICE_PERIODS.DAY, daily: PRICE_PERIODS.DAY,
};
const BUILDING_ALIASES: Record<string, string> = { yeni: "NEW", kohne: "OLD", new: "NEW", old: "OLD" };

function findBy<T extends { slug: string; name: string }>(items: T[], raw: string): T | undefined {
  const trimmed = raw.trim();
  const bySlug = items.find((item) => item.slug === trimmed.toLowerCase());
  if (bySlug) return bySlug;
  const normalized = key(trimmed);
  return items.find((item) => key(item.name) === normalized);
}

function list(raw: string): string[] {
  return raw.split(/[|\n]/).map((item) => item.trim()).filter(Boolean);
}

/** Başlıq sətrini sütun indeksinə çevirir; tanınmayan sütunlar səssizcə atılır. */
function headerIndex(header: string[]): { index: Map<ImportColumn, number>; errors: ImportIssue[] } {
  const index = new Map<ImportColumn, number>();
  header.forEach((cell, position) => {
    const name = cell.trim().toLowerCase().replace(/[\s-]+/g, "_");
    const column = IMPORT_COLUMNS.find((item) => item.key === name);
    if (column && !index.has(column.key)) index.set(column.key, position);
  });
  const errors = IMPORT_COLUMNS
    .filter((column) => column.required && !index.has(column.key))
    .map((column) => ({ code: "missingColumn", field: column.key }));
  return { index, errors };
}

function mapRow(cells: string[], index: Map<ImportColumn, number>, lookups: ImportLookups, line: number): ImportRow {
  const cell = (column: ImportColumn) => {
    const position = index.get(column);
    return position === undefined ? "" : (cells[position] ?? "").trim();
  };
  const errors: ImportIssue[] = [];
  const invalid = (field: ImportColumn, code = "invalidValue") => errors.push({ code, field, value: cell(field) });

  const number = (field: ImportColumn): number | null => {
    const value = parseImportNumber(cell(field));
    if (value !== null && Number.isNaN(value)) {
      invalid(field, "invalidNumber");
      return null;
    }
    return value;
  };
  const integer = (field: ImportColumn): number | null => {
    const value = number(field);
    return value === null ? null : Math.round(value);
  };
  const enumField = (field: ImportColumn, labels: Record<string, string>, aliases?: Record<string, string>) => {
    const value = enumValue(cell(field), labels, aliases);
    if (value === undefined) {
      invalid(field);
      return null;
    }
    return value;
  };

  const listingType = enumField("listing_type", { SALE: "Satılır", RENT: "Kirayə" }, LISTING_ALIASES);
  const currency = cell("currency") ? enumField("currency", Object.fromEntries(Object.keys(CURRENCIES).map((code) => [code, code]))) : "AZN";
  const pricePeriod = enumField("price_period", { MONTH: "Aylıq", DAY: "Günlük" }, PERIOD_ALIASES);

  const type = cell("type") ? findBy(lookups.types, cell("type")) : undefined;
  if (cell("type") && !type) invalid("type", "notFound");

  const cities = lookups.locations.filter((location) => location.kind === LOCATION_KINDS.CITY);
  const city = cell("city") ? findBy(cities, cell("city")) : undefined;
  if (cell("city") && !city) invalid("city", "notFound");

  let districtId: string | null = null;
  if (cell("district") && city) {
    const candidates = lookups.locations.filter((location) =>
      location.kind !== LOCATION_KINDS.CITY &&
      location.kind !== LOCATION_KINDS.METRO &&
      (location.parentId === city.id || location.parent?.parentId === city.id));
    const district = findBy(candidates, cell("district"));
    if (district) districtId = district.id;
    else invalid("district", "notFound");
  }

  let metroId: string | null = null;
  if (cell("metro")) {
    // Metro yalnız seçilmiş şəhərin stansiyaları arasında axtarılır — başqa şəhərə Bakı metrosu yazılmasın.
    const metros = lookups.locations.filter((location) => location.kind === LOCATION_KINDS.METRO && city && location.parentId === city.id);
    const metro = findBy(metros, cell("metro"));
    if (metro) metroId = metro.id;
    else invalid("metro", "notFound");
  }

  const featureIds: string[] = [];
  for (const raw of list(cell("features"))) {
    const feature = findBy(lookups.features, raw);
    if (feature) featureIds.push(feature.id);
    else errors.push({ code: "notFound", field: "features", value: raw });
  }

  const images = list(cell("images"));
  if (images.length > IMPORT_MAX_IMAGES_PER_ROW) {
    errors.push({ code: "tooManyImages", field: "images", value: String(images.length) });
  }
  for (const url of images) {
    if (!/^https:\/\/[^\s]+$/i.test(url)) errors.push({ code: "invalidImageUrl", field: "images", value: url });
  }

  const candidate = {
    title: cell("title"),
    slug: "",
    description: cell("description"),
    listingType: listingType ?? "",
    status: PROPERTY_STATUSES.DRAFT,
    price: number("price") ?? 0,
    currency: currency ?? "",
    pricePeriod: listingType === LISTING_TYPES.RENT ? (pricePeriod ?? PRICE_PERIODS.MONTH) : null,
    typeId: type?.id ?? "",
    cityId: city?.id ?? "",
    districtId,
    metroId,
    projectId: null,
    address: cell("address") || null,
    street: null,
    building: null,
    neighborhoodName: null,
    latitude: number("latitude"),
    longitude: number("longitude"),
    rooms: integer("rooms"),
    bedrooms: null,
    bathrooms: null,
    area: number("area"),
    landArea: number("land_area"),
    floor: integer("floor"),
    totalFloors: integer("total_floors"),
    renovation: enumField("renovation", RENOVATION_LABELS),
    documentStatus: enumField("document", DOCUMENT_STATUS_LABELS),
    buildingType: enumField("building_type", BUILDING_TYPE_LABELS, BUILDING_ALIASES),
    videoUrl: cell("video_url") || null,
    virtualTourUrl: null,
    isFeatured: false,
    featuredUntil: null,
    reservationEnabled: false,
    assignedAgentId: null,
    metaTitle: null,
    metaDescription: null,
    noIndex: false,
    canonicalUrl: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    featureIds,
  };

  // Taksonomiya xətası artıq yazılıbsa sxemin «cuid» xətası təkrar göstərilmir.
  const reported = new Set(errors.map((issue) => issue.field));
  const parsed = propertySchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      const column = SCHEMA_TO_COLUMN[field] ?? field;
      if (reported.has(column)) continue;
      reported.add(column);
      errors.push({ code: "schema", field: column, message: issue.message });
    }
  }

  return {
    line,
    title: candidate.title,
    input: parsed.success && errors.length === 0 ? parsed.data : null,
    images,
    errors,
  };
}

const SCHEMA_TO_COLUMN: Record<string, ImportColumn> = {
  listingType: "listing_type",
  pricePeriod: "price_period",
  typeId: "type",
  cityId: "city",
  districtId: "district",
  metroId: "metro",
  landArea: "land_area",
  totalFloors: "total_floors",
  documentStatus: "document",
  buildingType: "building_type",
  videoUrl: "video_url",
};

/** Başlıq + məlumat sətirlərini yoxlayır. Sətir limiti aşılırsa yalnız başlıq xətası qaytarılır. */
export function mapImportRows(table: string[][], lookups: ImportLookups): ImportParseResult {
  const [header, ...body] = table;
  if (!header) return { headerErrors: [{ code: "empty" }], rows: [] };
  if (body.length > IMPORT_MAX_ROWS) {
    return { headerErrors: [{ code: "tooManyRows", value: String(IMPORT_MAX_ROWS) }], rows: [] };
  }
  const { index, errors } = headerIndex(header);
  if (errors.length > 0) return { headerErrors: errors, rows: [] };
  return { headerErrors: [], rows: body.map((cells, position) => mapRow(cells, index, lookups, position + 2)) };
}

/**
 * Sətrin sabit idxal açarı — məzmunun SHA-256 heşi. Eyni sətir təkrar yükləndikdə eyni
 * açar alınır; başlıq, qiymət və ya şəkil dəyişibsə yeni sətir sayılır.
 */
export async function importRowKey(row: Pick<ImportRow, "input" | "images">): Promise<string | null> {
  if (!row.input) return null;
  const { title, description, listingType, price, currency, typeId, cityId, districtId, area, rooms, floor } = row.input;
  const payload = JSON.stringify([title, description, listingType, price, currency, typeId, cityId, districtId, area, rooms, floor, row.images]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
