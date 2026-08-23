export type FocusDirection = "forward" | "backward";

export type FocusWrapInput = {
  activeIndex: number;
  itemCount: number;
  direction: FocusDirection;
};

/**
 * Fokus overlay sərhədindən çıxmağa çalışanda dövrün qarşı ucunu qaytarır.
 * Sərhəddə deyilsə brauzerin normal Tab davranışına müdaxilə etmir.
 */
export function getFocusWrapIndex({
  activeIndex,
  itemCount,
  direction,
}: FocusWrapInput): number | null {
  if (itemCount <= 0) return null;
  if (activeIndex < 0) return direction === "backward" ? itemCount - 1 : 0;
  if (direction === "backward" && activeIndex <= 0) return itemCount - 1;
  if (direction === "forward" && activeIndex >= itemCount - 1) return 0;
  return null;
}
