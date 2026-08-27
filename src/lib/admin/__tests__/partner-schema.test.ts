import { describe, expect, it } from "vitest";
import { PARTNER_STATUSES, PARTNERSHIP_TYPES } from "@/lib/constants";
import { partnerContractSchema, partnerSchema } from "@/lib/admin/schemas";

const valid = {
  name: "TREVA",
  legalName: null,
  slug: "treva",
  partnershipType: PARTNERSHIP_TYPES.OTHER,
  status: PARTNER_STATUSES.ACTIVE,
  shortDescription: null,
  shortDescriptionEn: null,
  shortDescriptionRu: null,
  description: null,
  descriptionEn: null,
  descriptionRu: null,
  disclaimer: null,
  disclaimerEn: null,
  disclaimerRu: null,
  websiteUrl: "https://treva.realestate/az",
  email: null,
  phone: null,
  whatsapp: null,
  country: null,
  city: null,
  address: null,
  verified: true,
  officialPartner: true,
  featured: true,
  showPublicly: true,
  showOnHomepage: true,
  officialSince: null,
  partnershipEndDate: null,
  sortOrder: 0,
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  ogImage: null,
};

describe("partner admin validation", () => {
  it("təhlükəsiz məlum TREVA məlumatını qəbul edir", () => {
    expect(partnerSchema.safeParse(valid).success).toBe(true);
  });

  it("rəsmi badge, homepage və tarix ardıcıllığı xətalarını rədd edir", () => {
    expect(partnerSchema.safeParse({ ...valid, verified: false }).success).toBe(false);
    expect(partnerSchema.safeParse({ ...valid, showPublicly: false }).success).toBe(false);
    expect(partnerSchema.safeParse({
      ...valid,
      officialSince: new Date("2026-09-01"),
      partnershipEndDate: new Date("2026-08-01"),
    }).success).toBe(false);
  });

  it("müqavilə bitmə tarixinin başlama tarixindən əvvəl olmasına icazə vermir", () => {
    const result = partnerContractSchema.safeParse({
      contractNumber: null,
      contractStartDate: new Date("2026-09-01"),
      contractEndDate: new Date("2026-08-01"),
      contractDocument: null,
      internalNotes: null,
    });
    expect(result.success).toBe(false);
  });
});
