import { describe, expect, it } from "vitest";
import {
  isTurnstileResponseValid,
  parseTurnstileHostnames,
  readTurnstileToken,
} from "../turnstile";

const PRODUCTION_HOSTS = new Set(["luxehomeestate.az", "www.luxehomeestate.az"]);

describe("Turnstile cavabı", () => {
  it("uğurlu və doğru action cavabını qəbul edir", () => {
    expect(
      isTurnstileResponseValid(
        { success: true, action: "public_login", hostname: "luxehomeestate.az" },
        "public_login",
        PRODUCTION_HOSTS,
      ),
    ).toBe(true);
  });

  it("action qarışdırılmasını rədd edir", () => {
    expect(
      isTurnstileResponseValid(
        { success: true, action: "contact", hostname: "luxehomeestate.az" },
        "public_login",
        PRODUCTION_HOSTS,
      ),
    ).toBe(false);
  });

  it("uğursuz Cloudflare cavabını rədd edir", () => {
    expect(
      isTurnstileResponseValid(
        { success: false, action: "contact", hostname: "luxehomeestate.az" },
        "contact",
        PRODUCTION_HOSTS,
      ),
    ).toBe(false);
  });

  it("gözlənilməyən hostname-i rədd edir", () => {
    expect(
      isTurnstileResponseValid(
        { success: true, action: "public_login", hostname: "example.com" },
        "public_login",
        PRODUCTION_HOSTS,
      ),
    ).toBe(false);
  });

  it("hostname allowlist dəyərini normallaşdırır", () => {
    expect(parseTurnstileHostnames(" LuxeHomeEstate.az,WWW.LuxeHomeEstate.az. ")).toEqual(
      PRODUCTION_HOSTS,
    );
  });

  it("eyni adlı boş sahədən sonra gələn etibarlı tokeni seçir", () => {
    const formData = new FormData();
    formData.append("cf-turnstile-response", "");
    formData.append("cf-turnstile-response", "etibarli-turnstile-tokeni");

    expect(readTurnstileToken(formData)).toBe("etibarli-turnstile-tokeni");
  });

  it("token yoxdursa null qaytarır", () => {
    expect(readTurnstileToken(new FormData())).toBeNull();
  });
});
