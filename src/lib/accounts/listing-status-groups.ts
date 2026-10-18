import { PROPERTY_STATUSES, type PropertyStatus } from "@/lib/constants";

/**
 * «Elanlarım» səhifəsinin status tabları (UX auditi): elanlar statusa görə qruplaşdırılır ki, düzəliş
 * gözləyən və ya müddəti bitən elan uzun siyahının içində itməsin. Saf modul — test və səhifə eyni qaydanı
 * işlədir. Hər status tam bir qrupa düşür (`Record` — yeni status typecheck-də yıxılır).
 */
export const LISTING_STATUS_GROUPS = ["all", "active", "review", "attention", "closed"] as const;
export type ListingStatusGroup = (typeof LISTING_STATUS_GROUPS)[number];

export const LISTING_STATUS_GROUP: Record<PropertyStatus, Exclude<ListingStatusGroup, "all">> = {
  [PROPERTY_STATUSES.PUBLISHED]: "active",
  [PROPERTY_STATUSES.RESERVED]: "active",
  [PROPERTY_STATUSES.DRAFT]: "review",
  [PROPERTY_STATUSES.PENDING]: "review",
  [PROPERTY_STATUSES.NEEDS_INFO]: "attention",
  [PROPERTY_STATUSES.REJECTED]: "attention",
  [PROPERTY_STATUSES.SUSPENDED]: "attention",
  [PROPERTY_STATUSES.EXPIRED]: "closed",
  [PROPERTY_STATUSES.SOLD]: "closed",
  [PROPERTY_STATUSES.RENTED]: "closed",
  [PROPERTY_STATUSES.ARCHIVED]: "closed",
};

/** URL dəyəri (`?status=`) azərbaycancadır; naməlum dəyər «hamısı»dır. */
const PARAM: Record<ListingStatusGroup, string | null> = { all: null, active: "aktiv", review: "yoxlamada", attention: "diqqet", closed: "baglanmis" };

export function parseListingStatusGroup(value: string | undefined): ListingStatusGroup {
  return LISTING_STATUS_GROUPS.find((group) => PARAM[group] !== null && PARAM[group] === value) ?? "all";
}

export function listingStatusGroupHref(group: ListingStatusGroup): string {
  const param = PARAM[group];
  return param ? `/kabinet/elanlar?status=${param}` : "/kabinet/elanlar";
}

export function countListingStatusGroups(statuses: readonly string[]): Record<ListingStatusGroup, number> {
  const counts: Record<ListingStatusGroup, number> = { all: statuses.length, active: 0, review: 0, attention: 0, closed: 0 };
  for (const status of statuses) {
    const group = LISTING_STATUS_GROUP[status as PropertyStatus];
    if (group) counts[group] += 1;
  }
  return counts;
}

export function inListingStatusGroup(status: string, group: ListingStatusGroup): boolean {
  return group === "all" || LISTING_STATUS_GROUP[status as PropertyStatus] === group;
}
