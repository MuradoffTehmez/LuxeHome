"use client";

import { useEffect, useRef, useState } from "react";

const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      appearance: "always";
      size: "normal" | "compact";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      "response-field": true;
      "response-field-name": string;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-luxe-turnstile]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile script error")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.luxeTurnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script error"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileWidget({
  action,
  resetSignal,
}: {
  action: string;
  resetSignal?: unknown;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const initialResetRef = useRef(true);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // `normal` widget sabit 300px-dir. Konteyner bu həddi keçəndə (fırlanma, split-screen)
  // widget uyğun ölçüdə yenidən render olunur — yoxsa üfüqi daşma geri qayıdırdı.
  const [size, setSize] = useState<"normal" | "compact" | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setSize(element.clientWidth < 300 ? "compact" : "normal");
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/security/turnstile", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((value) => {
        const result = value as { siteKey?: string };
        if (active && result.siteKey) setSiteKey(result.siteKey);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!siteKey || !size || !containerRef.current) return;
    let active = true;
    loadTurnstileScript()
      .then(() => {
        if (!active || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          appearance: "always",
          // Dar konteynerdə rəsmi `compact` (150px) ölçüsü — 320px ekranda 300px-lik
          // `normal` widget forma kartına sığmır və səhifəni üfüqi daşdırırdı.
          size,
          "response-field": true,
          "response-field-name": TURNSTILE_RESPONSE_FIELD,
          callback: () => setFailed(false),
          "expired-callback": () => undefined,
          "error-callback": () => {
            setFailed(true);
          },
        });
      })
      .catch(() => setFailed(true));
    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, siteKey, size]);

  useEffect(() => {
    if (initialResetRef.current) {
      initialResetRef.current = false;
      return;
    }
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  return (
    // `aria-label` yalnız rolu olan elementdə keçərlidir; role-suz `div`-də
    // axe onu «aria-prohibited-attr» kimi işarələyir (WCAG 4.1.2). Widget
    // qrup kimi elan olunur ki, etiket ekran oxuyucuya çatsın.
    // `overflow-hidden`: widget-in 300px min-content eni valideyn kartı böyütməsin —
    // əks halda konteyner heç vaxt 300px-dən daralmır və ResizeObserver `compact`-a
    // keçməyi görmürdü (ölçü dəyişəndə forma yenə daşırdı).
    <div className="min-h-[65px] w-full min-w-0 overflow-hidden" role="group" aria-label="Təhlükəsizlik yoxlaması">
      <div ref={containerRef} className="w-full" />
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Təhlükəsizlik yoxlaması yüklənmədi. Səhifəni yeniləyib yenidən cəhd edin.
        </p>
      )}
    </div>
  );
}
