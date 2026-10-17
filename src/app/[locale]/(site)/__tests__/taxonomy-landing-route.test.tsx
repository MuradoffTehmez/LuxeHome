import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/components/site/seo-landing-page", () => ({
  SeoLandingPage: () => null,
}));

// Ərazi agentlikləri bloku (#161) öz sorğusunu edir və kart `next/image` işlədir.
vi.mock("@/components/site/area-agencies", () => ({
  AreaAgencies: () => null,
}));

// «Ərazi haqqında» bloku (#240) öz testindədir (`area-insights.integration.test.ts`).
vi.mock("@/components/site/area-insights", () => ({
  AreaInsights: () => null,
}));
vi.mock("@/lib/area-insights", () => ({
  getAreaInsights: async () => ({ total: 0, sale: 0, rent: 0, salePricePerSqm: null, saleSample: 0, monthlyRent: null, rentSample: 0, types: [], related: [] }),
}));

vi.mock("@/lib/queries", () => ({
  getTaxonomyLandingProperties: vi.fn(async (kind: "DISTRICT" | "METRO") => ({
    location: {
      id: "location-1",
      name: kind === "DISTRICT" ? "Nərimanov" : "Gənclik",
      slug: kind === "DISTRICT" ? "baki-nerimanov" : "genclik",
      kind,
      parent: { name: "Bakı" },
    },
    items: [],
    total: 1,
    page: 1,
    pageSize: 12,
    totalPages: 1,
  })),
}));

import DistrictLandingPage, {
  generateMetadata as generateDistrictMetadata,
} from "@/app/[locale]/(site)/rayon/[slug]/page";
import MetroLandingPage from "@/app/[locale]/(site)/metro/[slug]/page";

const searchParams = Promise.resolve({});

describe("az inventarlı taxonomy landing route-ları", () => {
  it("rayon və metro səhifələrini 404 etmədən render edir", async () => {
    await expect(
      DistrictLandingPage({
        params: Promise.resolve({ locale: "az", slug: "baki-nerimanov" }),
        searchParams,
      }),
    ).resolves.toBeTruthy();
    await expect(
      MetroLandingPage({
        params: Promise.resolve({ locale: "az", slug: "genclik" }),
        searchParams,
      }),
    ).resolves.toBeTruthy();
  });

  it("rayon səhifəsini kifayət qədər elan olana qədər noindex saxlayır", async () => {
    const metadata = await generateDistrictMetadata({
      params: Promise.resolve({ locale: "az", slug: "baki-nerimanov" }),
      searchParams,
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: true });
  });
});
