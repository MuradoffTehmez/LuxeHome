import { describe, expect, it } from "vitest";
import { formatOgPrice } from "@/lib/og-price";

describe("formatOgPrice", () => {
  it("minlikləri boşluqla ayırır və AZN kodunu yazır («₼» OG şriftində yoxdur)", () => {
    expect(formatOgPrice(350000, "AZN")).toBe("350 000 AZN");
    expect(formatOgPrice(1250.4, "AZN")).toBe("1 250 AZN");
  });

  it("USD və EUR üçün simvolu qabağa qoyur", () => {
    expect(formatOgPrice(1200000, "USD")).toBe("$1 200 000");
    expect(formatOgPrice(900, "EUR")).toBe("€900");
  });
});
