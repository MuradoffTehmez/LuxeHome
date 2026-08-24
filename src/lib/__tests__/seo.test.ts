import { afterEach, describe, expect, it } from "vitest";
import { buildMetadata, jsonLd, serializeJsonLd } from "@/lib/seo";
import { resolveSiteBaseUrl, siteUrl } from "@/config/site";
import { getCanonicalHostRedirect } from "@/lib/seo-host";

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

  it("RU səhifəsini AZ canonical-a bağlayıb indeksləmir", () => {
    const metadata = buildMetadata({
      title: "Əmlaklar",
      description: "Əmlak siyahısı.",
      path: "/emlaklar",
      locale: "ru",
    });

    expect(metadata.alternates).toEqual({
      canonical: siteUrl("/emlaklar"),
    });
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
    expect(metadata.openGraph).toMatchObject({ locale: "ru_RU" });
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
