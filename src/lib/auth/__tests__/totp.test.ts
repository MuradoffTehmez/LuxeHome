import { afterEach, describe, expect, it, vi } from "vitest";
import * as OTPAuth from "otpauth";
import {
  buildOtpauthUri,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  normalizeBackupCode,
  verifyTotp,
} from "../totp";

/** Testin özü kodu müstəqil hesablayır — implementasiyanın nəticəsinə güvənmir. */
function codeFor(secret: string, at: number): string {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  return totp.generate({ timestamp: at });
}

const NOW = 1_760_000_000_000;

afterEach(() => {
  vi.useRealTimers();
});

describe("TOTP", () => {
  it("cari kodu qəbul edir və addım nömrəsini qaytarır", () => {
    const secret = generateTotpSecret();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(verifyTotp(secret, codeFor(secret, NOW))).toBe(Math.floor(NOW / 30_000));
  });

  it("bir addım əvvəlki kodu qəbul edir (saat fərqi tolerantlığı)", () => {
    const secret = generateTotpSecret();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(verifyTotp(secret, codeFor(secret, NOW - 30_000))).toBe(Math.floor(NOW / 30_000) - 1);
  });

  it("tolerantlıqdan kənar kodu rədd edir", () => {
    const secret = generateTotpSecret();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(verifyTotp(secret, codeFor(secret, NOW - 5 * 30_000))).toBeNull();
  });

  it("başqa sirrin kodunu rədd edir", () => {
    const secret = generateTotpSecret();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    expect(verifyTotp(secret, codeFor(generateTotpSecret(), NOW))).toBeNull();
  });

  it("uzunluğu səhv olan girişi rədd edir", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "12345")).toBeNull();
    expect(verifyTotp(secret, "")).toBeNull();
  });

  it("otpauth URI-si e-poçtu və sirri daşıyır", () => {
    const uri = buildOtpauthUri("JBSWY3DPEHPK3PXP", "admin@luxehomeestate.az");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("admin%40luxehomeestate.az");
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
  });
});

describe("backup kodlar", () => {
  it("10 unikal kod yaradır", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("qarışdırıla bilən hərflər əlifbada yoxdur", () => {
    for (const code of generateBackupCodes()) {
      expect(code).not.toMatch(/[O0I1]/);
    }
  });

  it("normalizasiya boşluq, defis və registr fərqini udur", () => {
    expect(normalizeBackupCode(" ab3d-9f2k ")).toBe("AB3D9F2K");
    expect(normalizeBackupCode("AB3D9F2K")).toBe("AB3D9F2K");
  });

  it("eyni kod eyni hash verir, fərqli kod fərqli", async () => {
    const first = await hashBackupCode("AB3D-9F2K");
    expect(await hashBackupCode("ab3d9f2k")).toBe(first);
    expect(await hashBackupCode("ZZ22-3344")).not.toBe(first);
  });
});
