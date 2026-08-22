"use server";

import { getPropertiesForCompare } from "@/lib/queries";

/**
 * Müqayisə siyahısı localStorage-də saxlanılır, ona görə yalnız brauzerdə məlumdur.
 * Klient ID-ləri göndərir, server isə ictimai statusda olan əmlakları qaytarır.
 */
export async function fetchCompareProperties(ids: string[]) {
  // Sui-istifadəyə qarşı sadə hədd
  const safeIds = ids.filter((id) => typeof id === "string").slice(0, 10);
  return getPropertiesForCompare(safeIds);
}
