import { describe, expect, it } from "vitest";
import { isFastResponder, summarizeResponses } from "../response-stats";

const now = new Date("2026-10-14T12:00:00Z");
const minutesAgo = (value: number) => new Date(now.getTime() - value * 60_000);
const lead = (createdAgo: number, respondedAfter: number | null) => ({
  createdAt: minutesAgo(createdAgo),
  respondedAt: respondedAfter == null ? null : new Date(minutesAgo(createdAgo).getTime() + respondedAfter * 60_000),
});

describe("cavab göstəriciləri", () => {
  it("median dəqiqəni və cavab payını hesablayır", () => {
    const summary = summarizeResponses([lead(600, 10), lead(500, 30), lead(400, 20), lead(300, null)], now);
    expect(summary).toEqual({ minutes: 20, sample: 4, rate: 75 });
  });

  it("cüt sayda cavabda iki ortanın ortasını götürür", () => {
    expect(summarizeResponses([lead(600, 10), lead(500, 20)], now).minutes).toBe(15);
  });

  it("vaxtı hələ bitməmiş cavabsız müraciəti nümunəyə salmır", () => {
    const summary = summarizeResponses([lead(600, 5), lead(10, null)], now);
    expect(summary).toEqual({ minutes: 5, sample: 1, rate: 100 });
  });

  it("boş nümunədə göstərici yoxdur", () => {
    expect(summarizeResponses([], now)).toEqual({ minutes: null, sample: 0, rate: null });
  });

  it("nişan nümunə, median və pay həddinə baxır", () => {
    expect(isFastResponder({ minutes: 20, sample: 5, rate: 90 })).toBe(true);
    expect(isFastResponder({ minutes: 20, sample: 2, rate: 100 })).toBe(false);
    expect(isFastResponder({ minutes: 90, sample: 5, rate: 100 })).toBe(false);
    expect(isFastResponder({ minutes: 20, sample: 5, rate: 60 })).toBe(false);
    expect(isFastResponder({ minutes: null, sample: 5, rate: null })).toBe(false);
  });
});
