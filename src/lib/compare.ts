"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "luxehomeestate:compare";
const CHANGE_EVENT = "luxehomeestate:compare-changed";
/** Müqayisə cədvəli oxunaqlı qalsın deyə maksimum əmlak sayı. */
export const MAX_COMPARE = 4;

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

/** Bütün müqayisə ID-lərini izləyir. */
export function useCompareList() {
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
    let next: string[];
    let added = false;

    if (current.includes(id)) {
      next = current.filter((item) => item !== id);
    } else if (current.length >= MAX_COMPARE) {
      next = current;
    } else {
      next = [...current, id];
      added = true;
    }

    write(next);
    setIds(next);
    return added;
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((item) => item !== id);
    write(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  return { ids, ready, toggle, remove, clear, count: ids.length };
}

/** Tək bir əmlakın müqayisə vəziyyətini izləyir. */
export function useCompareItem(propertyId: string) {
  const { ids, ready, toggle, count } = useCompareList();
  return {
    isComparing: ids.includes(propertyId),
    ready,
    atLimit: count >= MAX_COMPARE && !ids.includes(propertyId),
    toggle: () => toggle(propertyId),
  };
}
