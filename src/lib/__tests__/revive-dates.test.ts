import { describe, expect, it } from "vitest";
import { reviveDates } from "@/lib/revive-dates";

describe("reviveDates", () => {
  it("keşdən JSON kimi qayıdan tarixləri Date-ə çevirir", () => {
    const source = {
      legalReviewedAt: new Date("2026-08-30T00:00:00.000Z"),
      priceHistory: [{ changedAt: new Date("2026-09-01T10:15:00.000Z"), newPrice: 1 }],
      category: { name: "Kirayə", updatedAt: new Date("2026-09-02T00:00:00.000Z") },
    };
    const fromCache = JSON.parse(JSON.stringify(source));
    const revived = reviveDates(fromCache);

    expect(revived.legalReviewedAt).toBeInstanceOf(Date);
    expect(revived.priceHistory[0].changedAt.toISOString()).toBe("2026-09-01T10:15:00.000Z");
    expect(revived.category.updatedAt).toBeInstanceOf(Date);
    // Əvvəl məhz bu çağırış keş dolandan sonra RangeError atırdı.
    expect(() => new Intl.DateTimeFormat("az").format(revived.legalReviewedAt)).not.toThrow();
  });

  it("ISO formatında olan adi mətn sahəsini (başlıq) Date-ə çevirmir", () => {
    const revived = reviveDates(
      JSON.parse(JSON.stringify({ title: "2026-09-01T10:15:00.000Z", items: ["2026-09-01T10:15:00.000Z"], updatedAt: new Date("2026-09-01T10:15:00.000Z") })),
    );
    expect(revived.title).toBe("2026-09-01T10:15:00.000Z");
    expect(revived.items[0]).toBe("2026-09-01T10:15:00.000Z");
    expect(revived.updatedAt).toBeInstanceOf(Date);
  });

  it("sxemin bütün tarix adlandırma formalarını tanıyır", () => {
    const iso = "2026-01-01T00:00:00.000Z";
    const revived = reviveDates({ featuredUntil: iso, birthDate: iso, officialSince: iso, reviewAfter: iso, requestedFor: iso, date: iso });
    for (const value of Object.values(revived)) expect(value).toBeInstanceOf(Date);
  });

  it("adi mətnə, null-a və artıq Date olan dəyərə toxunmur", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const revived = reviveDates({
      title: "2026-cı il üçün bələdçi",
      day: "2026-08-30",
      empty: null,
      date,
      count: 3,
    });
    expect(revived).toEqual({ title: "2026-cı il üçün bələdçi", day: "2026-08-30", empty: null, date, count: 3 });
    expect(revived.date).toBe(date);
  });
});
