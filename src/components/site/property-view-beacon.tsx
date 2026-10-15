"use client";

import { useEffect } from "react";

/**
 * Elan baxışını brauzerdən sayır (#177). Sayğac əvvəllər səhifənin render-ində idi və
 * detal səhifəsini kənar keşdən kənarda saxlayırdı. `keepalive` — ziyarətçi dərhal başqa
 * səhifəyə keçsə də sorğu getsin; nəticə gözlənilmir, xəta udulur. Effekt yalnız elan
 * dəyişəndə işləyir, ona görə eyni açılış bir dəfə sayılır.
 */
export function PropertyViewBeacon({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    void fetch(`/api/emlaklar/${encodeURIComponent(propertyId)}/baxis`, { method: "POST", keepalive: true }).catch(() => undefined);
  }, [propertyId]);

  return null;
}
