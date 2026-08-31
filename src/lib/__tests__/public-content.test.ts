import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryArgs = {
  where?: { isDemo?: boolean; slug?: string };
  include?: {
    _count?: {
      select?: {
        properties?: { where?: { isDemo?: boolean } };
        posts?: { where?: { isDemo?: boolean } };
      };
    };
  };
};

const database = vi.hoisted(() => ({
  propertyFindMany: vi.fn(),
  propertyFindFirst: vi.fn(),
  propertyCount: vi.fn(),
  propertyAggregate: vi.fn(),
  propertyGroupBy: vi.fn(),
  projectFindMany: vi.fn(),
  projectFindFirst: vi.fn(),
  blogPostFindMany: vi.fn(),
  blogPostFindFirst: vi.fn(),
  blogPostCount: vi.fn(),
  propertyTypeFindMany: vi.fn(),
  blogCategoryFindMany: vi.fn(),
  serviceFindMany: vi.fn(),
  agencyFindMany: vi.fn(),
  agentProfileFindMany: vi.fn(),
  seoLandingPageFindMany: vi.fn(),
  locationFindMany: vi.fn(),
  partnerFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findMany: database.propertyFindMany,
      findFirst: database.propertyFindFirst,
      count: database.propertyCount,
      aggregate: database.propertyAggregate,
      groupBy: database.propertyGroupBy,
    },
    project: {
      findMany: database.projectFindMany,
      findFirst: database.projectFindFirst,
    },
    blogPost: {
      findMany: database.blogPostFindMany,
      findFirst: database.blogPostFindFirst,
      count: database.blogPostCount,
    },
    propertyType: { findMany: database.propertyTypeFindMany },
    blogCategory: { findMany: database.blogCategoryFindMany },
    service: { findMany: database.serviceFindMany },
    agency: { findMany: database.agencyFindMany },
    agentProfile: { findMany: database.agentProfileFindMany },
    seoLandingPage: { findMany: database.seoLandingPageFindMany },
    location: { findMany: database.locationFindMany },
    partner: { findMany: database.partnerFindMany },
  },
}));

import {
  getBlogCategories,
  getPostBySlug,
  getPosts,
  getProjectBySlug,
  getProjects,
  getProperties,
  getPropertyBySlug,
  getPropertyTypesWithCounts,
  getSitemapEntries,
} from "../queries";

const realProperty = {
  id: "property-real",
  title: "Real əmlak",
  slug: "real-emlak",
  listingType: "SALE",
  status: "PUBLISHED",
  price: 250000,
  currency: "AZN",
  pricePeriod: null,
  rooms: 3,
  area: 120,
  landArea: null,
  floor: 4,
  totalFloors: 12,
  isFeatured: true,
  isDemo: false,
  publishedAt: new Date("2026-08-20T00:00:00.000Z"),
  createdAt: new Date("2026-08-20T00:00:00.000Z"),
  updatedAt: new Date("2026-08-20T00:00:00.000Z"),
  type: { name: "Mənzil", slug: "menzil" },
  city: { name: "Bakı", slug: "baki" },
  district: { name: "Nərimanov", slug: "nerimanov" },
  images: [],
};

const demoProperty = {
  ...realProperty,
  id: "property-demo",
  title: "[Nümunə] Əmlak",
  slug: "numune-emlak",
  isDemo: true,
};

const realProject = {
  id: "project-real",
  name: "Real layihə",
  slug: "real-layihe",
  summary: "Real layihə təsviri",
  projectType: "RESIDENTIAL",
  status: "ONGOING",
  year: 2026,
  coverUrl: null,
  isDemo: false,
  updatedAt: new Date("2026-08-20T00:00:00.000Z"),
  city: { name: "Bakı" },
};

const demoProject = {
  ...realProject,
  id: "project-demo",
  name: "[Nümunə] Layihə",
  slug: "numune-layihe",
  isDemo: true,
};

const realPost = {
  id: "post-real",
  title: "Real məqalə",
  slug: "real-meqale",
  excerpt: "Real məqalə xülasəsi",
  coverUrl: null,
  coverAlt: null,
  readMinutes: 4,
  publishedAt: new Date("2026-08-20T00:00:00.000Z"),
  updatedAt: new Date("2026-08-20T00:00:00.000Z"),
  isDemo: false,
  category: { name: "Məsləhətlər", slug: "meslehetler" },
};

