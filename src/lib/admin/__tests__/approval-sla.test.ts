import { describe, expect, it } from "vitest";
import { approvalSla } from "../approval-sla";

describe("approvalSla (#157)", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  const ago = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000);

  it("24 saatdan az — normal", () => {
    expect(approvalSla(ago(0), now)).toEqual({ level: "fresh", hours: 0, days: 0 });
    expect(approvalSla(ago(23.9), now).level).toBe("fresh");
  });

  it("24–72 saat — bu gün baxılmalıdır", () => {
    expect(approvalSla(ago(24), now)).toEqual({ level: "due", hours: 24, days: 1 });
    expect(approvalSla(ago(71), now).level).toBe("due");
  });

  it("72 saatdan çox — gecikib", () => {
    expect(approvalSla(ago(72), now)).toEqual({ level: "overdue", hours: 72, days: 3 });
    expect(approvalSla(ago(24 * 10), now).days).toBe(10);
  });

  it("gələcək tarix (saat fərqi) mənfi vermir; ISO sətri qəbul olunur", () => {
    expect(approvalSla(new Date(now.getTime() + 60_000), now)).toEqual({ level: "fresh", hours: 0, days: 0 });
    expect(approvalSla(ago(30).toISOString(), now).level).toBe("due");
  });
});
