import { describe, expect, it } from "vitest";
import { pickByArea, pickRoundRobin } from "../lead-routing";

const at = (iso: string | null) => (iso ? new Date(iso) : null);
const agents = [
  { userId: "a", lastLeadAt: at("2026-10-14T10:00:00Z"), approvedAt: at("2026-01-01T00:00:00Z") },
  { userId: "b", lastLeadAt: null, approvedAt: at("2026-03-01T00:00:00Z") },
  { userId: "c", lastLeadAt: null, approvedAt: at("2026-02-01T00:00:00Z") },
  { userId: "d", lastLeadAt: at("2026-10-13T10:00:00Z"), approvedAt: at("2026-01-01T00:00:00Z") },
];

describe("müraciət bölgüsü", () => {
  it("növbədə heç müraciət almamış, sonra ən çoxdan almış agent seçilir", () => {
    expect(pickRoundRobin(agents)?.userId).toBe("c");
    expect(pickRoundRobin(agents.filter((agent) => agent.lastLeadAt))?.userId).toBe("d");
    expect(pickRoundRobin([])).toBeNull();
  });

  it("ərazidə ən çox elanı olan agent, bərabərlikdə növbə", () => {
    expect(pickByArea(agents, new Map([["a", 3], ["d", 1]]))?.userId).toBe("a");
    expect(pickByArea(agents, new Map([["a", 2], ["d", 2]]))?.userId).toBe("d");
  });

  it("ərazidə elanı olan yoxdursa növbəyə düşür", () => {
    expect(pickByArea(agents, new Map())?.userId).toBe("c");
  });
});
