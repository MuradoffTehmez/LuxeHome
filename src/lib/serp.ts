import { CURRENCIES, SEO_AUDIT_SEVERITIES, type Locale } from "@/lib/constants";

export const DEFAULT_MIN_INDEXABLE_INVENTORY = 5;
export const DEFAULT_MIN_PROPERTY_IMAGES = 1;
export const DEFAULT_EXPIRED_RETENTION_DAYS = 180;

export type SeoGlobalSettings = {
  siteName: string;
  titleTemplate: string;
  defaultDescription: string;
  canonicalHostname: string;
  defaultLocale: Locale;
  xDefaultLocale: Locale;
  defaultOgImage: string;
  defaultRobotsIndex: boolean;
  defaultRobotsFollow: boolean;
  minLandingInventory: number;
  indexEmptyCategories: boolean;
  minPropertyImages: number;
  expiredRetentionDays: number;
};

export type LocalSeoSettings = {
  businessName: string;
  legalName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  email: string;
  openingHours: string[];
  serviceAreas: string[];
  googleMapsUrl: string;
  googleBusinessProfileUrl: string;
  socialProfiles: string[];
};

export type RobotsSeoSettings = {
  allow: string[];
  disallow: string[];
  sitemap: string;
};

export function parseJsonObject<T extends object>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { ...fallback, ...parsed } as T
      : fallback;
  } catch {
    return fallback;
  }
}

