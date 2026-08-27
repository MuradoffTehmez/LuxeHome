import {
  DEFAULT_LOCALE,
  PARTNER_FILTER_GROUPS,
  PARTNER_RELATION_ROLES,
  PARTNER_STATUSES,
  PARTNERSHIP_TYPES,
  type Locale,
  type PartnerFilterGroupSlug,
  type PartnerRelationRole,
  type PartnershipType,
  type PartnerStatus,
} from "@/lib/constants";

/**
 * Tərəfdaşlıq domen qaydaları.
 *
 * Modul qəsdən saf funksiyalardan ibarətdir: Prisma, `next/headers` və heç bir
 * binding idxal etmir. Səbəb — «Rəsmi tərəfdaş» nişanının şərtləri həm sorğu
 * qatında (`queries.ts`), həm komponentlərdə, həm də cron işində eyni cür
 * hesablanmalıdır; məntiq bir yerdə olmasa üç yerdə ayrı-ayrı sürüşər.
 */

// ---------------------------------------------------------------------------
// GÖRÜNÜŞ QAYDALARI
// ---------------------------------------------------------------------------

/** `isOfficialPartnerVisible` və `isPartnerPubliclyVisible`-in gözlədiyi minimum sahə dəsti. */
export type PartnerVisibilityInput = {
  status: string;
  verified: boolean;
  officialPartner: boolean;
  showPublicly: boolean;
  partnershipEndDate: Date | string | null;
  deletedAt?: Date | string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const BAKU_UTC_OFFSET_MS = 4 * 60 * 60 * 1000;

function toTime(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Müqavilə müddəti bitibmi.
 *
 * `partnershipEndDate` **günün sonuna qədər** etibarlıdır: sahə tarixdir, an deyil,
 * ona görə son günün səhəri tərəfdaşı «müddəti bitmiş» saymaq yanlış olardı.
 */
export function isPartnershipExpired(
  partner: Pick<PartnerVisibilityInput, "partnershipEndDate">,
  now: Date = new Date(),
): boolean {
  const end = toTime(partner.partnershipEndDate);
  if (end === null) return false;
  const endDate = new Date(end);
  const endDay = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  );
  const bakuNow = new Date(now.getTime() + BAKU_UTC_OFFSET_MS);
  const todayInBaku = Date.UTC(
    bakuNow.getUTCFullYear(),
    bakuNow.getUTCMonth(),
    bakuNow.getUTCDate(),
  );
  return todayInBaku > endDay;
}

/**
 * Tərəfdaşın ictimai profilinin göstərilə biləcəyi.
 *
 * Silinmiş, qaralama, gözləyən, dayandırılmış və xitam verilmiş tərəfdaşlar
 * saytda görünmür; `showPublicly` söndürülübsə status ACTIVE olsa belə görünmür.
 * Müddəti bitmiş müqavilə status hələ `ACTIVE` qalsa da profili bağlayır —
 * cron gecikə bilər, qayda gecikməməlidir.
 */
export function isPartnerPubliclyVisible(
  partner: PartnerVisibilityInput,
  now: Date = new Date(),
): boolean {
  if (partner.deletedAt != null) return false;
  if (partner.status !== PARTNER_STATUSES.ACTIVE) return false;
  if (!partner.showPublicly) return false;
  return !isPartnershipExpired(partner, now);
}

/**
 * «Rəsmi tərəfdaş» nişanının göstərilə biləcəyi.
 *
 * Dörd bayraq **birlikdə** tələb olunur (`status = ACTIVE`, `officialPartner`,
 * `verified`, `showPublicly`) və müqavilə müddəti keçməmiş olmalıdır. Nişan
 * hüquqi iddiadır: bir sahənin təsadüfən işarələnməsi onu göstərməyə kifayət etməməlidir.
 */
export function isOfficialPartnerVisible(
  partner: PartnerVisibilityInput,
  now: Date = new Date(),
): boolean {
  if (!isPartnerPubliclyVisible(partner, now)) return false;
  return partner.officialPartner && partner.verified;
}

/**
 * Cron üçün: statusun `EXPIRED`-ə keçirilməli olduğu.
 *
 * Yalnız `ACTIVE` tərəfdaş avtomatik dəyişdirilir — `SUSPENDED`/`TERMINATED`
 * qərarları admin verib, avtomatika onları üstələməməlidir.
 */
export function shouldMarkExpired(
  partner: Pick<PartnerVisibilityInput, "status" | "partnershipEndDate"> & {
    deletedAt?: Date | string | null;
  },
  now: Date = new Date(),
): boolean {
  if (partner.deletedAt != null) return false;
  if (partner.status !== PARTNER_STATUSES.ACTIVE) return false;
  return isPartnershipExpired(partner, now);
}

/**
 * Paneldə xəbərdarlıq üçün: müqaviləyə neçə gün qalıb.
 * Tarix yoxdursa `null`, keçibsə mənfi ədəd qaytarır.
 */
export function daysUntilPartnershipEnd(
  partner: Pick<PartnerVisibilityInput, "partnershipEndDate">,
  now: Date = new Date(),
): number | null {
  const end = toTime(partner.partnershipEndDate);
  if (end === null) return null;
  const endDate = new Date(end);
  const endDay = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  );
  const bakuNow = new Date(now.getTime() + BAKU_UTC_OFFSET_MS);
  const todayInBaku = Date.UTC(
    bakuNow.getUTCFullYear(),
    bakuNow.getUTCMonth(),
    bakuNow.getUTCDate(),
  );
  return Math.round((endDay - todayInBaku) / DAY_MS);
}

