import { describe, expect, it } from "vitest";

import { canAttemptDeploymentReload, isStaleDeploymentError } from "../deployment-recovery";

describe("deploy-dan sonra köhnə tabın bərpası", () => {
  it.each([
    'Server Action "abc123" was not found on the server.',
    'Failed to find Server Action "abc123". This request might be from an older or newer deployment.',
    "Loading chunk 8450 failed.",
    "ChunkLoadError: Loading chunk 12 failed",
  ])("köhnə deploy xətasını tanıyır: %s", (message) => {
    expect(isStaleDeploymentError(message)).toBe(true);
  });

  it.each(["Connection closed.", "Favorit sinxronu alınmadı", "Naməlum xəta"])(
    "adi runtime xətasını reload səbəbi saymır: %s",
    (message) => {
      expect(isStaleDeploymentError(message)).toBe(false);
    },
  );

  it("reload-u bir dəqiqədə bir dəfədən çox etmir", () => {
    expect(canAttemptDeploymentReload(null, 100_000)).toBe(true);
    expect(canAttemptDeploymentReload("90000", 100_000)).toBe(false);
    expect(canAttemptDeploymentReload("40000", 100_000)).toBe(true);
    expect(canAttemptDeploymentReload("pozulmuş", 100_000)).toBe(true);
  });
});

