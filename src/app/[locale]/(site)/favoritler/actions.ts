"use server";

import { getPropertiesByIds } from "@/lib/queries";

/**
 * Favoritlər localStorage-də saxlanılır, ona görə siyahı yalnız brauzerdə məlumdur.
 * Klient ID-ləri göndərir, server isə ictimai statusda olan əmlakları qaytarır.
 */
export async function fetchFavoriteProperties(ids: string[]) {
  // Sui-istifadəyə qarşı sadə hədd — bir sorğuda maksimum 100 ID
  const safeIds = ids.filter((id) => typeof id === "string").slice(0, 100);
  return getPropertiesByIds(safeIds);
}