/** Paneldə «bitməsinə az qalıb» xəbərdarlığının açıldığı hədd. */
export const PARTNERSHIP_EXPIRY_WARNING_DAYS = 30;

// ---------------------------------------------------------------------------
// ÇOXDİLLİ MƏZMUN
// ---------------------------------------------------------------------------

type LocalizedPartnerFields = {
  shortDescription: string | null;
  shortDescriptionEn: string | null;
  shortDescriptionRu: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionRu: string | null;
  disclaimer: string | null;
  disclaimerEn: string | null;
  disclaimerRu: string | null;
};

function pickLocalized(
  az: string | null,
  en: string | null,
  ru: string | null,
  locale: Locale,
): string | null {
  const value = locale === "en" ? en : locale === "ru" ? ru : az;
  // Tərcümə boşdursa mənbə dilinə düşülür — ziyarətçiyə boş blok göstərilməməlidir.
  return (value?.trim() ? value : az?.trim() ? az : null) ?? null;
}

/** Tərəfdaşın prose sahələrini seçilmiş dilə görə həll edir. */
export function localizePartnerContent<T extends Partial<LocalizedPartnerFields>>(
  partner: T,
  locale: Locale = DEFAULT_LOCALE,
): { shortDescription: string | null; description: string | null; disclaimer: string | null } {
  return {
    shortDescription: pickLocalized(
      partner.shortDescription ?? null,
      partner.shortDescriptionEn ?? null,
      partner.shortDescriptionRu ?? null,
      locale,
    ),
    description: pickLocalized(
      partner.description ?? null,
      partner.descriptionEn ?? null,
      partner.descriptionRu ?? null,
      locale,
    ),
    disclaimer: pickLocalized(
      partner.disclaimer ?? null,
      partner.disclaimerEn ?? null,
      partner.disclaimerRu ?? null,
      locale,
    ),
  };
}

// ---------------------------------------------------------------------------
// TİP VƏ FİLTR
// ---------------------------------------------------------------------------

const KNOWN_TYPES = new Set<string>(Object.values(PARTNERSHIP_TYPES));

/** Naməlum dəyəri `OTHER`-a endirir — bazadakı köhnə sətir UI-ı çökdürməməlidir. */
export function normalizePartnershipType(value: string | null | undefined): PartnershipType {
  return value && KNOWN_TYPES.has(value)
    ? (value as PartnershipType)
    : PARTNERSHIP_TYPES.OTHER;
}

const KNOWN_STATUSES = new Set<string>(Object.values(PARTNER_STATUSES));

export function normalizePartnerStatus(value: string | null | undefined): PartnerStatus {
  return value && KNOWN_STATUSES.has(value)
    ? (value as PartnerStatus)
    : PARTNER_STATUSES.DRAFT;
}

