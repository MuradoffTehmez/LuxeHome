import { beforeEach, describe, expect, it } from "vitest";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { signSessionToken, verifySessionToken } from "../cookies";

beforeEach(() => {
  process.env.AUTH_SECRET = "test-auth-secret-32-bytes-minimum-length";
});

describe("sessiya cookie proyeksiyası", () => {
  it("hesab növünü imzalanmış cookie-dən middleware üçün qaytarır", async () => {
    const token = await signSessionToken(
      {
        sid: "session-1",
        uid: "user-1",
        role: "EDITOR",
        accountType: ACCOUNT_TYPES.USER,
      },
      new Date(Date.now() + 60_000),
    );

    await expect(verifySessionToken(token)).resolves.toEqual({
      sid: "session-1",
      uid: "user-1",
      role: "EDITOR",
      accountType: ACCOUNT_TYPES.USER,
    });
  });
});
