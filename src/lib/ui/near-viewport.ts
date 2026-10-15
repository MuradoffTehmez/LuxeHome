"use client";

import { useEffect, useState, type RefObject } from "react";

/** Elementə bu qədər qalmış yükləməyə başlanır — sürüşdürmədə boşluq görünməsin. */
const PRELOAD_MARGIN = "300px";

/**
 * Element görünüş sahəsinə yaxınlaşanda `true` olur və bir daha `false` olmur (#191).
 *
 * İlk ekrandan kənar ağır resurslar (Turnstile ~700 KB, xəritə tile-ları ~900 KB) mobil
 * şəbəkədə səhifənin mətni və şrifti ilə rəqabət aparırdı: elan detalında LCP 12 s idi.
 * `IntersectionObserver` yoxdursa (köhnə brauzer, test mühiti) dərhal `true` qaytarılır.
 */
export function useNearViewport(ref: RefObject<Element | null>, enabled = true): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!enabled || near) return;
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled, near]);

  return near;
}
