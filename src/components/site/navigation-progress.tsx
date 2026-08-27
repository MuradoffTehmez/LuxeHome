"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Səhifə keçidi zamanı yuxarıda incə irəliləyiş zolağı.
 *
 * Niyə lazımdır: bütün ictimai səhifələr `force-dynamic`-dir və `(site)` ağacında
 * `loading.tsx` **qəsdən yoxdur** — `loading.tsx` streaming-i məcbur edir, streaming
 * isə HTTP başlıqlarını erkən göndərib `notFound()`-un 404 statusunu qaytarmasına
 * mane olur (bax `74052c8` commit-i). Nəticədə klikdən sonra brauzer köhnə səhifədə
 * donub qalırdı: heç bir geri bildiriş yox idi.
 *
 * Zolaq həmin boşluğu Suspense sərhədi yaratmadan doldurur — status kodları
 * toxunulmaz qalır.
 *
 * Zolaq sonadək dolmur: 90%-də dayanır, çünki real müddət əvvəlcədən bilinmir.
 * Marşrut dəyişən kimi 100%-ə tullanıb sönür.
 */

/** Zolağın sönmə animasiyasının müddəti — CSS ilə eyni olmalıdır. */
const FADE_MS = 250;

/**
 * Naviqasiya baş tutmasa (şəbəkə qırıldı, istifadəçi dayandırdı) zolaq əbədi
 * asılı qalmamalıdır.
 */
const STALL_MS = 15_000;

const START_EVENT = "luxe:navigation-start";

/**
 * `router.push()` / `router.replace()` ilə gedən naviqasiyalar üçün.
 *
 * Klik dinləyicisi yalnız `<a href>` elementlərini tutur; dil dəyişdirici və
 * sıralama seçimi isə düymədən proqram yolu ilə keçid edir, ona görə zolağı
 * özləri işə salmalıdır.
 */
export function startNavigationProgress(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(START_EVENT));
}

function isModifiedClick(event: MouseEvent): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

/** Keçid həqiqətən naviqasiyadırmı — eyni ünvana klik zolaq açmamalıdır. */
function isInternalNavigation(target: URL): boolean {
  if (target.origin !== window.location.origin) return false;
  // Yalnız hash dəyişirsə səhifə yenidən yüklənmir
  if (target.pathname === window.location.pathname && target.search === window.location.search) {
    return false;
  }
  return true;
}

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // `null` = zolaq gizlidir; ədəd = cari faiz
  const [progress, setProgress] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  // --- Naviqasiya başladı ---------------------------------------------------
  useEffect(() => {
    function start() {
      setVisible(true);
      setProgress(8);
    }

    function onClick(event: MouseEvent) {
      if (isModifiedClick(event)) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (!isInternalNavigation(url)) return;

      start();
    }

    // Axtarış paneli GET forması ilə göndərilir — klik dinləyicisi onu tutmur
    function onSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.method && form.method.toLowerCase() !== "get") return;
      start();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", start);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener(START_EVENT, start);
    };
  }, []);

  // --- Asılı qalmaya qarşı qoruma ------------------------------------------
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setProgress(null);
    }, STALL_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  // --- İrəliləyiş simulyasiyası ---------------------------------------------
  useEffect(() => {
    if (progress === null || progress >= 90) return;

    // Sona yaxınlaşdıqca addım kiçilir — «az qalıb» hissi yaradır
    const timer = setTimeout(() => {
      setProgress((current) => {
        if (current === null) return current;
        const remaining = 90 - current;
        return current + Math.max(remaining * 0.18, 0.5);
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [progress]);

  // --- Naviqasiya bitdi -----------------------------------------------------
  //
  // Marşrut dəyişəndə (yol və ya query) React yenidən render edir — bu, keçidin
  // tamamlandığının yeganə etibarlı siqnalıdır.
  const routeKey = `${pathname}?${searchParams.toString()}`;
  useEffect(() => {
    setProgress(100);
    const timer = setTimeout(() => {
      setVisible(false);
      setProgress(null);
    }, FADE_MS);
    return () => clearTimeout(timer);
  }, [routeKey]);

  if (!visible || progress === null) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5"
    >
      <div
        className="h-full bg-gold transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          transitionDuration: progress >= 100 ? `${FADE_MS}ms` : undefined,
        }}
      />
    </div>
  );
}

/**
 * `useSearchParams` Suspense sərhədi tələb edir. Sərhəd **yalnız bu komponenti**
 * əhatə edir — səhifə məzmunu ondan kənarda qalır, ona görə status kodlarına
 * təsir etmir.
 */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
