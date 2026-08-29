import { describe, expect, it } from "vitest";
import { isTurnstileResponseValid, readTurnstileToken } from "../turnstile";

describe("Turnstile cavabı", () => {
  it("uğurlu və doğru action cavabını qəbul edir", () => {
    expect(isTurnstileResponseValid({ success: true, action: "public_login" }, "public_login")).toBe(true);
  });

  it("action qarışdırılmasını rədd edir", () => {
    expect(isTurnstileResponseValid({ success: true, action: "contact" }, "public_login")).toBe(false);
  });

  it("uğursuz Cloudflare cavabını rədd edir", () => {
    expect(isTurnstileResponseValid({ success: false, action: "contact" }, "contact")).toBe(false);
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
