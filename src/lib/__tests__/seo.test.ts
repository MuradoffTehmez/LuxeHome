import { afterEach, describe, expect, it } from "vitest";
import {
  agencySchema,
  articleSchema,
  buildMetadata,
  faqSchema,
  jsonLd,
  organizationSchema,
  propertySchema,
  serializeJsonLd,
  serviceSchema,
  truncateAtWord,
} from "@/lib/seo";
import { resolveSiteBaseUrl, siteUrl } from "@/config/site";
import { getCanonicalHostRedirect } from "@/lib/seo-host";
import { toIsoDateTime } from "@/lib/utils";

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  SITE_URL: process.env.SITE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  IS_STAGING: process.env.IS_STAGING,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("production SEO URL policy", () => {
  it("production-da canonical hostu HTTPS apex domeninə kilidləyir", () => {
    expect(
      resolveSiteBaseUrl({
        nodeEnv: "production",
        staging: false,
        configuredUrl: "http://www.luxehomeestate.az",
      }),
    ).toBe("https://luxehomeestate.az");
  });

  it("staging-də ayrıca HTTPS hostu saxlayır", () => {
    expect(
      resolveSiteBaseUrl({
        nodeEnv: "production",
        staging: true,
        configuredUrl: "https://luxehomeestate-staging.amiyevbahadur.workers.dev",
      }),
    ).toBe("https://luxehomeestate-staging.amiyevbahadur.workers.dev");
  });

  it("www və HTTP sorğusunu query-ni qoruyaraq bir hop-da apex HTTPS-ə yönəldir", () => {
    expect(
      getCanonicalHostRedirect({
        hostname: "www.luxehomeestate.az",
        protocol: "http:",
        pathname: "/emlaklar",
        search: "?sehife=2",
        isProduction: true,
        isStaging: false,
      }),
    ).toBe("https://luxehomeestate.az/emlaklar?sehife=2");
  });

  it("local və staging hostlarını yönləndirmir", () => {
    expect(
      getCanonicalHostRedirect({
        hostname: "localhost",
        protocol: "http:",
        pathname: "/",
        search: "",
        isProduction: false,
        isStaging: false,
      }),
    ).toBeNull();
    expect(
      getCanonicalHostRedirect({
        hostname: "luxehomeestate-staging.amiyevbahadur.workers.dev",
        protocol: "https:",
        pathname: "/",
        search: "",
        isProduction: true,
        isStaging: true,
      }),
    ).toBeNull();
  });
});

