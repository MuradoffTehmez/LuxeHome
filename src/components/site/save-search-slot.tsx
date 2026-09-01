"use client";

import { SaveSearchButton, type SavableFilters } from "./save-search-button";
import { useSessionState } from "./use-session-state";

/**
 * «Axtarışı saxla» düyməsinin görünmə qərarı.
 *
 * Bu qərar əvvəl `/emlaklar` səhifəsində serverdə verilirdi (`getOptionalUser()`),
 * yəni ən çox ziyarət olunan səhifənin HTML-i istifadəçiyə bağlı idi və heç bir
 * paylaşılan keşə salına bilmirdi. İndi server hər kəsə eyni HTML-i verir, düymə
 * isə brauzerdə sessiya vəziyyəti məlum olandan sonra əlavə olunur.
 *
 * Düymə yalnız ictimai hesab üçün göstərilir: əməkdaş hesabının saxlanmış
 * axtarışı yoxdur, panel öz alətlərini işlədir.
 */
export function SaveSearchSlot({ filters }: { filters: SavableFilters }) {
  const state = useSessionState("");

  if (state.status !== "signed-in" || state.isStaff) return null;

  return <SaveSearchButton filters={filters} />;
}
