import { describe, expect, it } from "vitest";
import { REGISTRATION_CLOSE_MINUTES, slotAvailability } from "@/lib/open-house-availability";

const now = new Date("2026-10-01T09:00:00Z").getTime();
const inMinutes = (minutes: number) => new Date(now + minutes * 60_000);

describe("açıq qapı slotu", () => {
  it("başlamağa az qalmış slotda qeydiyyatı bağlayır", () => {
    expect(slotAvailability({ startsAt: inMinutes(REGISTRATION_CLOSE_MINUTES - 1), capacity: null, registered: 0 }, now)).toBe("closed");
    expect(slotAvailability({ startsAt: inMinutes(-10), capacity: null, registered: 0 }, now)).toBe("closed");
  });

  it("tutum dolanda slotu dolu sayır, məhdudiyyətsiz slot həmişə açıqdır", () => {
    expect(slotAvailability({ startsAt: inMinutes(600), capacity: 10, registered: 10 }, now)).toBe("full");
    expect(slotAvailability({ startsAt: inMinutes(600), capacity: 10, registered: 9 }, now)).toBe("open");
    expect(slotAvailability({ startsAt: inMinutes(600), capacity: null, registered: 999 }, now)).toBe("open");
  });
});
