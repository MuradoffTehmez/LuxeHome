import { describe, expect, it } from "vitest";
import { localeFromPathname } from "@/i18n/path-locale";

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
