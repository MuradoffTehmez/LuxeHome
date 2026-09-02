import { describe, expect, it } from "vitest";
import { canStartStaffSession, twoFactorGateOutcome } from "../two-factor-policy";
import { LOCK_DURATION_MS } from "../lockout";

/**
 * Bu iki qayda auditdə (T-1, T-2) aşkarlanmış yan keçmə yollarını bağlayır.
 * Hər ikisi səssiz sınır — pozulsa nə build, nə də tipyoxlaması xəbər verir,
 * ona görə davranış burada sabitlənir.
 */

describe("əməkdaş sessiyasının açılma şərti", () => {
  it("TOTP qurulmayıbsa sessiya açılmır", () => {
    expect(canStartStaffSession({ totpEnabledAt: null })).toBe(false);
  });

  it("TOTP qurulubsa sessiya açılır", () => {
    expect(canStartStaffSession({ totpEnabledAt: new Date("2026-09-01T10:00:00Z") })).toBe(true);
  });
});

describe("ikinci mərhələ qapısı", () => {
  const now = new Date("2026-09-02T12:00:00Z");

  it("sürət limiti aşılıbsa kod yoxlanmır", () => {
    expect(
      twoFactorGateOutcome({ withinRateLimit: false, lockedUntil: null, now }),
    ).toBe("RATE_LIMITED");
  });

  it("hesab kilidlidirsə kod yoxlanmır", () => {
    const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
    expect(
      twoFactorGateOutcome({ withinRateLimit: true, lockedUntil, now }),
    ).toBe("LOCKED");
  });

  it("kilid müddəti bitibsə yoxlamaya buraxır", () => {
    const lockedUntil = new Date(now.getTime() - 1);
    expect(
      twoFactorGateOutcome({ withinRateLimit: true, lockedUntil, now }),
    ).toBe("PROCEED");
  });

  it("limit içində və kilidsiz hesab yoxlamaya buraxılır", () => {
    expect(
      twoFactorGateOutcome({ withinRateLimit: true, lockedUntil: null, now }),
    ).toBe("PROCEED");
  });

  it("sürət limiti kilid yoxlamasından öndə gəlir", () => {
    const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
    expect(
      twoFactorGateOutcome({ withinRateLimit: false, lockedUntil, now }),
    ).toBe("RATE_LIMITED");
  });
});
