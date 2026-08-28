import { describe, expect, it } from "vitest";
import { isTurnstileResponseValid } from "../turnstile";

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
});
