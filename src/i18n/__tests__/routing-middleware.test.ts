import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Dil marşrutlaşdırması yalnız URL prefiksinə söykənir.
 *
 * `NEXT_LOCALE` cookie-si qəsdən söndürülüb: hər ictimai cavaba `Set-Cookie`
 * əlavə edirdi və Cloudflare `Set-Cookie` daşıyan cavabı keşləmir. Bu testlər
 * cookie-nin geri qayıtmadığını və prefiksin hələ də hörmətlə qarşılandığını
 * yoxlayır.
 */
describe("locale middleware cookie davranışı", () => {
  const middleware = createIntlMiddleware(routing);

  it("ictimai cavaba `NEXT_LOCALE` cookie-si qoymur", () => {
    for (const path of ["/az", "/en/emlaklar", "/ru/bilik-merkezi/suallar"]) {
      const response = middleware(
        new NextRequest(`https://luxehomeestate.az${path}`, {
          headers: { "sec-fetch-dest": "document" },
        }),
      );

      expect(response.headers.get("set-cookie"), path).toBeNull();
      expect(response.cookies.get("NEXT_LOCALE"), path).toBeUndefined();
    }
  });

  it("gələn `NEXT_LOCALE` cookie-si URL prefiksini üstələmir", () => {
    const response = middleware(
      new NextRequest("https://luxehomeestate.az/en/emlaklar", {
        headers: { cookie: "NEXT_LOCALE=ru", "sec-fetch-dest": "document" },
      }),
    );

    // Prefiks qalır: yönləndirmə yoxdur, cavab `/en` üçündür
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("Accept-Language prefikssiz ünvanı öz dilinə çəkmir", () => {
    const response = middleware(
      new NextRequest("https://luxehomeestate.az/", {
        headers: { "accept-language": "ru-RU,ru;q=0.9", "sec-fetch-dest": "document" },
      }),
    );

    expect(response.headers.get("location")).toContain("/az");
  });

  it("konfiqurasiya cookie-ni və dil təxminini söndürülmüş saxlayır", () => {
    expect(routing.localeCookie).toBe(false);
    expect(routing.localeDetection).toBe(false);
  });
});

describe("locale middleware SEO siqnalları", () => {
  it("hreflang üçün HTML metadata-nı yeganə mənbə saxlayır", () => {
    const middleware = createIntlMiddleware(routing);
    const response = middleware(
      new NextRequest("https://luxehomeestate.az/az/emlaklar"),
    );

    expect(response.headers.get("Link")).toBeNull();
  });
});
