import { describe, expect, it } from "vitest";
import { NEW_LEAD_SLA_HOURS, STALE_LEAD_DAYS, leadSla } from "@/lib/admin/lead-board";

const now = new Date("2026-09-27T12:00:00Z").getTime();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000);

describe("müraciət SLA-sı", () => {
  it("yeni müraciət 24 saatdan sonra gecikmiş sayılır", () => {
    expect(leadSla({ status: "NEW", createdAt: hoursAgo(NEW_LEAD_SLA_HOURS - 1), updatedAt: hoursAgo(1) }, now)).toBeNull();
    expect(leadSla({ status: "NEW", createdAt: hoursAgo(NEW_LEAD_SLA_HOURS + 1), updatedAt: hoursAgo(1) }, now)).toBe("overdue");
  });

  it("işdə olan müraciət son yeniləmədən 3 gün sonra unudulmuş sayılır", () => {
    expect(leadSla({ status: "IN_PROGRESS", createdAt: hoursAgo(500), updatedAt: hoursAgo(STALE_LEAD_DAYS * 24 - 1) }, now)).toBeNull();
    expect(leadSla({ status: "CONTACTED", createdAt: hoursAgo(500), updatedAt: hoursAgo(STALE_LEAD_DAYS * 24 + 1) }, now)).toBe("stale");
  });

  it("bağlanmış və tamamlanmış müraciətə SLA tətbiq olunmur", () => {
    expect(leadSla({ status: "COMPLETED", createdAt: hoursAgo(1000), updatedAt: hoursAgo(1000) }, now)).toBeNull();
    expect(leadSla({ status: "CLOSED", createdAt: hoursAgo(1000), updatedAt: hoursAgo(1000) }, now)).toBeNull();
  });
});
