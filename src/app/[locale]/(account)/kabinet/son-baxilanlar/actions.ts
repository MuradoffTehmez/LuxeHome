"use server";

import { getPropertiesByIds } from "@/lib/queries";

/**
 * Son baxılanlar `favoritler/actions.ts`-dəki eyni presedentə uyğundur: siyahı
 * localStorage-də saxlanılır, klient ID-ləri göndərir, server ictimai statusda
 * olan əmlakları qaytarır.
 */
export async function fetchRecentProperties(ids: string[]) {
  const safeIds = ids.filter((id) => typeof id === "string").slice(0, 100);
  return getPropertiesByIds(safeIds);
}
