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
        authKind: "PUBLIC",
      },
      new Date(Date.now() + 60_000),
    );

    await expect(verifySessionToken(token)).resolves.toEqual({
      sid: "session-1",
      uid: "user-1",
      role: "EDITOR",
      accountType: ACCOUNT_TYPES.USER,
      authKind: "PUBLIC",
    });
  });

  it("yeni ictimai hesab növlərini (AGENT, CORPORATE) qəbul edir, naməlum növü rədd edir", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    for (const accountType of [ACCOUNT_TYPES.AGENT, ACCOUNT_TYPES.CORPORATE]) {
      const token = await signSessionToken({ sid: "s", uid: "u", role: "EDITOR", accountType, authKind: "PUBLIC" }, expiresAt);
      await expect(verifySessionToken(token)).resolves.toMatchObject({ accountType });
    }
    const forged = await signSessionToken(
      { sid: "s", uid: "u", role: "EDITOR", accountType: "ROBOT" as never, authKind: "PUBLIC" },
      expiresAt,
    );
    await expect(verifySessionToken(forged)).resolves.toBeNull();
  });
});
