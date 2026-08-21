import { describe, expect, it } from "vitest";
import {
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  isLockActive,
  lockUntil,
  shouldLock,
} from "../lockout";

describe("hesab kilidi", () => {
  it("hədd altında kilidləmir", () => {
    expect(shouldLock(0)).toBe(false);
    expect(shouldLock(4)).toBe(false);
  });

  it("5-ci uğursuz cəhddə kilidləyir", () => {
    expect(MAX_FAILED_ATTEMPTS).toBe(5);
    expect(shouldLock(5)).toBe(true);
    expect(shouldLock(9)).toBe(true);
  });

  it("kilid 15 dəqiqə davam edir", () => {
    expect(LOCK_DURATION_MS).toBe(15 * 60 * 1000);
    expect(lockUntil(new Date("2026-08-21T10:00:00Z")).toISOString()).toBe(
      "2026-08-21T10:15:00.000Z",
    );
  });

  it("kilid müddəti bitəndə hesab açılır", () => {
    const until = new Date("2026-08-21T10:15:00Z");
    expect(isLockActive(until, new Date("2026-08-21T10:14:59Z"))).toBe(true);
    expect(isLockActive(until, new Date("2026-08-21T10:15:00Z"))).toBe(false);
  });

  it("kilid qoyulmayıbsa aktiv saymır", () => {
    expect(isLockActive(null, new Date())).toBe(false);
  });
});
