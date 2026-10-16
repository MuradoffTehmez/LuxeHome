import type { PropertyStatus } from "@/lib/constants";

/** Kabinet kataloqundakı (`account.listings.status.*`) açar — status sabiti camelCase-ə çevrilir. */
export const LISTING_STATUS_KEYS: Record<PropertyStatus, "draft" | "pending" | "needsInfo" | "published" | "reserved" | "suspended" | "expired" | "sold" | "rented" | "archived" | "rejected"> = {
  DRAFT: "draft", PENDING: "pending", PUBLISHED: "published", RESERVED: "reserved",
  SOLD: "sold", RENTED: "rented", ARCHIVED: "archived",
  NEEDS_INFO: "needsInfo", SUSPENDED: "suspended", EXPIRED: "expired", REJECTED: "rejected",
};
