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

  /**
   * Seçim qərəzsiz olmalıdır — bir simvolun digərindən daha tez-tez düşməsi
   * ehtimal sahəsini daraldır. Əvvəlki `byte % 32` yalnız əlifba uzunluğu 256-nı
   * bölən ədəd olduğu üçün işləyirdi; bu test həmin gizli şərtdən asılı deyil.
   */
  it("əlifbanın bütün simvolları təxminən eyni tezlikdə düşür", () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const counts = new Map<string, number>(alphabet.split("").map((char) => [char, 0]));

    // 400 çağırış × 10 kod × 8 simvol = 32 000 nümunə, simvol başına ~1000.
    for (let round = 0; round < 400; round += 1) {
      for (const code of generateBackupCodes()) {
        for (const char of code.replace("-", "")) {
          counts.set(char, (counts.get(char) ?? 0) + 1);
        }
      }
    }

    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
    const expected = total / alphabet.length;
    for (const [char, count] of counts) {
      expect(count, `${char} tezliyi`).toBeGreaterThan(expected * 0.8);
      expect(count, `${char} tezliyi`).toBeLessThan(expected * 1.2);
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
