"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "luxehome:favorites";
const CHANGE_EVENT = "luxehome:favorites-changed";

/**
 * Favoritlər qeydiyyatsız istifadəçilər üçün localStorage-də saxlanılır.
 * Gələcəkdə istifadəçi hesabları əlavə edildikdə `Favorite` modeli ilə
 * sinxronlaşdırıla bilər — API səthi eyni qalır.
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
    // Storage bloklanıbsa (privat rejim, kvota) səssizcə keçirik —
    // favorit funksiyası saytın əsas işini dayandırmamalıdır.
  }
}

/** Bütün favorit ID-lərini izləyir. */
export function useFavorites() {
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

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    write(next);
    setIds(next);
    return next.includes(id);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  return { ids, ready, toggle, clear, count: ids.length };
}

/** Tək bir əmlakın favorit vəziyyətini izləyir. */
export function useFavorite(propertyId: string) {
  const { ids, ready, toggle } = useFavorites();
  return {
    isFavorite: ids.includes(propertyId),
    ready,
    toggle: () => toggle(propertyId),
  };
}
