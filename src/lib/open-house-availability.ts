/** Açıq qapı slotunun vəziyyəti (#109) — saf, brauzer komponenti də idxal edir. */

/** Başlamağa bu qədər qalmış slota qeydiyyat bağlanır. */
export const REGISTRATION_CLOSE_MINUTES = 30;

export type SlotAvailability = "open" | "full" | "closed";

export function slotAvailability(
  slot: { startsAt: Date; capacity: number | null; registered: number },
  now = Date.now(),
): SlotAvailability {
  if (slot.startsAt.getTime() - now < REGISTRATION_CLOSE_MINUTES * 60_000) return "closed";
  if (slot.capacity !== null && slot.registered >= slot.capacity) return "full";
  return "open";
}

