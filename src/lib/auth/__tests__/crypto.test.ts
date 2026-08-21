import { describe, expect, it } from "vitest";
import { decryptString, encryptString, fromBase64Url, timingSafeEqual, toBase64Url } from "../crypto";

const SECRET = "test-auth-secret-32-bytes-minimum-length";

describe("AES-GCM şifrələmə", () => {
  it("şifrələyib açanda ilkin dəyəri verir", async () => {
    const payload = await encryptString("JBSWY3DPEHPK3PXP", SECRET, "totp-secret-v1");
    expect(payload.startsWith("v1$")).toBe(true);
    expect(await decryptString(payload, SECRET, "totp-secret-v1")).toBe("JBSWY3DPEHPK3PXP");
  });

  it("başqa secret ilə açıla bilmir", async () => {
    const payload = await encryptString("gizli", SECRET, "totp-secret-v1");
    await expect(decryptString(payload, "başqa-secret", "totp-secret-v1")).rejects.toThrow();
  });

  it("başqa məqsəd açarı ilə açıla bilmir", async () => {
    const payload = await encryptString("gizli", SECRET, "totp-secret-v1");
    await expect(decryptString(payload, SECRET, "başqa-məqsəd")).rejects.toThrow();
  });

  it("hər şifrələmə fərqli IV işlədir", async () => {
    const first = await encryptString("eyni", SECRET, "totp-secret-v1");
    const second = await encryptString("eyni", SECRET, "totp-secret-v1");
    expect(first).not.toBe(second);
  });

  it("formatı tanınmayan dəyəri rədd edir", async () => {
    await expect(decryptString("zibil", SECRET, "totp-secret-v1")).rejects.toThrow();
  });
});

describe("base64url", () => {
  it("gedər-gələr çevrilmə baytları qoruyur", () => {
    const bytes = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255, 62, 63]);
    expect([...fromBase64Url(toBase64Url(bytes))]).toEqual([...bytes]);
  });
});

describe("sabit vaxtlı müqayisə", () => {
  it("eyni baytları uyğun sayır", () => {
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
  });

  it("fərqli baytı rədd edir", () => {
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
  });

  it("fərqli uzunluğu rədd edir", () => {
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  });
});
