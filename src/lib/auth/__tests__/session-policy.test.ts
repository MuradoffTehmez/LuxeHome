import { describe, expect, it } from "vitest";
import {
  ABSOLUTE_LIFETIME_MS,
  SLIDING_LIFETIME_MS,
  isSessionUsable,
  nextExpiry,
} from "../session-policy";

const base = {
  createdAt: new Date("2026-08-21T10:00:00Z"),
  expiresAt: new Date("2026-08-21T18:00:00Z"),
  revokedAt: null as Date | null,
};

describe("sessiya siyasəti", () => {
  it("müddəti bitməmiş sessiyanı qəbul edir", () => {
    expect(isSessionUsable(base, new Date("2026-08-21T12:00:00Z"))).toBe(true);
  });

  it("müddəti bitmiş sessiyanı rədd edir", () => {
    expect(isSessionUsable(base, new Date("2026-08-21T18:00:01Z"))).toBe(false);
  });

  it("ləğv edilmiş sessiyanı dərhal rədd edir", () => {
    const revoked = { ...base, revokedAt: new Date("2026-08-21T11:00:00Z") };
    expect(isSessionUsable(revoked, new Date("2026-08-21T12:00:00Z"))).toBe(false);
  });

  it("7 günlük mütləq həddi aşan sessiyanı rədd edir", () => {
    const old = { ...base, createdAt: new Date("2026-08-10T10:00:00Z") };
    expect(isSessionUsable(old, new Date("2026-08-21T12:00:00Z"))).toBe(false);
  });

  it("müddətlər spec-lə üst-üstə düşür", () => {
    expect(SLIDING_LIFETIME_MS).toBe(8 * 60 * 60 * 1000);
    expect(ABSOLUTE_LIFETIME_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("müddətin uzadılması", () => {
  it("adi halda 8 saat əlavə edir", () => {
    const createdAt = new Date("2026-08-21T10:00:00Z");
    const now = new Date("2026-08-21T12:00:00Z");
    expect(nextExpiry(createdAt, now).toISOString()).toBe("2026-08-21T20:00:00.000Z");
  });

  it("mütləq həddi keçmir", () => {
    const createdAt = new Date("2026-08-21T10:00:00Z");
    // Mütləq son həd: 28 avqust 10:00. Sürüşən uzatma bundan kənara çıxmamalıdır.
    const now = new Date("2026-08-28T06:00:00Z");
    expect(nextExpiry(createdAt, now).toISOString()).toBe("2026-08-28T10:00:00.000Z");
  });
});
