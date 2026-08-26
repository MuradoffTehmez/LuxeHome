"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "luxehomeestate:recently-viewed";
const CHANGE_EVENT = "luxehomeestate:recently-viewed-changed";
const MAX_ITEMS = 20;

/**
 * Baxılan əmlaklar `favorites.ts` presedentinə uyğun localStorage-də saxlanılır —
 * hesabsız, brauzer-əsaslı. Ən yeni baxılan siyahının əvvəlindədir.
 */
function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // Storage bloklanıbsa (privat rejim, kvota) səssizcə keçirik
  }
}

/** Bütün son baxılan ID-ləri izləyir, ən yenisi əvvəldə. */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(read());
    setReady(true);

    const sync = () => setIds(read());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((id: string) => {
    const current = read();
    const next = [id, ...current.filter((item) => item !== id)].slice(0, MAX_ITEMS);
    write(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  return { ids, ready, add, clear };
}