describe("buildMetadata", () => {
  it("noindex-follow siyasətini follow-u açıq saxlayaraq qurur", () => {
    const metadata = buildMetadata({
      title: "Filtr nəticələri",
      description: "Filtrlənmiş əmlak nəticələri.",
      path: "/emlaklar?tip=villalar",
      canonicalPath: null,
      indexPolicy: "noindex-follow",
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: true });
    expect(metadata.alternates).toBeUndefined();
  });

  it("private siyasətində indeks və follow-u bağlayır", () => {
    const metadata = buildMetadata({
      title: "Kabinet",
      description: "Şəxsi kabinet.",
      path: "/kabinet",
      indexPolicy: "private",
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("RU səhifəsinə self-canonical və bütün dil alternativlərini verir", () => {
    const metadata = buildMetadata({
      title: "Əmlaklar",
      description: "Əmlak siyahısı.",
      path: "/emlaklar",
      locale: "ru",
    });

    expect(metadata.alternates).toEqual({
      canonical: siteUrl("/ru/emlaklar"),
      languages: {
        az: siteUrl("/az/emlaklar"),
        en: siteUrl("/en/emlaklar"),
        ru: siteUrl("/ru/emlaklar"),
        "x-default": siteUrl("/az/emlaklar"),
      },
    });
    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph).toMatchObject({ locale: "ru_RU" });
  });
});

describe("metadata fallback mətni", () => {
  it("təsviri sözün ortasında deyil, sərhəddə kəsir", () => {
    expect(truncateAtWord("Bir iki üç dörd", 12)).toBe("Bir iki üç…");
    expect(truncateAtWord("Qısa mətn", 50)).toBe("Qısa mətn");
  });

  it("cache-dən mətn kimi gələn tarixi ISO metadata vaxtına çevirir", () => {
    expect(toIsoDateTime("2026-08-24T05:56:25.491+00:00")).toBe(
      "2026-08-24T05:56:25.491Z",
    );
    expect(toIsoDateTime(new Date("2026-08-24T05:56:25.491Z"))).toBe(
      "2026-08-24T05:56:25.491Z",
    );
  });
});

describe("JSON-LD serializer", () => {
  it("boş dəyərləri çıxarır və script injection simvollarını escape edir", () => {
    const serialized = serializeJsonLd({
      name: "Luxe </script><script>alert(1)</script>",
      empty: "",
      missing: undefined,
      children: [null, "", { value: "Əmlak & ev\u2028" }],
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain('"empty"');
    expect(serialized).not.toContain('"missing"');
    expect(serialized).toContain("\\u003c/script\\u003e");
    expect(serialized).toContain("\\u0026");
    expect(serialized).toContain("\\u2028");
    expect(jsonLd({ name: "Luxe" }).dangerouslySetInnerHTML.__html).toBe('{"name":"Luxe"}');
  });
});

describe("structured data kontraktı", () => {
  it("organization schema-da yalnız təsdiqlənmiş NAP saxlayır", () => {
    const schema = organizationSchema();
    expect(schema["@id"]).toBe(`${siteUrl()}/#organization`);
    expect(schema.address.streetAddress).toBe("Əliyar Əliyev 109A");
    expect(schema).not.toHaveProperty("geo");
    expect(schema).not.toHaveProperty("openingHoursSpecification");
  });

  it("əmlakı RealEstateListing, yaşayış vahidi, Offer və location ilə təsvir edir", () => {
    const schema = propertySchema({
      title: "Nərimanovda 3 otaqlı mənzil",
      description: "İşıqlı və geniş mənzil.",
      slug: "nerimanov-3-otaqli",
      price: 250000,
      currency: "AZN",
      listingType: "SALE",
      images: ["https://example.com/home.jpg"],
      city: "Bakı",
      district: "Nərimanov",
      address: "Ağa Nemətulla küçəsi",
      latitude: 40.4,
      longitude: 49.87,
      area: 120,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 2,
      status: "PUBLISHED",
    }, "ru");

    expect(schema["@type"]).toBe("RealEstateListing");
    expect(schema["@id"]).toContain("#listing");
    expect(schema.url).toBe(siteUrl("/ru/emlaklar/nerimanov-3-otaqli"));
    expect(schema.about).toMatchObject({
      "@type": "Residence",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Ağa Nemətulla küçəsi",
        addressLocality: "Bakı",
        addressRegion: "Nərimanov",
        addressCountry: "AZ",
      },
      geo: { "@type": "GeoCoordinates", latitude: 40.4, longitude: 49.87 },
    });
    expect(schema.offers).toMatchObject({ "@type": "Offer", price: 250000 });
  });

  it("məqalə, xidmət, agentlik və FAQ üçün stable id və görünən data yaradır", () => {
    const article = articleSchema({
      title: "Mənzil seçimi",
      description: "Praktik bələdçi",
      slug: "menzil-secimi",
      publishedAt: "2026-08-24T00:00:00Z",
    });
    expect(article).toMatchObject({
      "@type": "BlogPosting",
      "@id": `${siteUrl("/az/blog/menzil-secimi")}#article`,
      publisher: { "@id": `${siteUrl()}/#organization` },
    });
    expect(JSON.stringify(article)).toContain("/logo-full.png");

    expect(serviceSchema({ title: "Əmlak satışı", description: "Satış xidməti", slug: "emlak-satisi" })["@id"]).toContain("#service");
    expect(agencySchema({ name: "Test Agentlik", slug: "test-agentlik", phone: "+994501112233" })).toMatchObject({
      "@type": "RealEstateAgent",
      telephone: "+994501112233",
    });
    expect(faqSchema([{ question: "Sual?", answer: "Cavab." }], "/suallar")).toMatchObject({
      "@type": "FAQPage",
      "@id": `${siteUrl("/az/suallar")}#faq`,
    });
  });
});
