import { describe, expect, it } from "vitest";
import { sanitizeTelemetryMessage, sanitizeTelemetryPath } from "../monitoring";

describe("monitorinq məlumatlarının təmizlənməsi", () => {
  it("query və hash hissəsini marşrutdan çıxarır", () => {
    expect(sanitizeTelemetryPath("/az/emlaklar?email=a@b.az#x")).toBe("/az/emlaklar");
  });

  it("mesajdakı şəxsi məlumatları redaktə edir", () => {
    const result = sanitizeTelemetryMessage("a@b.az +994 50 123 45 67 https://x.test/a");
    expect(result).not.toContain("a@b.az");
    expect(result).not.toContain("123 45 67");
    expect(result).not.toContain("x.test");
  });
});
