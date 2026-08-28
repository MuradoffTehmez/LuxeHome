"use client";

import { useCallback, useEffect, useState } from "react";
import { mergeFavoriteIds, sanitizeFavoriteIds } from "@/lib/favorite-sync";

const STORAGE_KEY = "luxehomeestate:favorites";
const CHANGE_EVENT = "luxehomeestate:favorites-changed";

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
    return sanitizeFavoriteIds(parsed);
  } catch {
    return [];
  }
}

async function readAccountFavorites(local: string[]): Promise<string[] | null> {
  try {
    const response = await fetch("/api/hesab/favoritler", { credentials: "same-origin", cache: "no-store" });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("Favorit sinxronu alınmadı");
    const payload = await response.json() as { ids?: unknown };
    const merged = mergeFavoriteIds(local, sanitizeFavoriteIds(payload.ids));
    await persistAccountFavorites(merged);
    return merged;
  } catch {
    return null;
  }
}

async function persistAccountFavorites(ids: string[]): Promise<void> {
  const response = await fetch("/api/hesab/favoritler", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok && response.status !== 401) throw new Error("Favoritlər saxlanılmadı");
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
    const local = read();
    setIds(local);
    void readAccountFavorites(local).then((synced) => {
      if (synced) {
        write(synced);
        setIds(synced);
      }
      setReady(true);
    });

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
    void persistAccountFavorites(next).catch(() => undefined);
    return next.includes(id);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
    void persistAccountFavorites([]).catch(() => undefined);
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
