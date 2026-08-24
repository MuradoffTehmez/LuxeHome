import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/components/site/seo-landing-page", () => ({
  SeoLandingPage: () => null,
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
