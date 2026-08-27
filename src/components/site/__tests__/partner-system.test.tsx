import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeaturedPartnership } from "@/components/site/featured-partnership";
import { PartnerBadges } from "@/components/site/partner-badge";
import { PARTNER_STATUSES, PARTNERSHIP_TYPES } from "@/lib/constants";

const treva = {
  id: "cm0treva00000000000000000",
  name: "TREVA",
  slug: "treva",
  shortDescription: null,
  shortDescriptionEn: null,
  shortDescriptionRu: null,
  logoUrl: null,
  logoLight: null,
  logoDark: null,
  partnershipType: PARTNERSHIP_TYPES.OTHER,
  status: PARTNER_STATUSES.ACTIVE,
  verified: true,
  officialPartner: true,
  featured: true,
  showPublicly: true,
  showOnHomepage: true,
  officialSince: null,
  partnershipEndDate: null,
  websiteUrl: "https://treva.realestate/az",
  country: null,
  city: null,
  sortOrder: 0,
};

describe("public tərəfdaş UI", () => {
  it("tək tərəfdaş üçün carousel əvəzinə responsiv premium showcase göstərir", async () => {
    const html = renderToStaticMarkup(await FeaturedPartnership({ partners: [treva], locale: "az" }));
    expect(html).toContain("LUXE HOME ESTATE");
    expect(html).toContain("TREVA");
    expect(html).toContain("Rəsmi tərəfdaş");
    expect(html).toContain("flex-col");
    expect(html).toContain("sm:flex-row");
    expect(html).not.toContain("carousel");
  });

  it("müddəti bitmiş tərəfdaş üçün rəsmi badge göstərmir", async () => {
    const html = renderToStaticMarkup(await PartnerBadges({
      partner: { ...treva, partnershipEndDate: "2020-01-01" },
      locale: "az",
    }));
    expect(html).not.toContain("Rəsmi tərəfdaş");
  });
});
