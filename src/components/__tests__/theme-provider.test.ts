import { describe, expect, it } from "vitest";
import { THEME_RUNTIME_SHIM } from "@/lib/theme-runtime";

describe("ThemeProvider", () => {
  it("OpenNext-in adlandırma köməkçisi ilə çevirdiyi mövzu skriptini işlədir", () => {
    const functionName = new Function(
      `${THEME_RUNTIME_SHIM}\nreturn __name(function () {}, "updateTheme").name;`,
    )();

    expect(functionName).toBe("updateTheme");
  });
});
