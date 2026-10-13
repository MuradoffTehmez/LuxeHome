import { describe, expect, it } from "vitest";
import { advisoryId, evaluateAudit } from "../audit-gate.mjs";

const braces = {
  name: "braces",
  severity: "high",
  title: "braces vulnerable to stack-exhaustion",
  url: "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm",
};
const report = {
  vulnerabilities: {
    braces: { severity: "high", via: [braces] },
    micromatch: { severity: "high", via: ["braces"] },
  },
};
const allowlist = [{ id: "GHSA-vfj7-8cjw-p6xm", reason: "dev zənciri", expires: "2026-11-15" }];

describe("audit qapısı", () => {
  it("GHSA identifikatorunu URL-dən çıxarır", () => {
    expect(advisoryId(braces.url)).toBe("GHSA-vfj7-8cjw-p6xm");
    expect(advisoryId("https://example.com")).toBeNull();
  });

  it("istisnada olan advisory qapını saxlamır, miras alan paket ayrıca sayılmır", () => {
    const result = evaluateAudit(report, allowlist, new Date("2026-10-14"));
    expect(result.ok).toBe(true);
    expect(result.allowed).toHaveLength(1);
  });

  it("müddəti bitmiş istisna qapını yıxır", () => {
    const result = evaluateAudit(report, allowlist, new Date("2026-11-16"));
    expect(result.ok).toBe(false);
    expect(result.expired.map((item: { id: string }) => item.id)).toEqual(["GHSA-vfj7-8cjw-p6xm"]);
  });

  it("siyahıdan kənar high/critical advisory qapını yıxır, orta səviyyə yox", () => {
    const result = evaluateAudit(
      {
        vulnerabilities: {
          next: { severity: "high", via: [{ name: "next", severity: "high", title: "cache poisoning", url: "https://github.com/advisories/GHSA-mcj8-r9mp-w47p" }] },
          "smol-toml": { severity: "moderate", via: [{ name: "smol-toml", severity: "moderate", title: "slow parse", url: "https://github.com/advisories/GHSA-r4xh-jqrq-34v2" }] },
        },
      },
      allowlist,
      new Date("2026-10-14"),
    );
    expect(result.ok).toBe(false);
    expect(result.blocking.map((item: { id: string }) => item.id)).toEqual(["GHSA-mcj8-r9mp-w47p"]);
  });
});
