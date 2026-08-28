import { afterEach, describe, expect, it } from "vitest";
import { hasRuntimeEnv, runtimeEnv } from "@/lib/runtime-env";

describe("runtimeEnv", () => {
  const key = "LUXE_RUNTIME_ENV_TEST";

  afterEach(() => {
    delete process.env[key];
  });

  it("process mühitindəki boş olmayan dəyəri oxuyur", () => {
    process.env[key] = "  aktiv  ";
    expect(runtimeEnv(key)).toBe("aktiv");
    expect(hasRuntimeEnv(key)).toBe(true);
  });

  it("boş dəyəri konfiqurasiya saymır", () => {
    process.env[key] = "   ";
    expect(runtimeEnv(key)).toBeUndefined();
    expect(hasRuntimeEnv(key)).toBe(false);
  });
});