export function normalizePublicPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "/";
  const withoutHost = /^https?:\/\//i.test(trimmed)
    ? new URL(trimmed).pathname
    : trimmed.split(/[?#]/, 1)[0];
  const withSlash = withoutHost.startsWith("/") ? withoutHost : `/${withoutHost}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : "/";
}

export function isCanonicalHttpsUrl(value: string, hostname: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === hostname && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export type PublishableProperty = {
  title: string;
  description: string;
  price: number;
  currency: string;
  typeId: string;
  cityId: string;
  districtId?: string | null;
  rooms?: number | null;
  area?: number | null;
  landArea?: number | null;
  floor?: number | null;
  totalFloors?: number | null;
  address?: string | null;
};

export function roomCountFromTitle(title: string): number | null {
  const match = /(?:^|\s)(\d{1,2})\s*(?:otaq(?:lı|li)?|room)/iu.exec(title);
  return match ? Number(match[1]) : null;
}

export function validatePublishableProperty(
  property: PublishableProperty,
  images: Array<{ url: string; alt?: string | null }>,
  minImages = DEFAULT_MIN_PROPERTY_IMAGES,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!property.title.trim()) errors.title = "Başlıq yazılmalıdır.";
  if (!property.description.trim()) errors.description = "Təsvir yazılmalıdır.";
  if (!(property.price > 0)) errors.price = "Qiymət sıfırdan böyük olmalıdır.";
  if (!Object.values(CURRENCIES).includes(property.currency as never)) {
    errors.currency = "Valyuta icazəli siyahıda deyil.";
  }
  if (!property.typeId) errors.typeId = "Əmlak növü seçilməlidir.";
  if (!property.cityId) errors.cityId = "Şəhər seçilməlidir.";
  if (!(property.rooms != null && property.rooms > 0)) errors.rooms = "Dərc üçün otaq sayı sıfırdan böyük olmalıdır.";
  if (!((property.area != null && property.area > 0) || (property.landArea != null && property.landArea > 0))) {
    errors.area = "Dərc üçün sahə və ya torpaq sahəsi sıfırdan böyük olmalıdır.";
  }
  if (property.floor != null && property.totalFloors != null && property.floor > property.totalFloors) {
    errors.floor = "Mərtəbə ümumi mərtəbə sayından böyük ola bilməz.";
  }
  if (images.length < minImages) errors.images = `Dərc üçün ən azı ${minImages} şəkil lazımdır.`;
  const titleRooms = roomCountFromTitle(property.title);
  if (titleRooms != null && property.rooms != null && titleRooms !== property.rooms) {
    errors.title = `Başlıqdakı ${titleRooms} otaq məlumatı forma dəyəri (${property.rooms}) ilə uyğun deyil.`;
  }
  return errors;
}

function normalizedFingerprintPart(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("az-AZ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** DB-dən asılı olmayan sabit fingerprint; kripto təhlükəsizlik məqsədi daşımır. */
export function propertyContentFingerprint(property: PublishableProperty): string {
  const source = [
    property.address,
    property.cityId,
    property.districtId,
    property.rooms,
    property.area,
    property.landArea,
    property.description,
  ].map(normalizedFingerprintPart).join("|");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function normalizedImageName(input: {
  district: string;
  propertyType: string;
  rooms: number;
  listingId: string;
  index: number;
}): string {
  const slug = (value: string) => normalizedFingerprintPart(value).replace(/\s+/g, "-") || "emlak";
  return `${slug(input.district)}-${slug(input.propertyType)}-${input.rooms}-otaqli-${slug(input.listingId)}-${String(input.index).padStart(2, "0")}.webp`;
}

export function contextualImageAlt(input: {
  district: string;
  propertyType: string;
  rooms: number;
  roomLabel?: string | null;
}): string {
  return `${input.district} rayonunda ${input.rooms} otaqlı ${input.propertyType}${input.roomLabel ? ` — ${input.roomLabel}` : ""}`;
}

export function landingCanBeIndexed(input: {
  indexable: boolean;
  indexEmpty: boolean;
  inventoryCount: number;
  minInventory: number;
  hasUniqueContent: boolean;
}): boolean {
  if (!input.indexable || !input.hasUniqueContent) return false;
  if (input.inventoryCount === 0) return input.indexEmpty;
  return input.inventoryCount >= Math.max(1, input.minInventory);
}

export type RedirectEdge = { fromPath: string; toPath: string; isActive?: boolean };

export function findRedirectChain(
  source: string,
  destination: string,
  rules: RedirectEdge[],
): string[] | null {
  const bySource = new Map(
    rules.filter((rule) => rule.isActive !== false).map((rule) => [normalizePublicPath(rule.fromPath), normalizePublicPath(rule.toPath)]),
  );
  const chain = [normalizePublicPath(source), normalizePublicPath(destination)];
  const visited = new Set(chain.slice(0, 1));
  let current = chain[1];
  for (let depth = 0; depth < 20; depth += 1) {
    if (visited.has(current)) return [...chain, current];
    visited.add(current);
    const next = bySource.get(current);
    if (!next) return chain.length > 2 ? chain : null;
    chain.push(next);
    current = next;
  }
  return chain;
}

export type PageSeoValidationInput = {
  url: string;
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  h1?: string | null;
  content?: string | null;
  imageAlts?: Array<string | null>;
  schema?: unknown;
};

export function validatePageSeo(input: PageSeoValidationInput) {
  const issues: Array<{ type: string; severity: string; message: string }> = [];
  const add = (type: string, severity: string, message: string) => issues.push({ type, severity, message });
  if (!input.title?.trim()) add("MISSING_TITLE", SEO_AUDIT_SEVERITIES.CRITICAL, "SEO başlıq yoxdur.");
  if (!input.description?.trim()) add("MISSING_DESCRIPTION", SEO_AUDIT_SEVERITIES.HIGH, "Meta təsvir yoxdur.");
  if (!input.canonical?.trim()) add("MISSING_CANONICAL", SEO_AUDIT_SEVERITIES.CRITICAL, "Canonical ünvan yoxdur.");
  if (!input.h1?.trim()) add("MISSING_H1", SEO_AUDIT_SEVERITIES.HIGH, "Səhifədə H1 yoxdur.");
  const words = (input.content ?? "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  if (words < 80) add("THIN_CONTENT", SEO_AUDIT_SEVERITIES.MEDIUM, "Görünən məzmun 80 sözdən azdır.");
  if (input.imageAlts?.some((alt) => !alt?.trim())) add("MISSING_ALT", SEO_AUDIT_SEVERITIES.MEDIUM, "Alt mətni olmayan şəkil var.");
  if (input.schema) {
    try { JSON.stringify(input.schema); } catch { add("INVALID_SCHEMA", SEO_AUDIT_SEVERITIES.HIGH, "JSON-LD serialize edilmir."); }
  }
  return issues;
}
