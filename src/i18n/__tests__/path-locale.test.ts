import { describe, expect, it } from "vitest";
import {
  canonicalAdminPath,
  localeFromPathname,
  localizePath,
  pathnameWithoutLocale,
} from "@/i18n/path-locale";

describe("public route content language", () => {
  it.each([
    ["/", "az"],
    ["/emlaklar", "az"],
    ["/en/suallar", "en"],
    ["/ru/emlaklar/test", "ru"],
  ])("%s route-u üçün %s qaytarır", (pathname, locale) => {
    expect(localeFromPathname(pathname)).toBe(locale);
  });
});

describe("locale-prefiksli marşrutlar", () => {
  it.each([
    ["/kabinet", "az", "/az/kabinet"],
    ["/kabinet/elanlar", "en", "/en/kabinet/elanlar"],
    ["/daxil-ol?davam=%2Fru%2Fkabinet", "ru", "/ru/daxil-ol?davam=%2Fru%2Fkabinet"],
    ["/", "az", "/az"],
  ] as const)("%s yolunu %s dili ilə %s edir", (path, locale, expected) => {
    expect(localizePath(path, locale)).toBe(expected);
  });

  it.each([
    ["/az/kabinet", "/kabinet"],
    ["/en/kabinet/elanlar", "/kabinet/elanlar"],
    ["/ru", "/"],
    ["/admin", "/admin"],
  ] as const)("%s yolundan locale seqmentini çıxarır", (path, expected) => {
    expect(pathnameWithoutLocale(path)).toBe(expected);
  });
});

describe("canonicalAdminPath", () => {
  it("locale prefiksli admin yolunu query ilə birlikdə kanonikləşdirir", () => {
    expect(canonicalAdminPath("/az/admin/audit", "?sehife=2")).toBe("/admin/audit?sehife=2");
  });

  it("kanonik və ictimai yolları dəyişmir", () => {
    expect(canonicalAdminPath("/admin/audit", "?sehife=2")).toBeNull();
    expect(canonicalAdminPath("/az/elaqe")).toBeNull();
  });
});
