"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

const SYNCED_KEY = "lhe-theme-synced";

/**
 * Yeni cihazda ilk girişdə profildəki mövzu seçimini tətbiq edir.
 *
 * Bir dəfəlikdir: sonra `localStorage`-dakı `theme` açarı (next-themes-in özü
 * idarə edir) üstünlük təşkil edir ki, cihazdakı əl ilə seçim hər səhifə
 * keçidində DB dəyəri ilə əvəz olunmasın.
 */
export function ThemeSync({ preference }: { preference: string }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SYNCED_KEY)) return;
    window.localStorage.setItem(SYNCED_KEY, "1");
    // Köhnə `system` qeydləri də daxil olmaqla bütün naməlum dəyərlər light-a
    // miqrasiya olunur. Sayt cihaz mövzusunu avtomatik oxumur.
    setTheme(preference === "dark" ? "dark" : "light");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
