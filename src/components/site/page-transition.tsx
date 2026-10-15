"use client";

import { useEffect, useState } from "react";

/** Səhifənin ilk (server) render-i hidrasiya olunubmu — modul səviyyəsində, bütün sessiya üçün. */
let hydrated = false;

/**
 * Səhifə keçidi sarğısı (`(site)/template.tsx`).
 *
 * Animasiya **yalnız client naviqasiyasında** işləyir (#193). İlk açılışda məzmun opacity 0-dan
 * başlayanda Chrome onu LCP namizədi saymırdı: mobil ana səhifədə LCP başlıq əvəzinə header-dəki
 * 32 px loqoya düşürdü və 4,5 s idi. Hidrasiya render-i `data-animate` vermir (server HTML ilə
 * eyni); sonrakı naviqasiyalarda mount olunan yeni sarğı onu alır. Köhnə sarğıya toxunulmur —
 * klik anında köhnə səhifə yanıb-sönmür.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [animate] = useState(() => hydrated);

  useEffect(() => {
    hydrated = true;
  }, []);

  return (
    <div className="page-transition" data-animate={animate ? "" : undefined}>
      {children}
    </div>
  );
}
