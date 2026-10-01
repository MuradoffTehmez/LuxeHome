import { describe, expect, it } from "vitest";

import {
  analyticsCookieNames,
  cookieDomainCandidates,
  expiredCookieStrings,
  parseConsentCookie,
  serializeConsentCookie,
} from "@/lib/analytics-consent";

describe("parseConsentCookie", () => {
  it("granted, denied və cookie-nin olmamasını ayırır", () => {
    expect(parseConsentCookie("analytics_consent=granted")).toBe("granted");
    expect(parseConsentCookie("theme=dark; analytics_consent=denied; lhe_x=1")).toBe("denied");
    expect(parseConsentCookie("")).toBe("unset");
    expect(parseConsentCookie("theme=dark")).toBe("unset");
  });

  it("oxşar adlı və naməlum dəyərli cookie-ni seçim saymır", () => {
    expect(parseConsentCookie("x_analytics_consent=granted")).toBe("unset");
    expect(parseConsentCookie("analytics_consent=maybe")).toBe("unset");
    expect(parseConsentCookie("analytics_consent=granted2")).toBe("unset");
  });
});

describe("serializeConsentCookie", () => {
  it("bir illik, SameSite=Lax cookie yazır; Secure yalnız HTTPS-də", () => {
    const secure = serializeConsentCookie("granted", true);
    expect(secure).toBe("analytics_consent=granted; Path=/; Max-Age=31536000; SameSite=Lax; Secure");
    expect(serializeConsentCookie("denied", false)).toBe("analytics_consent=denied; Path=/; Max-Age=31536000; SameSite=Lax");
  });

  it("yazılan sətir yenidən düzgün oxunur", () => {
    const pair = serializeConsentCookie("denied", true).split(";")[0];
    expect(parseConsentCookie(pair)).toBe("denied");
  });
});

describe("analyticsCookieNames", () => {
  it("GA/GTM cookie-lərini tapır, qalanlarına toxunmur", () => {
    const cookies = "analytics_consent=granted; _ga=GA1.1.1; _ga_54KSFRM17B=GS2.1; _gid=x; _gat_gtag_G_1=1; _gcl_au=1; lhe_session=abc; theme=dark";
    expect(analyticsCookieNames(cookies).sort()).toEqual(["_ga", "_ga_54KSFRM17B", "_gat_gtag_G_1", "_gcl_au", "_gid"].sort());
  });

  it("razılıq cookie-sini və sessiyanı silinənlərə salmır", () => {
    expect(analyticsCookieNames("analytics_consent=denied; lhe_session=abc; lhe_2fa=1")).toEqual([]);
    expect(analyticsCookieNames("")).toEqual([]);
  });
});

describe("cookieDomainCandidates / expiredCookieStrings", () => {
  it("host və üst domenləri nöqtəli və nöqtəsiz sınayır", () => {
    expect(cookieDomainCandidates("www.luxehomeestate.az").sort()).toEqual(
      ["", "www.luxehomeestate.az", ".www.luxehomeestate.az", "luxehomeestate.az", ".luxehomeestate.az"].sort(),
    );
    expect(cookieDomainCandidates("luxehomeestate.az")).toContain(".luxehomeestate.az");
  });

  it("localhost, IP və IPv6 üçün Domain atributu yazmır", () => {
    expect(cookieDomainCandidates("localhost")).toEqual([""]);
    expect(cookieDomainCandidates("127.0.0.1")).toEqual([""]);
    expect(cookieDomainCandidates("[::1]")).toEqual([""]);
  });

  it("hər ad və domen üçün vaxtı keçmiş cookie sətri qurur", () => {
    const strings = expiredCookieStrings(["_ga"], "luxehomeestate.az");
    expect(strings).toContain("_ga=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    expect(strings).toContain("_ga=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Domain=.luxehomeestate.az");
    expect(strings.every((value) => value.startsWith("_ga=;"))).toBe(true);
  });
});
