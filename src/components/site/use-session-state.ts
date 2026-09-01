"use client";

import { useEffect, useState } from "react";

import { usePathname } from "@/i18n/navigation";

/**
 * Brauzer tərəfdə sessiya vəziyyəti.
 *
 * Sessiyanı server komponentində oxumaq ictimai səhifəni istifadəçiyə bağlayır:
 * HTML hər ziyarətçi üçün fərqli olur və paylaşılan keşə salına bilmir. Ona görə
 * vəziyyət yüngül `/api/hesab/menu` marşrutundan alınır — həmin cavab `no-store`
 * ilə gəlir və heç vaxt keşlənmir.
 *
 * Keş modul səviyyəsindədir: eyni səhifədəki hesab menyusu və «axtarışı saxla»
 * düyməsi bir sorğunu bölüşür, naviqasiyada isə köhnə dəyər dərhal göstərilir.
 */

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "signed-in"; name: string; isStaff: boolean; unreadNotifications: number };

type MenuPayload = {
  signedIn: boolean;
  name?: string;
  isStaff?: boolean;
  unreadNotifications?: number;
};

/** Keş nə qədər «təzə» sayılır — bu müddət ərzində sorğu ümumiyyətlə getmir. */
const FRESH_MS = 60_000;

let cache: { state: SessionState; at: number } | null = null;
let inFlight: Promise<SessionState> | null = null;

/** Giriş/qeydiyyat/kabinet marşrutlarında sessiya vəziyyəti dəyişmiş ola bilər. */
function isAuthBoundary(path: string): boolean {
  return (
    path.includes("/daxil-ol") ||
    path.includes("/qeydiyyat") ||
    path.includes("/kabinet") ||
    path.includes("/giris")
  );
}

async function fetchSessionState(fallbackName: string): Promise<SessionState> {
  // Eyni anda iki komponent çağırsa, sorğu bir dəfə gedir
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const response = await fetch("/api/hesab/menu", { cache: "no-store" });
      if (!response.ok) throw new Error("menu");
      const data = (await response.json()) as MenuPayload;
      return data.signedIn
        ? ({
            status: "signed-in",
            name: data.name ?? fallbackName,
            isStaff: data.isStaff === true,
            unreadNotifications: data.unreadNotifications ?? 0,
          } as const)
        : ({ status: "anonymous" } as const);
    } catch {
      // Şəbəkə xətasında ziyarətçi qonaq kimi göstərilir — menyu sınmır
      return { status: "anonymous" } as const;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Giriş/çıxış axını keşi açıq şəkildə sıfırlayır. */
export function resetSessionStateCache(): void {
  cache = null;
}

export function useSessionState(fallbackName: string): SessionState {
  // Keşdə dəyər varsa ilk render-də dərhal göstərilir — «yox olub qayıtma» olmur
  const [state, setState] = useState<SessionState>(() => cache?.state ?? { status: "loading" });
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    // Auth sərhədində keş etibarsızdır: istifadəçi indicə girmiş və ya çıxmış ola bilər
    const stale = !cache || Date.now() - cache.at > FRESH_MS || isAuthBoundary(pathname);

    if (!stale) {
      setState(cache!.state);
      return;
    }

    void fetchSessionState(fallbackName).then((next) => {
      cache = { state: next, at: Date.now() };
      if (active) setState(next);
    });

    return () => {
      active = false;
    };
  }, [pathname, fallbackName]);

  return state;
}
