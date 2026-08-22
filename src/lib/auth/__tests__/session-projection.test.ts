import { describe, expect, it } from "vitest";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { matchesSessionProjection } from "../session-projection";

const claims = {
  sid: "session-1",
  uid: "user-1",
  role: "EDITOR",
  accountType: ACCOUNT_TYPES.USER,
  authKind: "PUBLIC" as const,
};

const resolved = {
  id: "user-1",
  role: "EDITOR",
  accountType: ACCOUNT_TYPES.USER,
  sessionAuthKind: "PUBLIC" as const,
};

describe("sessiya proyeksiyası", () => {
  it("imzalı claim D1 istifadəçi və auth flow ilə üst-üstə düşəndə qəbul edilir", () => {
    expect(matchesSessionProjection(claims, resolved)).toBe(true);
  });

  it("ictimai sessiyanın STAFF claim-i ilə panelə çevrilməsini rədd edir", () => {
    expect(
      matchesSessionProjection(
        { ...claims, accountType: ACCOUNT_TYPES.STAFF, authKind: "STAFF_2FA" },
        resolved,
      ),
    ).toBe(false);
  });

  it("eyni istifadəçi üçün səhv auth flow-u rədd edir", () => {
    expect(matchesSessionProjection({ ...claims, authKind: "STAFF_2FA" }, resolved)).toBe(false);
  });
});
