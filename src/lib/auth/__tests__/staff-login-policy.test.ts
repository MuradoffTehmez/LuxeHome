import { describe, expect, it } from "vitest";
import { verifyStaffPassword } from "../staff-login-policy";

describe("staff girişində parol yoxlaması", () => {
  it("aktiv ictimai hesabın hash-ını generik rədddən əvvəl yoxlayır", async () => {
    const result = await verifyStaffPassword(
      { passwordHash: "public-hash" },
      "parol",
      async (password, hash) => password === "parol" && hash === "public-hash",
      "dummy-hash",
    );

    expect(result).toBe(true);
  });

  it("mövcud olmayan hesab üçün dummy hash yoxlayır", async () => {
    const result = await verifyStaffPassword(
      null,
      "parol",
      async (password, hash) => password === "parol" && hash === "dummy-hash",
      "dummy-hash",
    );

    expect(result).toBe(true);
  });
});
