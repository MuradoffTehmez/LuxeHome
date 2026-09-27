import { describe, expect, it } from "vitest";
import { MAX_GENERATED_UNITS, generateUnits, groupUnitsForGrid, unitSummary, type UnitView } from "@/lib/project-units";

describe("mənzil şahmatı", () => {
  it("blok × mərtəbə × mənzil şəbəkəsini yaradır, nömrəni mərtəbə+sıra formatında verir", () => {
    const units = generateUnits({ blocks: ["A", " B ", "A"], floorFrom: 1, floorTo: 3, unitsPerFloor: 4, rooms: 2, area: 70 });
    expect(units).toHaveLength(2 * 3 * 4);
    expect(units?.[0]).toEqual({ block: "A", floor: 1, number: "101", rooms: 2, area: 70 });
    expect(units?.at(-1)).toMatchObject({ block: "B", floor: 3, number: "304" });
  });

  it("mənasız və həddən böyük girişi rədd edir", () => {
    expect(generateUnits({ blocks: [], floorFrom: 1, floorTo: 3, unitsPerFloor: 4, rooms: null, area: null })).toBeNull();
    expect(generateUnits({ blocks: ["A"], floorFrom: 5, floorTo: 3, unitsPerFloor: 4, rooms: null, area: null })).toBeNull();
    expect(generateUnits({ blocks: ["A", "B"], floorFrom: 1, floorTo: 100, unitsPerFloor: 10, rooms: null, area: null })).toBeNull();
    expect(2 * 100 * 10).toBeGreaterThan(MAX_GENERATED_UNITS);
  });

  it("şəbəkəni blok, yuxarıdan aşağı mərtəbə və təbii nömrə sırası ilə qruplaşdırır", () => {
    const unit = (block: string, floor: number, number: string, status: UnitView["status"] = "AVAILABLE"): UnitView =>
      ({ id: `${block}${number}`, block, floor, number, rooms: null, area: null, price: null, currency: "AZN", status });
    const grid = groupUnitsForGrid([unit("B", 1, "101"), unit("A", 1, "110"), unit("A", 1, "102"), unit("A", 2, "201", "SOLD")]);
    expect(grid.map((block) => block.block)).toEqual(["A", "B"]);
    expect(grid[0].floors.map((floor) => floor.floor)).toEqual([2, 1]);
    expect(grid[0].floors[1].units.map((item) => item.number)).toEqual(["102", "110"]);
    expect(unitSummary(grid.flatMap((block) => block.floors.flatMap((floor) => floor.units)))).toEqual({ total: 4, available: 3, reserved: 0, sold: 1 });
  });
});
