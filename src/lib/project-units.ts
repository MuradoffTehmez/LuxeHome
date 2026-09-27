import { PROJECT_UNIT_STATUSES, type ProjectUnitStatus } from "@/lib/constants";

/**
 * Mənzil şahmatı (#107) — saf funksiyalar (generator, qruplaşdırma, xülasə).
 * Server və brauzer eyni məntiqi işlədir, ona görə burada D1/Prisma yoxdur.
 */

/** Bir generator çağırışının yarada biləcəyi mənzil həddi — səhv daxil edilmiş «500 mərtəbə» qoruması. */
export const MAX_GENERATED_UNITS = 1500;

export type GenerateUnitsInput = {
  blocks: string[];
  floorFrom: number;
  floorTo: number;
  unitsPerFloor: number;
  rooms: number | null;
  area: number | null;
};

export type GeneratedUnit = { block: string; floor: number; number: string; rooms: number | null; area: number | null };

/**
 * Blok × mərtəbə × mənzil şəbəkəsi. Nömrə formatı «mərtəbə + iki rəqəmli sıra» (7-ci
 * mərtəbənin 3-cü mənzili → «703») — Bakı yeni tikililərində ən çox işlənən sxem.
 */
export function generateUnits(input: GenerateUnitsInput): GeneratedUnit[] | null {
  const blocks = [...new Set(input.blocks.map((block) => block.trim()).filter(Boolean))];
  const { floorFrom, floorTo, unitsPerFloor } = input;
  if (blocks.length === 0 || !Number.isInteger(floorFrom) || !Number.isInteger(floorTo) || !Number.isInteger(unitsPerFloor)) return null;
  if (floorFrom < -3 || floorTo > 200 || floorFrom > floorTo || unitsPerFloor < 1 || unitsPerFloor > 40) return null;
  if (blocks.length * (floorTo - floorFrom + 1) * unitsPerFloor > MAX_GENERATED_UNITS) return null;

  const units: GeneratedUnit[] = [];
  for (const block of blocks) {
    for (let floor = floorFrom; floor <= floorTo; floor += 1) {
      for (let index = 1; index <= unitsPerFloor; index += 1) {
        units.push({ block, floor, number: `${floor}${String(index).padStart(2, "0")}`, rooms: input.rooms, area: input.area });
      }
    }
  }
  return units;
}

export type UnitView = {
  id: string;
  block: string;
  floor: number;
  number: string;
  rooms: number | null;
  area: number | null;
  price: number | null;
  currency: string;
  status: ProjectUnitStatus;
};

export type BlockGrid = { block: string; floors: { floor: number; units: UnitView[] }[] };

const naturalCompare = (left: string, right: string) => left.localeCompare(right, "az", { numeric: true });

/** Blok → mərtəbə (yuxarıdan aşağı, binanın özü kimi) → mənzil nömrəsi. */
export function groupUnitsForGrid(units: UnitView[]): BlockGrid[] {
  const blocks = new Map<string, Map<number, UnitView[]>>();
  for (const unit of units) {
    const floors = blocks.get(unit.block) ?? new Map<number, UnitView[]>();
    const list = floors.get(unit.floor) ?? [];
    list.push(unit);
    floors.set(unit.floor, list);
    blocks.set(unit.block, floors);
  }
  return [...blocks.entries()]
    .sort(([left], [right]) => naturalCompare(left, right))
    .map(([block, floors]) => ({
      block,
      floors: [...floors.entries()]
        .sort(([left], [right]) => right - left)
        .map(([floor, list]) => ({ floor, units: list.sort((left, right) => naturalCompare(left.number, right.number)) })),
    }));
}

export function unitSummary(units: { status: string }[]) {
  const count = (status: ProjectUnitStatus) => units.filter((unit) => unit.status === status).length;
  return {
    total: units.length,
    available: count(PROJECT_UNIT_STATUSES.AVAILABLE),
    reserved: count(PROJECT_UNIT_STATUSES.RESERVED),
    sold: count(PROJECT_UNIT_STATUSES.SOLD),
  };
}