/**
 * Bazadakı rol sətrini i18n açarına çevirən xəritə.
 *
 * Eyniliklə görünsə də əl ilə yazılıb: `Record<PartnerRelationRole, ...>` tipi
 * yeni rol əlavə ediləndə tərcümə açarını unutmağı kompilyasiya vaxtı tutur.
 * Naməlum dəyər üçün çağıran tərəf `?? "OTHER"` istifadə edir.
 */
export const PARTNER_RELATION_ROLE_KEYS: Record<PartnerRelationRole, PartnerRelationRole> = {
  SOURCE: PARTNER_RELATION_ROLES.SOURCE,
  BROKER: PARTNER_RELATION_ROLES.BROKER,
  CO_BROKER: PARTNER_RELATION_ROLES.CO_BROKER,
  DEVELOPER: PARTNER_RELATION_ROLES.DEVELOPER,
  EXCLUSIVE_SALES: PARTNER_RELATION_ROLES.EXCLUSIVE_SALES,
  SALES_PARTNER: PARTNER_RELATION_ROLES.SALES_PARTNER,
  MARKETING_PARTNER: PARTNER_RELATION_ROLES.MARKETING_PARTNER,
  MANAGEMENT_PARTNER: PARTNER_RELATION_ROLES.MANAGEMENT_PARTNER,
  OTHER: PARTNER_RELATION_ROLES.OTHER,
};

/** Naməlum rol dəyərini `OTHER`-a endirir. */
export function normalizeRelationRole(value: string | null | undefined): PartnerRelationRole {
  return value && value in PARTNER_RELATION_ROLE_KEYS
    ? (value as PartnerRelationRole)
    : PARTNER_RELATION_ROLES.OTHER;
}

/** `?tip=` query dəyərini icazəli filtr qrupuna çevirir; naməlum dəyər `null` olur. */
export function parsePartnerFilterGroup(
  value: string | null | undefined,
): PartnerFilterGroupSlug | null {
  if (!value) return null;
  const group = PARTNER_FILTER_GROUPS.find((item) => item.slug === value);
  return group ? group.slug : null;
}

/** Filtr qrupunun əhatə etdiyi `partnershipType` dəyərləri. */
export function partnershipTypesForGroup(
  slug: PartnerFilterGroupSlug | null,
): PartnershipType[] | null {
  if (!slug) return null;
  const group = PARTNER_FILTER_GROUPS.find((item) => item.slug === slug);
  return group ? [...group.types] : null;
}

// ---------------------------------------------------------------------------
// LOQO
// ---------------------------------------------------------------------------

export type PartnerLogoSource = {
  logoUrl: string | null;
  logoLight: string | null;
  logoDark: string | null;
};

/**
 * Tema üzrə loqo variantları.
 *
 * `light`/`dark` ayrıca verilməyibsə hər ikisi əsas loqoya düşür və komponent
 * tək şəkil göstərir — eyni faylı iki dəfə yükləməyin mənası yoxdur.
 */
export function partnerLogoVariants(partner: PartnerLogoSource): {
  light: string | null;
  dark: string | null;
  hasThemeVariants: boolean;
  hasDarkOnly: boolean;
} {
  const base = partner.logoUrl?.trim() || null;
  const light = partner.logoLight?.trim() || base;
  const dark = partner.logoDark?.trim() || base;
  return {
    light,
    dark,
    hasThemeVariants: light !== dark && light != null && dark != null,
    hasDarkOnly: base == null && light == null && dark != null,
  };
}

// ---------------------------------------------------------------------------
// DUBLİKAT YOXLAMASI
// ---------------------------------------------------------------------------

/**
 * Ünvandan müqayisə üçün normallaşdırılmış domen çıxarır.
 *
 * `https://www.TREVA.realestate/az` və `https://treva.realestate` eyni şirkətdir —
 * dublikat xəbərdarlığı bunu görməlidir. Ünvan düzgün deyilsə `null` qaytarılır.
 */
export function partnerDomain(websiteUrl: string | null | undefined): string | null {
  if (!websiteUrl?.trim()) return null;
  try {
    const url = new URL(websiteUrl.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (!host) return null;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

/** Hüquqi ad müqayisəsi üçün — reqistr, artıq boşluq və durğu işarələri kənarlaşdırılır. */
export function normalizeLegalName(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value
    .toLocaleLowerCase("az-AZ")
    .replace(/[.,"'«»()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
