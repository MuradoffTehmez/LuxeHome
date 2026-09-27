import { describe, expect, it } from "vitest";
import { buildIcs, foldLine, icsDate, icsEscape } from "@/lib/calendar-ics";
import { bakuDayKey, bakuMonthGrid } from "@/lib/calendar-grid";

describe("ICS generatoru", () => {
  it("vaxtı UTC formatında, mətni RFC 5545 qaydası ilə yazır", () => {
    expect(icsDate(new Date("2026-10-01T09:30:00.000Z"))).toBe("20261001T093000Z");
    expect(icsEscape("Baxış; Nərimanov, 3 otaq\nqeyd")).toBe(String.raw`Baxış\; Nərimanov\, 3 otaq\nqeyd`);
  });

  it("uzun sətri 75 oktetdə qatlayır və UTF-8 simvolunu bölmür", () => {
    const folded = foldLine(`SUMMARY:${"ə".repeat(60)}`);
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.split("\r\n").slice(1).every((line) => line.startsWith(" "))).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"ə".repeat(60)}`);
  });

  it("təqvimi hadisələrlə qurur", () => {
    const ics = buildIcs("Test", [{ uid: "a@x", start: new Date("2026-10-01T09:00:00Z"), end: new Date("2026-10-01T10:00:00Z"), summary: "Baxış", status: "CONFIRMED" }], new Date("2026-09-27T00:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20261001T090000Z\r\n");
    expect(ics).toContain("STATUS:CONFIRMED\r\n");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });
});

describe("aylıq təqvim şəbəkəsi", () => {
  it("Bakı vaxtına görə gün açarı verir", () => {
    expect(bakuDayKey(new Date("2026-09-30T21:00:00Z"))).toBe("2026-10-01");
    expect(bakuDayKey(new Date("2026-09-30T19:59:00Z"))).toBe("2026-09-30");
  });

  it("bazar ertəsindən başlayan tam həftələr qurur və ay keçidlərini hesablayır", () => {
    const grid = bakuMonthGrid("2026-10", new Date("2026-10-15T08:00:00Z"));
    // 1 oktyabr 2026 cümə axşamıdır → 3 gün əvvəlki aydan
    expect(grid.days[0].key).toBe("2026-09-28");
    expect(grid.days.length % 7).toBe(0);
    expect(grid.days.filter((day) => day.inMonth)).toHaveLength(31);
    expect(grid.days.find((day) => day.isToday)?.key).toBe("2026-10-15");
    expect(grid.prev).toBe("2026-09");
    expect(bakuMonthGrid("2026-12").next).toBe("2027-01");
    expect(grid.from.toISOString()).toBe("2026-09-27T20:00:00.000Z");
    expect(bakuMonthGrid("pozulmuş", new Date("2026-03-10T00:00:00Z")).days.some((day) => day.key === "2026-03-10")).toBe(true);
  });
});