const demoPost = {
  ...realPost,
  id: "post-demo",
  title: "[Nümunə] Məqalə",
  slug: "numune-meqale",
  isDemo: true,
};

function onlyPublic<T>(args: QueryArgs, real: T, demo: T): T[] {
  return args.where?.isDemo === false ? [real] : [demo, real];
}

describe("ictimai məzmun sərhədi", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    database.propertyFindMany.mockImplementation(async (args: QueryArgs) =>
      onlyPublic(args, realProperty, demoProperty),
    );
    database.propertyCount.mockImplementation(async (args: QueryArgs) =>
      args.where?.isDemo === false ? 1 : 2,
    );
    database.propertyAggregate.mockResolvedValue({ _count: { _all: 1 }, _max: { updatedAt: null } });
    database.propertyGroupBy.mockResolvedValue([]);
    database.locationFindMany.mockResolvedValue([]);
    database.projectFindMany.mockImplementation(async (args: QueryArgs) =>
      onlyPublic(args, realProject, demoProject),
    );
    database.blogPostFindMany.mockImplementation(async (args: QueryArgs) =>
      onlyPublic(args, realPost, demoPost),
    );
    database.blogPostCount.mockImplementation(async (args: QueryArgs) =>
      args.where?.isDemo === false ? 1 : 2,
    );

    database.propertyFindFirst.mockImplementation(async (args: QueryArgs) =>
      args.where?.slug === demoProperty.slug && args.where.isDemo !== false
        ? demoProperty
        : null,
    );
    database.projectFindFirst.mockImplementation(async (args: QueryArgs) =>
      args.where?.slug === demoProject.slug && args.where.isDemo !== false
        ? demoProject
        : null,
    );
    database.blogPostFindFirst.mockImplementation(async (args: QueryArgs) =>
      args.where?.slug === demoPost.slug && args.where.isDemo !== false ? demoPost : null,
    );

    database.propertyTypeFindMany.mockImplementation(async (args: QueryArgs) => [
      {
        id: "type-apartment",
        name: "Mənzil",
        slug: "menzil",
        isActive: true,
        _count: {
          properties:
            args.include?._count?.select?.properties?.where?.isDemo === false ? 1 : 2,
        },
      },
    ]);
    database.blogCategoryFindMany.mockImplementation(async (args: QueryArgs) => [
      {
        id: "category-advice",
        name: "Məsləhətlər",
        slug: "meslehetler",
        _count: {
          posts: args.include?._count?.select?.posts?.where?.isDemo === false ? 1 : 2,
        },
      },
    ]);
    database.serviceFindMany.mockResolvedValue([]);
    database.agencyFindMany.mockResolvedValue([]);
    database.agentProfileFindMany.mockResolvedValue([]);
    database.seoLandingPageFindMany.mockResolvedValue([]);
    database.partnerFindMany.mockResolvedValue([]);
  });

  it("siyahı və sitemap nəticələrində demo qeydləri göstərmir", async () => {
    const [properties, projects, posts, sitemap] = await Promise.all([
      getProperties(),
      getProjects(),
      getPosts(),
      getSitemapEntries(),
    ]);

    expect(properties.items.map((item) => item.id)).toEqual(["property-real"]);
    expect(projects.map((item) => item.id)).toEqual(["project-real"]);
    expect(posts.items.map((item) => item.id)).toEqual(["post-real"]);
    expect(sitemap.properties.map((item) => item.slug)).toEqual(["real-emlak"]);
    expect(sitemap.projects.map((item) => item.slug)).toEqual(["real-layihe"]);
    expect(sitemap.posts.map((item) => item.slug)).toEqual(["real-meqale"]);
  });

  it("demo detail URL-lərini ictimai səhifə kimi açmır", async () => {
    const [property, project, post] = await Promise.all([
      getPropertyBySlug(demoProperty.slug),
      getProjectBySlug(demoProject.slug),
      getPostBySlug(demoPost.slug),
    ]);

    expect(property).toBeNull();
    expect(project).toBeNull();
    expect(post).toBeNull();
  });

  it("kateqoriya saylarında demo qeydləri nəzərə almır", async () => {
    const [propertyTypes, blogCategories] = await Promise.all([
      getPropertyTypesWithCounts(),
      getBlogCategories(),
    ]);

    expect(propertyTypes[0]._count.properties).toBe(1);
    expect(blogCategories[0]._count.posts).toBe(1);
  });
});
