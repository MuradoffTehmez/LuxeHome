import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("analytics translation context", () => {
  it("AnalyticsProvider-i NextIntlClientProvider daxilində saxlayır", () => {
    const source = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const intlStart = source.indexOf("<NextIntlClientProvider");
    const analytics = source.indexOf("<AnalyticsProvider />");
    const intlEnd = source.indexOf("</NextIntlClientProvider>");

    expect(intlStart).toBeGreaterThan(-1);
    expect(analytics).toBeGreaterThan(intlStart);
    expect(intlEnd).toBeGreaterThan(analytics);
  });
});
